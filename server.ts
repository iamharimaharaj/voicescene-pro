import dotenv from 'dotenv';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { encodeAudio } from './src/lib/audio';
import { VOICES, LANGUAGES, TONES, PACES, PLATFORMS, MAX_TEXT_LENGTH, MAX_SCENES, MAX_BRIEF_LENGTH } from './src/data/voices';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: [path.join(__dirname, '.env.local'), path.join(__dirname, '.env')] });

const app = express();
const port = process.env.PORT || 3000;
const ttsModel = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';
const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-flash-latest';

// Comma-separated sites allowed to call this API from the browser, e.g. "https://harinepal.com".
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);

// Hosting platforms put a proxy in front of the app; trust it so rate limits see the real visitor IP.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.use(express.json({ limit: '100kb' }));

app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Per-visitor limits so a public page can't run up the Gemini bill.
function hourlyLimit(envName: string, fallback: number) {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: Number(process.env[envName] || fallback),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'You’ve reached the hourly limit for this studio. Please try again in a little while.' },
  });
}

app.get('/api/health', (_req, res) => res.json({ ok: true, gemini: Boolean(process.env.GEMINI_API_KEY) }));

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const missingKey = 'The voice studio isn’t configured yet. Please try again later.';

function sendGeminiError(res: express.Response, error: any, fallback: string) {
  console.error(fallback, error);
  const status = Number(error?.status || error?.code);
  if (status === 429) {
    return res.status(429).json({ error: 'The studio has reached its usage limit for now. Please try again later.' });
  }
  if (status === 503) {
    return res.status(503).json({ error: 'Gemini is busy right now. Please try again in a few seconds.' });
  }
  res.status(500).json({ error: fallback });
}

// Generate a voiceover for one scene of user-supplied text.
app.post('/api/tts/generate', hourlyLimit('TTS_LIMIT_PER_HOUR', 40), async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ error: missingKey });

    const { script, voice = 'Sulafat', language = 'en', region = 'United States', tone = 'Confident brand', pace = 'Normal' } = req.body;

    if (typeof script !== 'string' || !script.trim()) {
      return res.status(400).json({ error: 'Script text is required.' });
    }

    const voiceProfile = VOICES.find(item => item.id === voice);
    const languageProfile = LANGUAGES.find(item => item.id === language);
    const toneProfile = TONES.find(item => item.id === tone);
    if (script.length > MAX_TEXT_LENGTH) return res.status(400).json({ error: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.` });
    if (!voiceProfile || !languageProfile || !toneProfile || !(languageProfile.regions as readonly string[]).includes(region)
        || !(PACES as readonly string[]).includes(pace)) {
      return res.status(400).json({ error: 'Choose a valid voice, language, region, tone, and pace.' });
    }
    const speechStyle = `Marketing voiceover in ${languageProfile.name} with a natural ${region} regional accent. Persona: ${voiceProfile.personality}. Delivery: ${toneProfile.direction}. ${pace} pace, clear pronunciation, emphasise the brand name and call to action. Preserve the exact text without translating.`;

    const response = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ role: 'user', parts: [{ text: script.trim(), speechMetadata: { style: speechStyle } }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { voice: voiceProfile.id } },
      },
    });

    const audio = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.mimeType?.startsWith('audio/'))?.inlineData;
    if (!audio?.data) {
      return res.status(502).json({ error: 'No audio was returned. Try a shorter text or a different voice.' });
    }
    const { mp3Buffer, wavBuffer, duration } = encodeAudio(Buffer.from(audio.data, 'base64'), audio.mimeType || '');

    res.json({
      success: true,
      voice: voiceProfile.id,
      duration,
      mp3Base64: `data:audio/mpeg;base64,${mp3Buffer.toString('base64')}`,
      wavBase64: `data:audio/wav;base64,${wavBuffer.toString('base64')}`,
      fileSizeBytes: mp3Buffer.length,
      wavFileSizeBytes: wavBuffer.length,
      generatedAt: Date.now(),
    });
  } catch (error) {
    sendGeminiError(res, error, 'Unable to generate voiceover audio. Please try again.');
  }
});

// Write marketing copy from a brief, split into voiceover scenes.
app.post('/api/copy/generate', hourlyLimit('COPY_LIMIT_PER_HOUR', 20), async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ error: missingKey });

    const { brief, audience = '', cta = '', platform, tone, language = 'en', sceneCount = 4 } = req.body;
    const platformProfile = PLATFORMS.find(item => item.id === platform);
    const toneProfile = TONES.find(item => item.id === tone);
    const languageProfile = LANGUAGES.find(item => item.id === language);
    const count = Number(sceneCount);

    if (typeof brief !== 'string' || !brief.trim()) return res.status(400).json({ error: 'Describe your product or offer first.' });
    if ([brief, audience, cta].some(value => typeof value !== 'string' || value.length > MAX_BRIEF_LENGTH)) {
      return res.status(400).json({ error: `Brief fields must be ${MAX_BRIEF_LENGTH} characters or fewer.` });
    }
    if (!platformProfile || !toneProfile || !languageProfile || !Number.isInteger(count) || count < 1 || count > MAX_SCENES) {
      return res.status(400).json({ error: 'Choose a valid platform, tone, language, and number of scenes.' });
    }

    const prompt = [
      `You are a senior direct-response copywriter writing a voiceover script.`,
      `Format: ${platformProfile.id} (${platformProfile.guide}).`,
      `Tone: ${toneProfile.direction}.`,
      `Language: write every scene in ${languageProfile.name}${language === 'ne' || language === 'hi' ? ' using Devanagari script' : ''}.`,
      `Split the script into exactly ${count} scene${count === 1 ? '' : 's'}. Scene 1 must open with a strong hook. The final scene must end with the call to action.`,
      `Write only the words to be spoken aloud: no stage directions, emojis, hashtags, or sound-effect notes.`,
      ``,
      `Product or offer: ${brief.trim()}`,
      audience.trim() && `Target audience: ${audience.trim()}`,
      cta.trim() && `Call to action: ${cta.trim()}`,
    ].filter(Boolean).join('\n');

    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            scenes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Short scene label, e.g. "Hook" or "Call to action"' },
                  text: { type: 'string', description: 'The exact words the voice will speak' },
                },
                required: ['title', 'text'],
              },
            },
          },
          required: ['scenes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const scenes = (Array.isArray(parsed.scenes) ? parsed.scenes : [])
      .filter((scene: any) => typeof scene?.text === 'string' && scene.text.trim())
      .slice(0, MAX_SCENES)
      .map((scene: any, index: number) => ({
        title: String(scene.title || `Scene ${index + 1}`).slice(0, 80),
        text: scene.text.trim().slice(0, MAX_TEXT_LENGTH),
      }));
    if (!scenes.length) return res.status(502).json({ error: 'No copy was returned. Try adding more detail to your brief.' });

    res.json({ success: true, scenes });
  } catch (error) {
    sendGeminiError(res, error, 'Unable to write marketing copy. Please try again.');
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))) {
    // Also serve the built page when it is deployed with the API. Without a build, this is API-only.
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
