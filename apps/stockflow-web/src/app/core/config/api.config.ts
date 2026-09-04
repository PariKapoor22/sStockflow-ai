const CLOUD_RUN_API = 'https://stockflow-core-api-100044030673.asia-southeast1.run.app';

const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

/**
 * Local development uses Angular's proxy configuration.
 * Deployed builds call the public Cloud Run API.
 */
export const API_BASE_URL = isLocalHost ? '' : CLOUD_RUN_API;

/**
 * The Copilot Host is a separate service. Leave this empty when a reverse
 * proxy exposes it at the same origin; set window.STOCKFLOW_COPILOT_API_URL
 * for a separately hosted Copilot service.
 */
const configuredCopilotUrl = (window as typeof window & { STOCKFLOW_COPILOT_API_URL?: string }).STOCKFLOW_COPILOT_API_URL ?? '';

// Local requests must stay relative so Angular's development proxy can route
// them to the Copilot process started by RUN_ALL_WINDOWS.cmd on port 8300.
// The runtime Cloud Run URL is only for a deployed frontend.
export const COPILOT_API_BASE_URL = isLocalHost ? '' : configuredCopilotUrl;
