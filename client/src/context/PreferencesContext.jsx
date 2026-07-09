import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../api/api";

const LANGUAGE_KEY = "tourismhub_language";
const CURRENCY_KEY = "tourismhub_currency";
const CACHE_PREFIX = "tourismhub_translation_cache_v3";

const languages = [
  { value: "en", code: "GB", name: "ENGLISH", flag: "https://flagcdn.com/w40/gb.png" },
  { value: "zh-CN", code: "CN", name: "MANDARIN", flag: "https://flagcdn.com/w40/cn.png" },
  { value: "hi", code: "IN", name: "HINDI", flag: "https://flagcdn.com/w40/in.png" },
  { value: "ta", code: "IN", name: "TAMIL", flag: "https://flagcdn.com/w40/in.png" },
  { value: "de", code: "DE", name: "GERMAN", flag: "https://flagcdn.com/w40/de.png" },
  { value: "fr", code: "FR", name: "FRENCH", flag: "https://flagcdn.com/w40/fr.png" },
  { value: "ru", code: "RU", name: "RUSSIAN", flag: "https://flagcdn.com/w40/ru.png" },
  { value: "ar", code: "SA", name: "ARABIC", flag: "https://flagcdn.com/w40/sa.png" },
  { value: "ja", code: "JP", name: "JAPANESE", flag: "https://flagcdn.com/w40/jp.png" },
  { value: "it", code: "IT", name: "ITALIAN", flag: "https://flagcdn.com/w40/it.png" },
  { value: "nl", code: "NL", name: "DUTCH", flag: "https://flagcdn.com/w40/nl.png" },
  { value: "pl", code: "PL", name: "POLISH", flag: "https://flagcdn.com/w40/pl.png" },
  { value: "es", code: "ES", name: "SPANISH", flag: "https://flagcdn.com/w40/es.png" },
  { value: "ko", code: "KR", name: "KOREAN", flag: "https://flagcdn.com/w40/kr.png" },
  { value: "el", code: "GR", name: "GREEK", flag: "https://flagcdn.com/w40/gr.png" },
];

const currencies = [
  { value: "LKR", label: "LKR", symbol: "Rs.", locale: "en-LK", rate: 1 },
  { value: "USD", label: "USD", symbol: "$", locale: "en-US", rate: 1 / 300 },
  { value: "EUR", label: "EUR", symbol: "\u20ac", locale: "de-DE", rate: 1 / 325 },
  { value: "GBP", label: "GBP", symbol: "\u00a3", locale: "en-GB", rate: 1 / 380 },
];

const blockedTags = new Set([
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "SVG",
]);

const translatableAttributes = ["placeholder", "title", "aria-label"];
const originalText = new WeakMap();
const originalAttributes = new WeakMap();
const trackedTextNodes = new Set();
const trackedAttributeElements = new Set();
const originalCurrencyText = new WeakMap();
const trackedCurrencyNodes = new Set();
const originalCurrencyElementText = new WeakMap();
const trackedCurrencyElements = new Set();
const PreferencesContext = createContext(null);
const googleTranslateElementId = "google_translate_element";
const googleTranslateLanguages = languages
  .filter((item) => item.value !== "en")
  .map((item) => item.value)
  .join(",");
let googleTranslateLoader = null;
let languageReloadTimer = 0;

const isSupportedLanguage = (value) => languages.some((item) => item.value === value);
const isSupportedCurrency = (value) => currencies.some((item) => item.value === value);

const readSavedLanguage = () => {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return isSupportedLanguage(saved) ? saved : "en";
};

const readSavedCurrency = () => {
  const saved = localStorage.getItem(CURRENCY_KEY);
  return isSupportedCurrency(saved) ? saved : "LKR";
};

