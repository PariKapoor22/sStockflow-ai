const CLOUD_RUN_API = 'https://stockflow-core-api-100044030673.asia-southeast1.run.app';

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

/**
 * Local development uses Angular's proxy configuration.
 * Deployed builds call the public Cloud Run API.
 */
export const API_BASE_URL = isLocalHost ? '' : CLOUD_RUN_API;
