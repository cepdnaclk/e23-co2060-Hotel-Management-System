const { GoogleGenAI } = require("@google/genai");

const supportedLanguages = new Set([
  "en",
  "zh-cn",
  "hi",
  "ta",
  "de",
  "fr",
  "ru",
  "ar",
  "ja",
  "it",
  "nl",
  "pl",
  "es",
  "ko",
  "el",
]);
const providerCache = new Map();

const targetLanguageNames = {
  "zh-cn": "Mandarin Chinese using Simplified Chinese characters",
  hi: "Hindi",
  ta: "Tamil",
  de: "German",
  fr: "French",
  ru: "Russian",
  ar: "Arabic",
  ja: "Japanese",
  it: "Italian",
  nl: "Dutch",
  pl: "Polish",
  es: "Spanish",
  ko: "Korean",
  el: "Greek",
};

const localDictionary = {
  si: {
    Home: "මුල් පිටුව",
    Hotels: "හෝටල්",
    Explore: "ගවේෂණය",
    "Plan Trip": "ගමන සැලසුම් කරන්න",
    Events: "උත්සව",
    Guides: "මාර්ගෝපදේශකයින්",
    "About Us": "අප ගැන",
    "List your property": "ඔබේ දේපළ එක් කරන්න",
    Logout: "ඉවත් වන්න",
    Login: "පිවිසෙන්න",
    Register: "ලියාපදිංචි වන්න",
    "Find hotels": "හෝටල් සොයන්න",
    "Explore Sri Lanka": "ශ්‍රී ලංකාව ගවේෂණය කරන්න",
    "Plan trip": "ගමන සැලසුම් කරන්න",
    "Back to top": "ඉහළට යන්න",
    "My bookings": "මගේ වෙන්කිරීම්",
    "Search": "සොයන්න",
    "Clear": "හිස් කරන්න",
    "Destination": "ගමනාන්තය",
    "Price range": "මිල පරාසය",
    "Loading": "පූරණය වෙමින්",
    "Contact hotel": "හෝටලය අමතන්න",
    "View Details": "විස්තර බලන්න",
    "Book Now": "දැන් වෙන්කරන්න",
    "Reserve Now": "දැන් වෙන්කරන්න",
  },
  ta: {
    Home: "முகப்பு",
    Hotels: "ஹோட்டல்கள்",
    Explore: "ஆராயுங்கள்",
    "Plan Trip": "பயணம் திட்டமிடு",
    Events: "நிகழ்வுகள்",
    Guides: "வழிகாட்டிகள்",
    "About Us": "எங்களை பற்றி",
    "List your property": "உங்கள் சொத்தை சேர்க்கவும்",
    Logout: "வெளியேறு",
    Login: "உள்நுழை",
    Register: "பதிவு செய்",
    "Find hotels": "ஹோட்டல்கள் தேடு",
    "Explore Sri Lanka": "இலங்கையை ஆராயுங்கள்",
    "Plan trip": "பயணம் திட்டமிடு",
    "Back to top": "மேலே செல்ல",
    "My bookings": "என் முன்பதிவுகள்",
    Search: "தேடு",
    Clear: "அழி",
    Destination: "இலக்கு",
    "Price range": "விலை வரம்பு",
    Loading: "ஏற்றுகிறது",
    "Contact hotel": "ஹோட்டலை தொடர்பு கொள்ளவும்",
    "View Details": "விவரங்களை பார்க்க",
    "Book Now": "இப்போது முன்பதிவு செய்",
    "Reserve Now": "இப்போது முன்பதிவு செய்",
  },
};

const normaliseText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const getCacheKey = (target, text) => `${target}:${text}`;

const getGoogleTranslations = async (texts, target) => {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) return null;

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        target,
        source: "en",
        format: "text",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Translate failed with status ${response.status}`);
  }

  const payload = await response.json();
  return (payload.data?.translations || []).map((item) => item.translatedText || "");
};

const getGeminiTranslations = async (texts, target) => {
  if (!process.env.GEMINI_API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const targetName = targetLanguageNames[target] || target;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_TRANSLATION_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: `Translate this JSON array from English to ${targetName}. Keep brand names, numbers, URLs, currency codes, and HTML-free punctuation unchanged. Return only a JSON array of strings in the same order.\n${JSON.stringify(texts)}`,
  });

  const output = String(response.text || "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed.map((item) => String(item || "")) : null;
};

const getLocalTranslations = (texts, target) => {
  const dictionary = localDictionary[target] || {};
  return texts.map((text) => dictionary[text] || text);
};

const getProviderOrder = () => {
  const preferredProvider = String(process.env.TRANSLATION_PROVIDER || "google").toLowerCase();
  const providers = ["google", "gemini"];

  if (!providers.includes(preferredProvider)) {
    return providers;
  }

  return [
    preferredProvider,
    ...providers.filter((provider) => provider !== preferredProvider),
  ];
};

const translateWithProvider = async (provider, texts, target) => {
  if (provider === "gemini") {
    return getGeminiTranslations(texts, target);
  }

  if (provider === "google") {
    return getGoogleTranslations(texts, target);
  }

  return null;
};

const translateBatch = async (req, res) => {
  try {
    const target = String(req.body.target || "en").toLowerCase();
    const texts = Array.isArray(req.body.texts) ? req.body.texts : [];

    if (!supportedLanguages.has(target)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported language.",
      });
    }

    const cleanTexts = texts
      .map(normaliseText)
      .filter(Boolean)
      .slice(0, 150);

    if (target === "en" || cleanTexts.length === 0) {
      return res.json({
        success: true,
        provider: "source",
        translations: cleanTexts.reduce((map, text) => ({ ...map, [text]: text }), {}),
      });
    }

    const uniqueTexts = [...new Set(cleanTexts)];
    const translations = {};
    const missingTexts = [];

    uniqueTexts.forEach((text) => {
      const cached = providerCache.get(getCacheKey(target, text));
      if (cached) {
        translations[text] = cached;
      } else {
        missingTexts.push(text);
      }
    });

    let provider = "cache";

    if (missingTexts.length > 0) {
      let translated = null;
      const providerOrder = getProviderOrder();

      for (const providerName of providerOrder) {
        try {
          translated = await translateWithProvider(providerName, missingTexts, target);
          if (translated) {
            provider = providerName;
            break;
          }
        } catch (error) {
          console.warn(`${providerName} translation unavailable:`, error.message);
        }
      }

      if (!translated) {
        translated = getLocalTranslations(missingTexts, target);
        provider = "local";
      }

      missingTexts.forEach((text, index) => {
        const translatedText = translated[index] || text;
        translations[text] = translatedText;
        providerCache.set(getCacheKey(target, text), translatedText);
      });
    }

    return res.json({
      success: true,
      provider,
      translations,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to translate text.",
    });
  }
};

module.exports = {
  translateBatch,
};