const normaliseText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const canTranslateText = (value) => {
  const text = normaliseText(value);

  if (text.length < 2 || text.length > 600) return false;
  if (/^[\d\s.,:;/\\\-+()[\]#%$€£₹]+$/.test(text)) return false;
  if (/^(https?:\/\/|www\.|[\w.-]+@[\w.-]+)/i.test(text)) return false;

  return /[A-Za-z]/.test(text);
};

const shouldSkipElement = (element) => {
  if (!element) return true;
  if (blockedTags.has(element.tagName)) return true;
  return Boolean(element.closest("[data-no-translate], .notranslate"));
};

const readCache = (language) => {
  try {
    return JSON.parse(localStorage.getItem(`${CACHE_PREFIX}_${language}`) || "{}");
  } catch {
    return {};
  }
};

const writeCache = (language, cache) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}_${language}`, JSON.stringify(cache));
  } catch {
    // Ignore storage quota errors; translation still works for the current view.
  }
};

const ensureGoogleTranslateElement = () => {
  if (document.getElementById(googleTranslateElementId)) return;

  const element = document.createElement("div");
  element.id = googleTranslateElementId;
  element.className = "notranslate";
  element.style.position = "fixed";
  element.style.left = "-9999px";
  element.style.top = "-9999px";
  element.style.width = "1px";
  element.style.height = "1px";
  element.style.overflow = "hidden";
  document.body.appendChild(element);
};

const injectGoogleTranslateStyles = () => {
  if (document.getElementById("google_translate_cleanup_styles")) return;

  const style = document.createElement("style");
  style.id = "google_translate_cleanup_styles";
  style.textContent = `
    body { top: 0 !important; }
    .skiptranslate,
    .goog-te-banner-frame,
    .goog-te-balloon-frame,
    #goog-gt-tt {
      display: none !important;
    }
    iframe.goog-te-banner-frame {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
};

const loadGoogleTranslate = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Browser is not available."));
  }

  if (window.google?.translate?.TranslateElement) {
    return Promise.resolve();
  }

  if (googleTranslateLoader) return googleTranslateLoader;

  googleTranslateLoader = new Promise((resolve, reject) => {
    ensureGoogleTranslateElement();
    injectGoogleTranslateStyles();

    window.tourismHubGoogleTranslateInit = () => {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: googleTranslateLanguages,
            autoDisplay: false,
          },
          googleTranslateElementId
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    const existingScript = document.querySelector("script[data-tourismhub-google-translate]");
    if (existingScript) return;

    const script = document.createElement("script");
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=tourismHubGoogleTranslateInit";
    script.async = true;
    script.dataset.tourismhubGoogleTranslate = "true";
    script.onerror = () => reject(new Error("Google Translate script failed to load."));
    document.head.appendChild(script);
  });

  return googleTranslateLoader;
};

