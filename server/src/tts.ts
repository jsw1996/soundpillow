import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

/**
 * Voice mapping per locale — natural, calming Azure Neural voices.
 */
const VOICE_MAP: Record<string, string> = {
  en: 'en-US-AvaMultilingualNeural',
  zh: 'zh-CN-Xiaoxiao:DragonHDFlashLatestNeural',
  ja: 'ja-JP-NanamiNeural',
  es: 'es-MX-DaliaNeural',
};

/** Escape special XML characters */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Build SSML for soothing narration */
function buildSsml(text: string, locale: string): string {
  const langPrefix = locale.split('-')[0];
  const voiceName = VOICE_MAP[langPrefix] || VOICE_MAP.en;

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${locale}">
  <voice name="${voiceName}">
    <mstts:express-as style="whispering" styledegree="0.5">
      <prosody rate="-15%" pitch="-5%" volume="90">
        ${escapeXml(text)}
      </prosody>
    </mstts:express-as>
  </voice>
</speak>`;
}

/**
 * Synthesize a single text to an MP3 buffer using Azure Speech REST API.
 */
export async function synthesize(text: string, locale: string): Promise<Buffer> {
  if (!config.azureSpeechKey) {
    throw new Error('AZURE_SPEECH_KEY not configured');
  }

  const endpoint = `https://${config.azureSpeechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = buildSsml(text, locale);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': config.azureSpeechKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      'User-Agent': 'SoundPillow',
    },
    body: ssml,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Azure TTS error (${response.status}): ${errText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Get the audio directory for a given date.
 * Audio files are stored at: data/audio/YYYY-MM-DD/
 */
function audioDir(date: string): string {
  return path.join(config.dataDir, '..', 'audio', date);
}

/**
 * Generate TTS audio for all paragraphs of a story.
 * Saves MP3 files and returns relative URL paths.
 *
 * Files are saved as: data/audio/YYYY-MM-DD/{storyId}-{index}.mp3
 * Served at:          /api/audio/YYYY-MM-DD/{storyId}-{index}.mp3
 */
export async function generateAudioForStory(
  storyId: string,
  paragraphs: string[],
  locale: string,
  date: string,
): Promise<string[]> {
  const dir = audioDir(date);
  await fs.mkdir(dir, { recursive: true });

  const urls: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const filename = `${storyId}-${i}.mp3`;
    const filePath = path.join(dir, filename);

    // Skip if already generated (idempotent)
    try {
      await fs.access(filePath);
      urls.push(`/api/audio/${date}/${filename}`);
      continue;
    } catch {
      // File doesn't exist, generate it
    }

    console.log(`      🔊 TTS paragraph ${i + 1}/${paragraphs.length}...`);
    const audioBuffer = await synthesize(paragraphs[i], locale);
    await fs.writeFile(filePath, audioBuffer);
    urls.push(`/api/audio/${date}/${filename}`);

    // Small delay between Azure TTS calls
    if (i < paragraphs.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return urls;
}
