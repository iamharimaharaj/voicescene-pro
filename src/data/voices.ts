export const VOICES = [
  { id: 'Charon', gender: 'male', description: 'Informative & steady' },
  { id: 'Fenrir', gender: 'male', description: 'Expressive & energetic' },
  { id: 'Orus', gender: 'male', description: 'Firm & confident' },
  { id: 'Kore', gender: 'female', description: 'Firm & clear' },
  { id: 'Aoede', gender: 'female', description: 'Breezy & relaxed' },
  { id: 'Sulafat', gender: 'female', description: 'Warm & welcoming' },
] as const;
export const LANGUAGES = [
  { id: 'en', name: 'English', regions: ['United States', 'United Kingdom', 'Australia', 'India'], sample: 'Every great story starts with a voice. Turn your ideas into something people can hear, feel, and remember.' },
  { id: 'ne', name: 'नेपाली · Nepali', regions: ['Nepal'], sample: 'नमस्ते! हाम्रो नयाँ आवाज स्टुडियोमा तपाईंलाई स्वागत छ। यहाँ तपाईं आफ्नो नेपाली पाठलाई सहज र स्पष्ट आवाजमा सुन्न सक्नुहुन्छ।' },
  { id: 'hi', name: 'हिन्दी · Hindi', regions: ['India'], sample: 'नमस्ते! हमारे वॉइस स्टूडियो में आपका स्वागत है। अपने शब्दों को एक नई आवाज़ दें।' },
  { id: 'es', name: 'Spanish', regions: ['Spain', 'Mexico'], sample: 'Cada gran historia comienza con una voz. Dale vida a tus ideas y comparte tu historia con el mundo.' },
  { id: 'fr', name: 'French', regions: ['France', 'Canada'], sample: 'Chaque grande histoire commence par une voix. Donnez vie à vos idées et partagez votre histoire avec le monde.' },
] as const;
export const TONES = ['Natural', 'Warm & friendly', 'Professional', 'Storytelling', 'Energetic', 'Calm'] as const;
export const PACES = ['Slow', 'Normal', 'Fast'] as const;
export const MAX_TEXT_LENGTH = 5000;
