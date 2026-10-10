# Voiceover Pro

A text-to-voice studio powered by Gemini. Paste text, choose a male or female voice, language, regional accent, delivery style and pace, then listen or download MP3 and WAV audio.

Includes English, Nepali, Hindi, Spanish and French with relevant regional choices. Regional accents and delivery settings guide the model; results can vary. Language selection controls pronunciation rather than translating your text. Use Devanagari when trying Nepali.

## Run locally

1. Install dependencies: `npm install --legacy-peer-deps` (the project currently has an optional esbuild peer version conflict).
2. Create `.env.local` and set `GEMINI_API_KEY=your_key`. This file is ignored by Git. The key stays on the server.
3. Run `npm run dev` and open http://localhost:3000.
4. Restart the server after changing the key.

## Checks

- `npm run lint`
- `npm run build`
- `node --import tsx --test src/lib/audio.test.ts`

Generated recordings remain in the current page until refreshed. Download them to keep a copy. Text is limited to 5,000 characters per generation.