const writeGoogleTranslateCookie = (value, expires) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const host = window.location.hostname;
  const isIpAddress = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  const domainCandidates =
    host && host !== "localhost" && !isIpAddress
      ? [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`]
      : [];
  const pathCandidates = ["/", window.location.pathname || "/"];
  const targets = new Set();

  pathCandidates.forEach((path) => {
    targets.add(`path=${path}`);
    domainCandidates.forEach((domain) => {
      targets.add(`path=${path};domain=${domain}`);
    });
  });

  targets.forEach((target) => {
    document.cookie = `googtrans=${value};${target};${expires};SameSite=Lax`;
  });
};

const setGoogleTranslateCookie = (language) => {
  const value = language === "en" ? "/en/en" : `/en/${language}`;
  writeGoogleTranslateCookie(value, "max-age=31536000");
};

const clearGoogleTranslateCookie = () => {
  writeGoogleTranslateCookie("", "expires=Thu, 01 Jan 1970 00:00:00 GMT");
  writeGoogleTranslateCookie("/en/en", "max-age=31536000");
};

const scheduleLanguageReload = () => {
  if (typeof window === "undefined") return;

  if (languageReloadTimer) {
    window.clearTimeout(languageReloadTimer);
  }

  languageReloadTimer = window.setTimeout(() => {
    window.location.reload();
  }, 120);
};

const restoreLanguageSelectorLabels = () => {
  const languageSelect = document.querySelector("select[data-language-selector='true']");
  if (!languageSelect) return;

  Array.from(languageSelect.options).forEach((option) => {
    const sourceLabel = option.dataset.sourceLabel;
    if (sourceLabel && option.textContent !== sourceLabel) {
      option.textContent = sourceLabel;
    }
  });
};

const syncDynamicTitles = () => {
  document.querySelectorAll("[data-dynamic-title='true']").forEach((element) => {
    const text = String(element.textContent || "").replace(/\s+/g, " ").trim();
    if (text) {
      element.setAttribute("title", text);
      element.setAttribute("data-tooltip", text);
    }
  });
};

const applyGooglePageLanguage = async (language) => {
  await loadGoogleTranslate();

  if (language === "en") {
    clearGoogleTranslateCookie();
  } else {
    setGoogleTranslateCookie(language);
  }

  const applyComboValue = () => {
    const combo = document.querySelector(".goog-te-combo");

    if (!combo) return false;

    const desiredValue = language === "en" ? "" : language;

    if (combo.value === desiredValue) {
      return true;
    }

    combo.value = desiredValue;
    combo.dispatchEvent(new Event("change", { bubbles: true }));
    window.setTimeout(restoreLanguageSelectorLabels, 100);
    window.setTimeout(restoreLanguageSelectorLabels, 600);
    window.setTimeout(syncDynamicTitles, 220);
    window.setTimeout(syncDynamicTitles, 900);
    return true;
  };

  if (applyComboValue()) return true;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    if (applyComboValue()) return true;
  }

  return false;
};

const collectTextNodes = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
      if (!canTranslateText(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  let current = walker.nextNode();

  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }

  return nodes;
};

const collectAttributeElements = () => {
  return Array.from(document.body.querySelectorAll("[placeholder], [title], [aria-label]"))
    .filter((element) => !shouldSkipElement(element));
};

const getCurrencyOption = (value) =>
  currencies.find((item) => item.value === value) || currencies[0];

const formatCurrencyFromLkr = (amount, currency) => {
  const option = getCurrencyOption(currency);
  const converted = Number(amount || 0) * option.rate;

  if (option.value === "LKR") {
    return `Rs. ${Math.round(converted).toLocaleString(option.locale)}`;
  }

  return `${option.symbol}${converted.toLocaleString(option.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const convertCurrencyText = (text, currency) => {
  const value = String(text || "");
  const rangePattern =
    /\b(?:Rs\.?|LKR)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*[-–]\s*)([0-9][0-9,]*(?:\.\d+)?)/gi;
  const pricePattern = /\b(?:Rs\.?|LKR)\s*([0-9][0-9,]*(?:\.\d+)?)/gi;

  return value
    .replace(rangePattern, (match, firstAmount, divider, secondAmount) => {
      const firstValue = Number(String(firstAmount).replace(/,/g, ""));
      const secondValue = Number(String(secondAmount).replace(/,/g, ""));

      if (!Number.isFinite(firstValue) || !Number.isFinite(secondValue)) {
        return match;
      }

      return `${formatCurrencyFromLkr(firstValue, currency)}${divider}${formatCurrencyFromLkr(
        secondValue,
        currency
      )}`;
    })
    .replace(pricePattern, (match, amount) => {
      const numericAmount = Number(String(amount).replace(/,/g, ""));
      if (!Number.isFinite(numericAmount)) return match;
      return formatCurrencyFromLkr(numericAmount, currency);
    });
};

const collectCurrencyTextNodes = () => {
  if (typeof document === "undefined" || !document.body) return [];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
      if (!/\b(?:Rs\.?|LKR)\s*[0-9]/i.test(node.nodeValue || "")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  let current = walker.nextNode();

  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }

  return nodes;
};

const collectCurrencyLeafElements = () => {
  if (typeof document === "undefined" || !document.body) return [];

  return Array.from(document.body.querySelectorAll("*")).filter((element) => {
    if (shouldSkipElement(element)) return false;
    if (element.children.length > 0) return false;
    if (!/\b(?:Rs\.?|LKR)\s*[0-9]/i.test(element.textContent || "")) return false;
    return element.childNodes.length > 1;
  });
};

const applyCurrencyToDocument = (currency) => {
  trackedCurrencyElements.forEach((element) => {
    const source = originalCurrencyElementText.get(element);
    if (source === undefined) return;

    const target = currency === "LKR" ? source : convertCurrencyText(source, currency);
    if (element.textContent !== target) {
      element.textContent = target;
    }
  });

  trackedCurrencyNodes.forEach((node) => {
    const source = originalCurrencyText.get(node);
    if (source === undefined) return;

    const target = currency === "LKR" ? source : convertCurrencyText(source, currency);
    if (node.nodeValue !== target) {
      node.nodeValue = target;
    }
  });

  collectCurrencyLeafElements().forEach((element) => {
    if (!originalCurrencyElementText.has(element)) {
      originalCurrencyElementText.set(element, element.textContent);
      trackedCurrencyElements.add(element);
    }

    const source = originalCurrencyElementText.get(element);
    const target = currency === "LKR" ? source : convertCurrencyText(source, currency);
    if (element.textContent !== target) {
      element.textContent = target;
    }
  });

  collectCurrencyTextNodes().forEach((node) => {
    if (!originalCurrencyText.has(node)) {
      originalCurrencyText.set(node, node.nodeValue);
      trackedCurrencyNodes.add(node);
    }

    const source = originalCurrencyText.get(node);
    const target = currency === "LKR" ? source : convertCurrencyText(source, currency);
    if (node.nodeValue !== target) {
      node.nodeValue = target;
    }
  });
};

const restoreEnglish = () => {
  trackedTextNodes.forEach((node) => {
    const source = originalText.get(node);
    if (source !== undefined) {
      node.nodeValue = source;
    }
  });

  trackedAttributeElements.forEach((element) => {
    const saved = originalAttributes.get(element);
    if (!saved) return;

    Object.entries(saved).forEach(([attribute, source]) => {
      element.setAttribute(attribute, source);
    });
  });
};

async function translateDocument(language, requestIdRef) {
  if (typeof document === "undefined" || !document.body) return;

  const requestId = requestIdRef.current;

  restoreEnglish();

  if (language === "en") {
    return;
  }

  const textNodes = collectTextNodes();
  const attributeElements = collectAttributeElements();
  const cache = readCache(language);
  const pending = new Set();

  textNodes.forEach((node) => {
    if (!originalText.has(node)) {
      originalText.set(node, node.nodeValue);
      trackedTextNodes.add(node);
    }

    const source = normaliseText(originalText.get(node));
    if (source && !cache[source]) pending.add(source);
  });

  attributeElements.forEach((element) => {
    const saved = originalAttributes.get(element) || {};

    translatableAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value || !canTranslateText(value)) return;

      if (!saved[attribute]) {
        saved[attribute] = value;
      }

      const source = normaliseText(saved[attribute]);
      if (source && !cache[source]) pending.add(source);
    });

    if (Object.keys(saved).length > 0) {
      originalAttributes.set(element, saved);
      trackedAttributeElements.add(element);
    }
  });

  const missingTexts = Array.from(pending);

  if (missingTexts.length > 0) {
    for (let index = 0; index < missingTexts.length; index += 100) {
      const batch = missingTexts.slice(index, index + 100);

      try {
        const response = await api.post("/translate/batch", {
          target: language,
          texts: batch,
        });

        Object.entries(response.data.translations || {}).forEach(([source, translated]) => {
          if (translated && translated !== source) {
            cache[source] = translated;
          }
        });
      } catch (error) {
        console.warn("Translation request failed:", error.message);
      }
    }

    writeCache(language, cache);
  }

  if (requestId !== requestIdRef.current) return;

  textNodes.forEach((node) => {
    const source = originalText.get(node);
    const cleanSource = normaliseText(source);
    const translated = cache[cleanSource];

    if (translated) {
      node.nodeValue = String(source).replace(cleanSource, translated);
    }
  });

  attributeElements.forEach((element) => {
    const saved = originalAttributes.get(element);
    if (!saved) return;

    Object.entries(saved).forEach(([attribute, source]) => {
      const cleanSource = normaliseText(source);
      const translated = cache[cleanSource];
      if (translated) {
        element.setAttribute(attribute, translated);
      }
    });
  });
}

