// Simulated AI gesture recognition data
export interface GestureResult {
  gesture: string;
  confidence: number;
  text: string;
  emoji: string;
}

export interface TranslationRecord {
  id: string;
  gesture: string;
  text: string;
  translatedText: string;
  language: string;
  confidence: number;
  emoji: string;
  timestamp: Date;
  audioPlayed: boolean;
}

export const GESTURE_DATABASE: GestureResult[] = [
  { gesture: "HELLO", confidence: 97, text: "Hello", emoji: "👋" },
  { gesture: "THANK YOU", confidence: 95, text: "Thank you", emoji: "🙏" },
  { gesture: "I LOVE YOU", confidence: 98, text: "I love you", emoji: "🤟" },
  { gesture: "YES", confidence: 99, text: "Yes", emoji: "👍" },
  { gesture: "NO", confidence: 98, text: "No", emoji: "✋" },
  { gesture: "HELP", confidence: 94, text: "Help me", emoji: "🆘" },
  { gesture: "PLEASE", confidence: 93, text: "Please", emoji: "🙏" },
  { gesture: "SORRY", confidence: 96, text: "I'm sorry", emoji: "😔" },
  { gesture: "GOOD", confidence: 97, text: "Good", emoji: "👌" },
  { gesture: "BAD", confidence: 92, text: "Bad", emoji: "👎" },
  { gesture: "WATER", confidence: 94, text: "Water", emoji: "💧" },
  { gesture: "FOOD", confidence: 91, text: "Food", emoji: "🍽️" },
  { gesture: "HOME", confidence: 95, text: "Home", emoji: "🏠" },
  { gesture: "FRIEND", confidence: 93, text: "Friend", emoji: "🤝" },
  { gesture: "HOW ARE YOU", confidence: 96, text: "How are you?", emoji: "🤔" },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  "Hello": { en: "Hello", ta: "வணக்கம்", hi: "नमस्ते", fr: "Bonjour" },
  "Thank you": { en: "Thank you", ta: "நன்றி", hi: "धन्यवाद", fr: "Merci" },
  "I love you": { en: "I love you", ta: "நான் உன்னை நேசிக்கிறேன்", hi: "मैं तुमसे प्यार करता हूं", fr: "Je t'aime" },
  "Yes": { en: "Yes", ta: "ஆம்", hi: "हां", fr: "Oui" },
  "No": { en: "No", ta: "இல்லை", hi: "नहीं", fr: "Non" },
  "Help me": { en: "Help me", ta: "எனக்கு உதவுங்கள்", hi: "मेरी मदद करो", fr: "Aidez-moi" },
  "Please": { en: "Please", ta: "தயவுசெய்து", hi: "कृपया", fr: "S'il vous plaît" },
  "I'm sorry": { en: "I'm sorry", ta: "மன்னிக்கவும்", hi: "मुझे माफ करें", fr: "Je suis désolé" },
  "Good": { en: "Good", ta: "நல்லது", hi: "अच्छा", fr: "Bien" },
  "Bad": { en: "Bad", ta: "மோசமான", hi: "बुरा", fr: "Mauvais" },
  "Water": { en: "Water", ta: "தண்ணீர்", hi: "पानी", fr: "Eau" },
  "Food": { en: "Food", ta: "உணவு", hi: "खाना", fr: "Nourriture" },
  "Home": { en: "Home", ta: "வீடு", hi: "घर", fr: "Maison" },
  "Friend": { en: "Friend", ta: "நண்பன்", hi: "दोस्त", fr: "Ami" },
  "How are you?": { en: "How are you?", ta: "நீங்கள் எப்படி இருக்கிறீர்கள்?", hi: "आप कैसे हैं?", fr: "Comment allez-vous?" },
};

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ta", label: "Tamil", flag: "🇮🇳" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "fr", label: "French", flag: "🇫🇷" },
];

let idCounter = Date.now();
export function generateId() {
  return String(++idCounter);
}

export function getRandomGesture(): GestureResult {
  return GESTURE_DATABASE[Math.floor(Math.random() * GESTURE_DATABASE.length)];
}

export function getTranslation(text: string, langCode: string): string {
  return TRANSLATIONS[text]?.[langCode] ?? text;
}

export function saveTranslation(record: TranslationRecord) {
  const history = getHistory();
  history.unshift(record);
  localStorage.setItem("visionsign_history", JSON.stringify(history.slice(0, 100)));
}

export function getHistory(): TranslationRecord[] {
  const raw = localStorage.getItem("visionsign_history");
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return parsed.map((r: TranslationRecord) => ({
    ...r,
    timestamp: new Date(r.timestamp),
  }));
}

export function clearHistory() {
  localStorage.removeItem("visionsign_history");
}

export function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.9;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}
