export const VOICES = [
  { id: 'Sulafat', gender: 'female', personality: 'The Trusted Friend', description: 'Warm & welcoming' },
  { id: 'Kore', gender: 'female', personality: 'The Brand Authority', description: 'Firm & clear' },
  { id: 'Aoede', gender: 'female', personality: 'The Lifestyle Creator', description: 'Breezy & relaxed' },
  { id: 'Zephyr', gender: 'female', personality: 'The Launch Host', description: 'Bright & upbeat' },
  { id: 'Leda', gender: 'female', personality: 'The Gen Z Insider', description: 'Youthful & fresh' },
  { id: 'Despina', gender: 'female', personality: 'The Luxury Muse', description: 'Smooth & refined' },
  { id: 'Charon', gender: 'male', personality: 'The Explainer', description: 'Informative & steady' },
  { id: 'Fenrir', gender: 'male', personality: 'The Hype Man', description: 'Excitable & energetic' },
  { id: 'Orus', gender: 'male', personality: 'The Closer', description: 'Firm & confident' },
  { id: 'Puck', gender: 'male', personality: 'The Fun Sidekick', description: 'Playful & upbeat' },
  { id: 'Algieba', gender: 'male', personality: 'The Premium Narrator', description: 'Smooth & polished' },
  { id: 'Achird', gender: 'male', personality: 'The Neighbour Next Door', description: 'Friendly & relatable' },
] as const;

export const LANGUAGES = [
  { id: 'en', name: 'English', regions: ['United States', 'United Kingdom', 'Australia', 'India'], sample: 'Tired of juggling ten apps to run your business? Meet Flowdesk. One dashboard, every tool, zero chaos. Start your free trial today.' },
  { id: 'ne', name: 'नेपाली · Nepali', regions: ['Nepal'], sample: 'नमस्ते! तपाईंको व्यवसायलाई अझ सजिलो बनाउने समय आयो। आजै हाम्रो सेवा प्रयोग गर्नुहोस् र फरक आफैं महसुस गर्नुहोस्।' },
  { id: 'hi', name: 'हिन्दी · Hindi', regions: ['India'], sample: 'अब अपने बिज़नेस को दें एक नई पहचान। आज ही जुड़िए और फ़र्क़ ख़ुद महसूस कीजिए।' },
  { id: 'es', name: 'Spanish', regions: ['Spain', 'Mexico'], sample: '¿Cansado de usar diez aplicaciones para tu negocio? Conoce Flowdesk. Un solo panel, todas tus herramientas. Pruébalo gratis hoy.' },
  { id: 'fr', name: 'French', regions: ['France', 'Canada'], sample: 'Marre de jongler entre dix applications ? Découvrez Flowdesk. Un seul tableau de bord, tous vos outils. Essayez-le gratuitement dès aujourd’hui.' },
] as const;

// Marketing tones. `direction` is what the voice and copy models are told.
export const TONES = [
  { id: 'Confident brand', direction: 'confident, polished brand voice that builds trust' },
  { id: 'Energetic promo', direction: 'high-energy, punchy promotional read with excitement' },
  { id: 'Warm & trustworthy', direction: 'warm, sincere and reassuring, like a trusted recommendation' },
  { id: 'Luxury & premium', direction: 'elegant, unhurried and premium, with refined emphasis' },
  { id: 'Friendly conversational', direction: 'casual and conversational, like talking to a friend' },
  { id: 'Urgent offer', direction: 'urgent and persuasive, stressing limited time and the call to action' },
  { id: 'Inspirational story', direction: 'emotive and inspiring, building to an uplifting finish' },
  { id: 'Calm explainer', direction: 'calm, clear and helpful, explaining step by step' },
] as const;

export const PACES = ['Slow', 'Normal', 'Fast'] as const;

export const PLATFORMS = [
  { id: 'Instagram Reel', guide: 'vertical short video, 15–30 seconds, hook in the first 2 seconds' },
  { id: 'TikTok', guide: 'native, casual short video, 15–30 seconds, trend-friendly hook' },
  { id: 'YouTube ad', guide: 'pre-roll ad, about 30 seconds, brand and hook before the 5-second skip' },
  { id: 'Radio spot', guide: 'audio-only 30-second spot, paint the picture with words, repeat the brand name' },
  { id: 'Explainer video', guide: '60–90 second product explainer: problem, solution, how it works, call to action' },
  { id: 'Product launch', guide: 'launch announcement, 45–60 seconds, build anticipation then reveal' },
] as const;

export const MAX_TEXT_LENGTH = 5000;
export const MAX_SCENES = 12;
export const MAX_BRIEF_LENGTH = 1500;

export type VoiceId = (typeof VOICES)[number]['id'];
export type Gender = (typeof VOICES)[number]['gender'];
export type LanguageId = (typeof LANGUAGES)[number]['id'];
export type ToneId = (typeof TONES)[number]['id'];
export type Pace = (typeof PACES)[number];
export type PlatformId = (typeof PLATFORMS)[number]['id'];