export function PreferencesProvider({ children }) {
  const [language, setLanguageState] = useState(readSavedLanguage);
  const [currency, setCurrencyState] = useState(readSavedCurrency);
  const requestIdRef = useRef(0);
  const currencyRef = useRef(currency);

  const setLanguage = useCallback((value) => {
    const nextLanguage = isSupportedLanguage(value) ? value : "en";
    localStorage.setItem(LANGUAGE_KEY, nextLanguage);

    if (nextLanguage === "en") {
      setLanguageState(nextLanguage);
      clearGoogleTranslateCookie();
      scheduleLanguageReload();
      return;
    }

    setGoogleTranslateCookie(nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  const setCurrency = useCallback((value) => {
    const nextCurrency = isSupportedCurrency(value) ? value : "LKR";
    localStorage.setItem(CURRENCY_KEY, nextCurrency);
    setCurrencyState(nextCurrency);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.language = language;
  }, [language]);

  useEffect(() => {
    currencyRef.current = currency;
    document.documentElement.dataset.currency = currency;
    applyCurrencyToDocument(currency);
  }, [currency]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyCurrencyToDocument(currency);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [currency]);

  useEffect(() => {
    let frame = 0;
    let translating = false;

    const scheduleTranslate = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(async () => {
        frame = 0;
        translating = true;
        requestIdRef.current += 1;

        try {
          const googleApplied = await applyGooglePageLanguage(language);

          if (!googleApplied) {
            await translateDocument(language, requestIdRef);
          }
        } catch (error) {
          console.warn("Google page translation unavailable:", error.message);
          await translateDocument(language, requestIdRef);
        }

        applyCurrencyToDocument(currencyRef.current);
        translating = false;
      });
    };

    scheduleTranslate();

    const observer = new MutationObserver(() => {
      if (!translating) {
        scheduleTranslate();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatableAttributes,
    });

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      currency,
      languages,
      currencies,
      setLanguage,
      setCurrency,
      formatMoney: (amount) => formatCurrencyFromLkr(amount, currency),
    }),
    [currency, language, setCurrency, setLanguage]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider");
  }

  return context;
}
