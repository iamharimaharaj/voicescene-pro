# Voiceover Pro

A marketing voice studio powered by Gemini. Describe your product, pick a format (Instagram Reel, TikTok, YouTube ad, radio spot, explainer, launch) and a marketing tone, and it writes scene-by-scene ad copy. Edit, add or reorder scenes, choose a voice personality, then voice each scene and download MP3/WAV files, or everything as a ZIP.

Supports English, Nepali, Hindi, Spanish and French, with regional accents. Language sets pronunciation; it does not translate your text. Use Devanagari for Nepali and Hindi.

## Run locally

1. Install dependencies: `npm install`
2. Create `.env.local` and set `GEMINI_API_KEY=your_key`. This file is ignored by Git, and the key stays on the server. See `.env.example` for optional model settings.
3. Run `npm run dev` and open http://localhost:3000.
4. Restart the server after changing `.env.local`.

## API

- `POST /api/copy/generate`: `{ brief, audience?, cta?, platform, tone, language, sceneCount }` → `{ scenes: [{ title, text }] }`
- `POST /api/tts/generate`: `{ script, voice, language, region, tone, pace }` → MP3 and WAV audio as data URLs

## Deploy

The page and the API can be hosted separately.

- **API (Hostinger Node.js app):** start command `npm start`. Set the environment variables `GEMINI_API_KEY` and `ALLOWED_ORIGINS=https://harinepal.com,https://www.harinepal.com`. Optionally set `TTS_LIMIT_PER_HOUR` (default 40) and `COPY_LIMIT_PER_HOUR` (default 20) per visitor. Check it at `/api/health`.
- **Page on harinepal.com/voiceover/:** `npm run build:portfolio`, run from inside the Portfolio repo. It reads the API address from `.env.portfolio`.
- **Standalone:** `npm run build && npm start` serves the page and the API together.

## Checks

- `npm run lint`
- `npm run build`
- `npm test`

Recordings stay in the page until you refresh it. Download them to keep a copy. Each scene is limited to 5,000 characters.
