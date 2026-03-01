import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

/**
 * Voice mapping per locale — using natural, calming Azure Neural voices
 * suited for bedtime story narration.
 */
const VOICE_MAP: Record<string, string> = {
  en: 'en-US-AvaMultilingualNeural',
  zh: 'zh-CN-Xiaoxiao:DragonHDFlashLatestNeural',
  ja: 'ja-JP-NanamiNeural',
  es: 'es-MX-DaliaNeural',
};

/**
 * POST /api/tts
 * Body: { text: string, locale?: string }
 * Returns: audio/mpeg binary
 *
 * Converts text to speech using Azure Speech Services REST API.
 */
router.post('/', async (req, res) => {
  const { text, locale = 'en' } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing "text" in request body' });
    return;
  }

  if (text.length > 5000) {
    res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    return;
  }

  if (!config.azureSpeechKey) {
    res.status(500).json({ error: 'Azure Speech not configured' });
    return;
  }

  const langPrefix = locale.split('-')[0];
  const voiceName = VOICE_MAP[langPrefix] || VOICE_MAP.en;

  // Build SSML for natural, slow, soothing narration
  const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${locale}">
  <voice name="${voiceName}">
    <mstts:express-as style="whispering" styledegree="0.5">
      <prosody rate="-15%" pitch="-5%" volume="90">
        ${escapeXml(text)}
      </prosody>
    </mstts:express-as>
  </voice>
</speak>`.trim();

  try {
    const endpoint = `https://${config.azureSpeechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

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
      console.error(`Azure TTS error ${response.status}:`, errText);
      res.status(502).json({ error: 'TTS synthesis failed' });
      return;
    }

    const audioBuffer = await response.arrayBuffer();

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.byteLength),
      'Cache-Control': 'public, max-age=86400', // cache for 24h
    });
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('Azure TTS request failed:', err);
    res.status(502).json({ error: 'TTS request failed' });
  }
});

/** Escape special XML characters in text */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
