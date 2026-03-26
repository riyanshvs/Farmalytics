/**
 * Google Translate Service
 * Handles real-time translation using Google Translate API
 * Caches translations in localStorage for performance
 */

export type Language = "en" | "hi";

interface TranslationCache {
  [key: string]: {
    [lang: string]: string;
  };
}

class TranslateService {
  private cache: TranslationCache = {};
  private readonly GOOGLE_TRANSLATE_API = "https://translate.googleapis.com/translate_a/element.js";

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Load cached translations from localStorage
   */
  private loadCacheFromStorage() {
    try {
      const stored = localStorage.getItem("translationCache");
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading translation cache:", error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage() {
    try {
      localStorage.setItem("translationCache", JSON.stringify(this.cache));
    } catch (error) {
      console.error("Error saving translation cache:", error);
    }
  }

  /**
   * Translate text using Google Translate API
   * Falls back to original text if translation fails
   */
  async translate(text: string, targetLanguage: Language, sourceLanguage: Language = "en"): Promise<string> {
    if (sourceLanguage === targetLanguage || !text) {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}|${sourceLanguage}|${targetLanguage}`;
    if (this.cache[cacheKey]?.[targetLanguage]) {
      return this.cache[cacheKey][targetLanguage];
    }

    try {
      // Use Google Translate API via fetch
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`
      );

      if (!response.ok) throw new Error("Translation API error");

      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translatedText = data.responseData.translatedText;

        // Cache the result
        if (!this.cache[cacheKey]) {
          this.cache[cacheKey] = {};
        }
        this.cache[cacheKey][targetLanguage] = translatedText;
        this.saveCacheToStorage();

        return translatedText;
      }

      // Fallback to original text
      return text;
    } catch (error) {
      console.error("Translation error:", error);
      // Return original text if translation fails
      return text;
    }
  }

  /**
   * Translate multiple texts at once
   */
  async translateBatch(
    texts: string[],
    targetLanguage: Language,
    sourceLanguage: Language = "en"
  ): Promise<string[]> {
    return Promise.all(texts.map((text) => this.translate(text, targetLanguage, sourceLanguage)));
  }

  /**
   * Translate entire HTML element
   */
  async translateElement(element: HTMLElement, targetLanguage: Language): Promise<void> {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToTranslate: Text[] = [];
    let node;

    // Collect all text nodes
    while ((node = walker.nextNode())) {
      if (node.textContent?.trim()) {
        nodesToTranslate.push(node as Text);
      }
    }

    // Translate in batches
    const batchSize = 10;
    for (let i = 0; i < nodesToTranslate.length; i += batchSize) {
      const batch = nodesToTranslate.slice(i, i + batchSize);
      const texts = batch.map((n) => n.textContent || "");
      const translated = await this.translateBatch(texts, targetLanguage);

      batch.forEach((node, index) => {
        if (node.textContent) {
          node.textContent = translated[index];
        }
      });
    }
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.cache = {};
    localStorage.removeItem("translationCache");
  }
}

export const translateService = new TranslateService();
