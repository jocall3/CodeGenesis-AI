import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateUnitTestsStream, analyzeCodeWithGemini, downloadFile, TelemetryService, AuditLogService, FeatureFlagService } from '../services/index';
import { BeakerIcon, ArrowDownTrayIcon, Cog6ToothIcon, DocumentDuplicateIcon, ShareIcon, CodeBracketSquareIcon, ServerStackIcon, CloudArrowUpIcon, RocketLaunchIcon, CpuChipIcon, FolderOpenIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, LightBulbIcon, AdjustmentsHorizontalIcon, ArchiveBoxIcon, ChartBarIcon } from './icons';
import { LoadingSpinner, Modal, Tooltip, Alert, Button, Select, Input, Checkbox, Textarea, CodeEditor, Tabs, TabPanel, ProgressBar, Notification, MarkdownRenderer } from './shared/index';
import { 
    AiModelProvider, TestFramework, AssertionLibrary, CodeLanguage, TestType, GenerationStrategy, 
    TestGenerationOptions, CodeAnalysisReport, ProjectMetadata, UserPreferences, GeneratedTestArtifact, RiskLevel 
} from '../types';

// Mock Data & Defaults
const defaultUser = {
    id: 'user_cg_123',
    name: 'Synaptic Solutions Dev',
    email: 'dev@synaptic.com',
    roles: ['admin', 'developer', 'qa_engineer'],
};

const defaultProject: ProjectMetadata = {
    projectId: 'proj_cg_core',
    projectName: 'CodeGenesis AI Core',
    repositoryUrl: 'https://github.com/synaptic-solutions/codegenesis-core',
    branchName: 'main',
    languageDefaults: CodeLanguage.TypeScript,
    testFrameworkDefaults: TestFramework.Jest,
    ciCdPipelineId: 'jenkins-pipeline-123',
};

const defaultPreferences: UserPreferences = {
    defaultAiModel: AiModelProvider.GeminiFlash,
    defaultTestFramework: TestFramework.Jest,
    defaultAssertionLibrary: AssertionLibrary.Expect,
    theme: 'system',
    enableTelemetry: true,
    autoSaveIntervalMs: 30000,
    notificationsEnabled: true,
    codeEditorTheme: 'vs-dark',
};

const MAX_CODE_LENGTH = 50000;
const cleanCodeForDownload = (code: string) => code.replace(/^```(?:\w+\n)?/, '').replace(/```$/, '').trim();

