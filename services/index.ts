import { GeneratedTestArtifact, CodeLanguage, TestGenerationOptions } from '../types';

export * from './geminiService';

// Utilities
export const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Mock Services for Enterprise features described in the prompt
export class TelemetryService {
    trackEvent(event: string, data?: any) {
        console.log(`[Telemetry] ${event}`, data);
    }
}

export class ErrorTrackingService {
    captureError(error: Error, context?: any) {
        console.error(`[ErrorTracker] ${error.message}`, context);
    }
}

export class AuditLogService {
    logAction(userId: string, action: string, details?: any) {
        console.log(`[Audit] User ${userId} performed ${action}`, details);
    }
}

export class FeatureFlagService {
    isFeatureEnabled(feature: string): boolean {
        // Enable most features for the demo
        return true;
    }
}

export class AnalyticsService {
    // Placeholder
}
