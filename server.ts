import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { encodeAudio } from './src/lib/audio';
import { VOICES, LANGUAGES, TONES, PACES, MAX_TEXT_LENGTH } from './src/data/voices';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: [path.join(__dirname, '.env.local'), path.join(__dirname, '.env')] });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
}) : null;

// Generate a voiceover from user-supplied text.
app.post('/api/tts/generate', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is missing. Set GEMINI_API_KEY in .env.local and restart the server.',
      });
    }

    const { script, voice = 'Charon', language = 'en', region = 'United States', tone = 'Natural', pace = 'Normal' } = req.body;

    if (typeof script !== 'string' || !script.trim()) {
      return res.status(400).json({ error: 'Script text is required.' });
    }

    const voiceProfile = VOICES.find(item => item.id === voice);
    const languageProfile = LANGUAGES.find(item => item.id === language);
    if (script.length > MAX_TEXT_LENGTH) return res.status(400).json({ error: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.` });
    if (!voiceProfile || !languageProfile || !(languageProfile.regions as readonly string[]).includes(region)
        || !(TONES as readonly string[]).includes(tone) || !(PACES as readonly string[]).includes(pace)) {
      return res.status(400).json({ error: 'Choose a valid voice, language, region, delivery style, and pace.' });
    }
    const validVoice = voiceProfile.id;
    const speechStyle = `Speak in ${languageProfile.name} with a natural ${region} regional accent. ${tone} delivery, ${pace.toLowerCase()} pace, clear pronunciation. Preserve the exact text without translating.`;

    // Call Gemini 3.8 Flash Lite TTS
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: script.trim(),
              speechMetadata: {
                style: speechStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            voice: validVoice,
          },
        },
      },
    });

    const audio = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.mimeType?.startsWith('audio/'))?.inlineData;
    if (!audio?.data) {
      return res.status(502).json({ error: 'No audio was returned. Try a shorter text or a different voice.' });
    }
    const { mp3Buffer, wavBuffer, duration } = encodeAudio(Buffer.from(audio.data, 'base64'), audio.mimeType || '');

    res.json({
      success: true,
      voice: validVoice,
      duration,
      mp3Base64: `data:audio/mpeg;base64,${mp3Buffer.toString('base64')}`,
      wavBase64: `data:audio/wav;base64,${wavBuffer.toString('base64')}`,
      fileSizeBytes: mp3Buffer.length,
      wavFileSizeBytes: wavBuffer.length,
      generatedAt: Date.now(),
    });
  } catch (error: any) {
    console.error('TTS Generation error:', error);
    const status = Number(error?.status || error?.code);
    if (status === 429) {
      return res.status(429).json({ error: 'Your Gemini quota has been reached. Check your API project’s quota and billing in Google AI Studio, or try again when your rate limit resets.' });
    }
    res.status(500).json({
      error: error?.message || 'Unable to generate voiceover audio. Please try again.',
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
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
