import { GoogleGenAI, Type } from "@google/genai";
import { AiModelConfig, CodeAnalysisReport, TestGenerationOptions, RiskLevel } from "../types";

// Initialize Gemini Client
const getClient = () => {
    const apiKey = process.env.API_KEY || ''; // Fallback handled by check below
    if (!apiKey) {
        console.warn("No API Key found in process.env.API_KEY");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateUnitTestsStream = async function* (
    code: string,
    options: TestGenerationOptions
): AsyncGenerator<string> {
    const ai = getClient();
    
    // Map internal provider to actual Gemini model
    let modelName = 'gemini-3-flash-preview';
    if (options.aiModelConfig.provider.includes('pro')) {
        modelName = 'gemini-3-pro-preview';
    }

    const systemPrompt = `You are CodeGenesis AI, an expert Senior QA Engineer and Software Architect.
    Your task is to generate comprehensive, production-ready unit tests.
    
    Constraints:
    - Target Framework: ${options.targetFramework}
    - Assertion Library: ${options.assertionLibrary}
    - Language: ${options.codeLanguage}
    - Strategy: ${options.generationStrategy}
    
    Requirements:
    - ${options.includeMocks ? 'Include mocks for external dependencies.' : 'Assume real dependencies where safe.'}
    - ${options.generateEdgeCases ? 'Cover edge cases and boundary conditions rigorously.' : 'Focus on happy paths.'}
    - Follow clean code principles (DRY, SOLID).
    - Output ONLY the code for the test file. Do not include markdown formatting or explanations outside the code block if possible, but standard markdown code blocks are acceptable.
    
    Custom Instructions: ${options.customPromptInstructions || 'None'}
    `;

    const userPrompt = `Generate unit tests for the following code:\n\n${code}`;

    try {
        const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
            ],
            config: {
                temperature: options.aiModelConfig.temperature,
                topP: options.aiModelConfig.topP,
                maxOutputTokens: options.aiModelConfig.maxTokens,
            }
        });

        for await (const chunk of responseStream) {
            yield chunk.text || '';
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate tests via Gemini API. Please check your API key.");
    }
};

export const analyzeCodeWithGemini = async (
    code: string,
    language: string
): Promise<CodeAnalysisReport> => {
    const ai = getClient();
    const modelName = 'gemini-3-flash-preview'; // Fast model for analysis

    const prompt = `Analyze the following ${language} code for quality, security, and bugs. 
    Return the result in strict JSON format matching this structure:
    {
        "complexityScore": number (1-10),
        "readabilityScore": number (0-1),
        "maintainabilityIndex": number (0-100),
        "potentialBugs": [{"description": string, "line": number, "severity": "critical"|"high"|"medium"|"low"|"informational"}],
        "securityVulnerabilities": [{"description": string, "severity": "critical"|"high"|"medium"|"low"}],
        "suggestedImprovements": [string],
        "testCoverageEstimate": {"lines": number, "branches": number, "functions": number, "total": number}
    }
    
    Code:
    ${code}`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        complexityScore: { type: Type.NUMBER },
                        readabilityScore: { type: Type.NUMBER },
                        maintainabilityIndex: { type: Type.NUMBER },
                        potentialBugs: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    line: { type: Type.NUMBER },
                                    severity: { type: Type.STRING }
                                }
                            }
                        },
                        securityVulnerabilities: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    severity: { type: Type.STRING }
                                }
                            }
                        },
                        suggestedImprovements: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        testCoverageEstimate: {
                            type: Type.OBJECT,
                            properties: {
                                lines: { type: Type.NUMBER },
                                branches: { type: Type.NUMBER },
                                functions: { type: Type.NUMBER },
                                total: { type: Type.NUMBER }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            return {
                ...data,
                dependencies: [], // Not easily extractable via simple prompt without context
                externalReportUrls: []
            };
        }
        throw new Error("Empty response from Gemini");
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        // Return fallback data if API fails
        return {
            complexityScore: 0,
            readabilityScore: 0,
            maintainabilityIndex: 0,
            potentialBugs: [{ description: "Analysis failed", line: 0, severity: RiskLevel.Low }],
            securityVulnerabilities: [],
            dependencies: [],
            testCoverageEstimate: { lines: 0, branches: 0, functions: 0, total: 0 },
            suggestedImprovements: ["Check API Key", "Ensure code is valid"]
        };
    }
};
