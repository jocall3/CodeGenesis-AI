export enum AiModelProvider {
    GeminiFlash = 'gemini-flash',
    GeminiPro = 'gemini-pro',
    GPT4Turbo = 'gpt-4-turbo', // Kept for compatibility with prompt code structure
    Claude3Opus = 'claude-3-opus',
}

export enum TestFramework {
    Jest = 'jest',
    ReactTestingLibrary = 'react-testing-library',
    Vitest = 'vitest',
    Mocha = 'mocha',
    Cypress = 'cypress',
    Playwright = 'playwright',
    Pytest = 'pytest',
}

export enum AssertionLibrary {
    Expect = 'expect',
    Chai = 'chai',
    Assert = 'assert',
}

export enum TestType {
    Unit = 'unit',
    Integration = 'integration',
    E2E = 'e2e',
    Snapshot = 'snapshot',
    Security = 'security',
}

export enum CodeLanguage {
    TypeScript = 'typescript',
    JavaScript = 'javascript',
    Python = 'python',
    Java = 'java',
    CSharp = 'csharp',
}

export enum GenerationStrategy {
    CoverageOptimized = 'coverage_optimized',
    Behavioral = 'behavioral',
    Adversarial = 'adversarial',
    Hybrid = 'hybrid',
}

export enum RiskLevel {
    Critical = 'critical',
    High = 'high',
    Medium = 'medium',
    Low = 'low',
    Informational = 'informational',
}

export interface AiModelConfig {
    provider: AiModelProvider;
    modelName: string;
    temperature: number;
    topP: number;
    maxTokens: number;
}

export interface TestGenerationOptions {
    targetFramework: TestFramework;
    assertionLibrary: AssertionLibrary;
    codeLanguage: CodeLanguage;
    testTypes: TestType[];
    includeMocks: boolean;
    includeStubs: boolean;
    generateEdgeCases: boolean;
    generateNegativeTests: boolean;
    aiModelConfig: AiModelConfig;
    generationStrategy: GenerationStrategy;
    customPromptInstructions?: string;
}

export interface CodeAnalysisReport {
    complexityScore: number;
    readabilityScore: number;
    maintainabilityIndex: number;
    potentialBugs: { description: string; line: number; severity: RiskLevel }[];
    securityVulnerabilities: { description: string; cveId?: string; severity: RiskLevel }[];
    dependencies: { name: string; version: string; vulnerabilities?: { cveId: string; severity: RiskLevel }[] }[];
    testCoverageEstimate: { lines: number; branches: number; functions: number; total: number };
    suggestedImprovements: string[];
    externalReportUrls?: { tool: string; url: string }[];
}

export interface UserPreferences {
    defaultAiModel: AiModelProvider;
    defaultTestFramework: TestFramework;
    defaultAssertionLibrary: AssertionLibrary;
    theme: 'light' | 'dark' | 'system';
    enableTelemetry: boolean;
    autoSaveIntervalMs: number;
    notificationsEnabled: boolean;
    codeEditorTheme: string;
}

export interface ProjectMetadata {
    projectId: string;
    projectName: string;
    repositoryUrl?: string;
    branchName?: string;
    languageDefaults?: CodeLanguage;
    testFrameworkDefaults?: TestFramework;
    ciCdPipelineId?: string;
}

export interface GeneratedTestArtifact {
    id: string;
    timestamp: string;
    sourceCode: string;
    generatedTests: string;
    optionsUsed: TestGenerationOptions;
    aiResponseMetadata: Record<string, any>;
    codeAnalysisReport?: CodeAnalysisReport;
    status: 'generated' | 'failed' | 'processing' | 'committed' | 'reviewed';
    reviewStatus?: 'pending' | 'approved' | 'rejected';
    reviewComments?: { userId: string; comment: string; timestamp: string }[];
    versionControlCommitHash?: string;
    testResultSummary?: any;
}
