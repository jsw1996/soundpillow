import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  /** Cron expression for daily generation (default: 4:00 AM UTC) */
  cronSchedule: process.env.CRON_SCHEDULE || '0 4 * * *',
  /** Directory to store generated story JSON files */
  dataDir: process.env.DATA_DIR || 'data/stories',
  /** Comma-separated locales to pre-generate */
  locales: (process.env.LOCALES || 'en,zh,ja,es').split(','),
  /** Allowed CORS origins */
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  /** Azure Speech Services */
  azureSpeechKey: process.env.AZURE_SPEECH_KEY || '',
  azureSpeechRegion: process.env.AZURE_SPEECH_REGION || 'southeastasia',
};

export function validateConfig(): void {
  if (!config.openRouterApiKey) {
    console.error('⚠️  OPENROUTER_API_KEY is not set. Generation will fail.');
  }
  if (!config.azureSpeechKey) {
    console.error('⚠️  AZURE_SPEECH_KEY is not set. TTS will fail.');
  }
}
