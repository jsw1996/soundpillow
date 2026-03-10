import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  /** Allowed CORS origins */
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,https://jsw1996.github.io,capacitor://localhost,http://localhost').split(','),
  /** Public asset base URL for ambient track media */
  assetBaseUrl: process.env.ASSET_BASE_URL || 'https://soundpillow0308001430.blob.core.windows.net/soundpillow-assets',
};

export function validateConfig(): void {
  if (!config.openRouterApiKey) {
    console.error('⚠️  OPENROUTER_API_KEY is not set. Mood message generation will fail.');
  }
}