export const AiUnitTestGenerator: React.FC = () => {
    // Services
    const telemetryService = useRef(new TelemetryService()).current;
    const auditLogService = useRef(new AuditLogService()).current;
    const featureFlagService = useRef(new FeatureFlagService()).current;

    // State
    const [userPreferences, setUserPreferences] = useState<UserPreferences>(defaultPreferences);
    const [currentProject] = useState<ProjectMetadata>(defaultProject);
    const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[]>([]);
    
    const [code, setCode] = useState<string>(`export const calculateTotal = (items: any[], taxRate: number) => {
  if (taxRate < 0) throw new Error("Invalid tax rate");
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
};`);
    const [tests, setTests] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [codeAnalysisReport, setCodeAnalysisReport] = useState<CodeAnalysisReport | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);
    const [generationProgress, setGenerationProgress] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'code' | 'tests' | 'analysis' | 'history' | 'settings'>('code');
    const [generatedArtifactsHistory, setGeneratedArtifactsHistory] = useState<GeneratedTestArtifact[]>([]);
    const [selectedArtifact, setSelectedArtifact] = useState<GeneratedTestArtifact | null>(null);

    // Configuration
    const [selectedAiModel, setSelectedAiModel] = useState<AiModelProvider>(userPreferences.defaultAiModel);
    const [selectedTestFramework, setSelectedTestFramework] = useState<TestFramework>(userPreferences.defaultTestFramework);
    const [selectedAssertionLibrary, setSelectedAssertionLibrary] = useState<AssertionLibrary>(userPreferences.defaultAssertionLibrary);
    const [selectedCodeLanguage, setSelectedCodeLanguage] = useState<CodeLanguage>(CodeLanguage.TypeScript);
    const [selectedTestTypes, setSelectedTestTypes] = useState<TestType[]>([TestType.Unit, TestType.Integration]);
    const [includeMocks, setIncludeMocks] = useState<boolean>(true);
    const [generateEdgeCases, setGenerateEdgeCases] = useState<boolean>(true);
    const [generationStrategy, setGenerationStrategy] = useState<GenerationStrategy>(GenerationStrategy.Hybrid);
    const [customPrompt, setCustomPrompt] = useState<string>('');

    const testsOutputRef = useRef<HTMLDivElement>(null);

    // Helper: Notifications
    const showNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);

    // Analysis Logic
    const analyzeCode = useCallback(async () => {
        if (!code.trim()) return;
        setIsAnalysisLoading(true);
        try {
            const report = await analyzeCodeWithGemini(code, selectedCodeLanguage);
            setCodeAnalysisReport(report);
            telemetryService.trackEvent('code_analysis_complete');
        } catch (err) {
            showNotification('Analysis failed. Is your API Key valid?', 'error');
        } finally {
            setIsAnalysisLoading(false);
        }
    }, [code, selectedCodeLanguage, showNotification, telemetryService]);

    // Generation Logic
    const handleGenerate = useCallback(async () => {
        if (!code.trim()) return;
        setIsLoading(true);
        setError('');
        setTests('');
        setGenerationProgress(0);

        const options: TestGenerationOptions = {
            targetFramework: selectedTestFramework,
            assertionLibrary: selectedAssertionLibrary,
            codeLanguage: selectedCodeLanguage,
            testTypes: selectedTestTypes,
            includeMocks,
            includeStubs: false,
            generateEdgeCases,
            generateNegativeTests: generateEdgeCases,
            aiModelConfig: {
                provider: selectedAiModel,
                modelName: selectedAiModel,
                temperature: 0.7,
                topP: 0.95,
                maxTokens: 4096,
            },
            generationStrategy,
            customPromptInstructions: customPrompt,
        };

        try {
            const stream = generateUnitTestsStream(code, options);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setTests(fullResponse);
                setGenerationProgress(prev => Math.min(prev + 5, 95));
                if (testsOutputRef.current) {
                    testsOutputRef.current.scrollTop = testsOutputRef.current.scrollHeight;
                }
            }
            setGenerationProgress(100);
            
            // Save Artifact
            const artifact: GeneratedTestArtifact = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                sourceCode: code,
                generatedTests: fullResponse,
                optionsUsed: options,
                aiResponseMetadata: {},
                status: 'generated',
                reviewStatus: 'pending'
            };
            setGeneratedArtifactsHistory(prev => [artifact, ...prev]);
            showNotification('Tests generated successfully!', 'success');
            auditLogService.logAction(defaultUser.id, 'GENERATE_TESTS');

        } catch (err: any) {
            setError(err.message);
            showNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [code, selectedTestFramework, selectedAssertionLibrary, selectedCodeLanguage, selectedTestTypes, includeMocks, generateEdgeCases, selectedAiModel, generationStrategy, customPrompt, showNotification, auditLogService]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background-light min-h-screen">
             {/* Header */}
            <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-4 sm:mb-0">
                    <h1 className="text-3xl font-bold flex items-center">
                        <BeakerIcon className="w-9 h-9 text-primary" />
                        <span className="ml-3">CodeGenesis AI</span>
                        <span className="ml-4 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold rounded-full shadow-lg">
                            Enigma v3.14
                        </span>
                    </h1>
                    <p className="text-text-secondary mt-1">
                        AI Unit Test Generator powered by Gemini. Context: <span className="font-semibold text-primary">{currentProject.projectName}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <Tooltip content="Settings"><Button onClick={() => setIsSettingsModalOpen(true)} variant="secondary" icon={<Cog6ToothIcon />}>Settings</Button></Tooltip>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-grow flex flex-col gap-4 min-h-0 relative z-0">
                <Tabs activeTabId={activeTab} onTabClick={(id: any) => setActiveTab(id)}>
                    <TabPanel id="code" label={<span className="flex items-center"><CodeBracketSquareIcon className="w-5 h-5 mr-2" />Source</span>}>
                        <CodeEditor value={code} onChange={setCode} language={selectedCodeLanguage} placeholder="Paste source code here..." theme={userPreferences.codeEditorTheme} />
                    </TabPanel>
                    
                    <TabPanel id="tests" label={<span className="flex items-center"><BeakerIcon className="w-5 h-5 mr-2" />Tests</span>}>
                        <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto relative h-[600px]" ref={testsOutputRef}>
                            {isLoading && !tests && (
                                <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                                    <LoadingSpinner className="mb-2" />
                                    <p>Generating tests with {selectedAiModel}...</p>
                                    <ProgressBar progress={generationProgress} className="w-1/2 mt-4" />
                                </div>
                            )}
                            {error && <Alert type="error" message={error} className="m-4" />}
                            {tests && <MarkdownRenderer content={tests} />}
                            {!isLoading && !tests && !error && (
                                <div className="text-text-secondary h-full flex items-center justify-center">Generated tests will appear here.</div>
                            )}
                        </div>
                    </TabPanel>

                    <TabPanel id="analysis" label={<span className="flex items-center"><CpuChipIcon className="w-5 h-5 mr-2" />Analysis</span>}>
                         <div className="flex-grow p-4 bg-background border border-border rounded-md overflow-y-auto h-[600px]">
                            {!codeAnalysisReport ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <p className="text-text-secondary mb-4">Analyze code for complexity, bugs, and security insights.</p>
                                    <Button onClick={analyzeCode} disabled={isAnalysisLoading || !code.trim()}>
                                        {isAnalysisLoading ? <LoadingSpinner size="sm" /> : "Run Analysis"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                     <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-surface rounded border border-border">
                                            <p className="text-secondary text-sm">Complexity</p>
                                            <p className="text-2xl font-bold">{codeAnalysisReport.complexityScore}/10</p>
                                        </div>
                                        <div className="p-4 bg-surface rounded border border-border">
                                            <p className="text-secondary text-sm">Readability</p>
                                            <p className="text-2xl font-bold">{(codeAnalysisReport.readabilityScore * 100).toFixed(0)}%</p>
                                        </div>
                                        <div className="p-4 bg-surface rounded border border-border">
                                            <p className="text-secondary text-sm">Maintainability</p>
                                            <p className="text-2xl font-bold">{codeAnalysisReport.maintainabilityIndex}</p>
                                        </div>
                                     </div>
                                     {codeAnalysisReport.potentialBugs.length > 0 && (
                                         <Alert type="warning" title="Potential Bugs">
                                            <ul className="list-disc pl-4 mt-2">
                                                {codeAnalysisReport.potentialBugs.map((b, i) => <li key={i}>{b.description} (Line {b.line})</li>)}
                                            </ul>
                                         </Alert>
                                     )}
                                     <Button variant="secondary" onClick={() => setCodeAnalysisReport(null)}>Clear Report</Button>
                                </div>
                            )}
                         </div>
                    </TabPanel>

                    <TabPanel id="history" label={<span className="flex items-center"><FolderOpenIcon className="w-5 h-5 mr-2" />History</span>}>
                        <div className="p-4 bg-background border border-border rounded-md overflow-y-auto h-[600px] space-y-2">
                            {generatedArtifactsHistory.length === 0 && <p className="text-text-secondary text-center p-4">No history yet.</p>}
                            {generatedArtifactsHistory.map((artifact) => (
                                <div key={artifact.id} onClick={() => setSelectedArtifact(artifact)} className="p-3 bg-surface border border-border rounded cursor-pointer hover:border-primary">
                                    <div className="flex justify-between">
                                        <span className="font-mono text-sm">{new Date(artifact.timestamp).toLocaleTimeString()}</span>
                                        <span className="text-xs bg-blue-900 text-blue-200 px-2 rounded">{artifact.status}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-1">Model: {artifact.optionsUsed.aiModelConfig.provider}</p>
                                </div>
                            ))}
                        </div>
                    </TabPanel>
                </Tabs>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 bg-surface p-4 rounded-lg border border-border">
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading || !code.trim()}
                        variant="primary"
                        icon={isLoading ? <LoadingSpinner size="sm" /> : <RocketLaunchIcon className="w-5 h-5" />}
                        className="w-full sm:w-auto px-8 py-3 text-lg shadow-lg shadow-primary/20"
                    >
                        {isLoading ? 'Generating...' : 'Generate Tests'}
                    </Button>

                    {tests && !isLoading && (
                        <div className="flex gap-2">
                             <Button onClick={() => navigator.clipboard.writeText(cleanCodeForDownload(tests))} variant="secondary" icon={<DocumentDuplicateIcon className="w-4 h-4"/>}>Copy</Button>
                             <Button onClick={() => downloadFile(cleanCodeForDownload(tests), 'tests.ts', 'text/plain')} variant="secondary" icon={<ArrowDownTrayIcon className="w-4 h-4"/>}>Download</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals & Notifications */}
            <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Generation Settings">
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Model" value={selectedAiModel} onChange={(e: any) => setSelectedAiModel(e.target.value)} options={Object.values(AiModelProvider).map(v => ({label: v, value: v}))} />
                        <Select label="Framework" value={selectedTestFramework} onChange={(e: any) => setSelectedTestFramework(e.target.value)} options={Object.values(TestFramework).map(v => ({label: v, value: v}))} />
                        <Select label="Language" value={selectedCodeLanguage} onChange={(e: any) => setSelectedCodeLanguage(e.target.value)} options={Object.values(CodeLanguage).map(v => ({label: v, value: v}))} />
                        <Select label="Strategy" value={generationStrategy} onChange={(e: any) => setGenerationStrategy(e.target.value)} options={Object.values(GenerationStrategy).map(v => ({label: v, value: v}))} />
                    </div>
                    <div className="space-y-2 pt-4 border-t border-border">
                        <Checkbox label="Include Mocks" checked={includeMocks} onChange={(e: any) => setIncludeMocks(e.target.checked)} />
                        <Checkbox label="Edge Cases" checked={generateEdgeCases} onChange={(e: any) => setGenerateEdgeCases(e.target.checked)} />
                    </div>
                    <div className="pt-4">
                         <label className="text-sm font-medium text-text-secondary">Custom Instructions</label>
                         <Textarea value={customPrompt} onChange={(e: any) => setCustomPrompt(e.target.value)} placeholder="E.g., Focus on security..." rows={3} />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setIsSettingsModalOpen(false)}>Save & Close</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={!!selectedArtifact} onClose={() => setSelectedArtifact(null)} title="Artifact Details" size="lg">
                {selectedArtifact && (
                    <div className="p-4 h-[70vh] flex flex-col">
                        <h3 className="text-sm font-bold text-text-secondary mb-2">Generated Code</h3>
                        <div className="flex-grow overflow-auto border border-border rounded p-2 bg-surface-dark">
                             <MarkdownRenderer content={selectedArtifact.generatedTests} />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={() => setSelectedArtifact(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {notifications.map(n => <Notification key={n.id} message={n.message} type={n.type} />)}
            </div>
        </div>
    );
};
