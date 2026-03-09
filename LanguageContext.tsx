import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { translations, TranslationKey } from './translations';

type Language = 'pt' | 'en' | 'fr' | 'zh' | 'es' | 'ar' | 'hi' | 'ru' | 'ja' | 'de' | 'it' | 'sw' | 'zu' | 'af' | 'ko' | 'tr' | 'vi' | 'th' | 'el' | 'nl' | 'pl' | 'uk' | 'fa' | 'bn' | 'pa' | 'jv' | 'ms' | 'he' | 'id' | 'no' | 'da' | 'fi' | 'cs' | 'hu' | 'ro' | 'bg' | 'sr' | 'hr' | 'sk';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: any) => string;
  translateText: (text: string) => Promise<string>;
  translateBatch: (texts: string[]) => Promise<string[]>;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('agro_suste_lang') || 'pt';
  });

  const [translationsCache, setTranslationsCache] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem('agro_suste_translations_cache');
    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const ai = useMemo(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("LanguageContext: GEMINI_API_KEY não configurado.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }, []);

  useEffect(() => {
    localStorage.setItem('agro_suste_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('agro_suste_translations_cache', JSON.stringify(translationsCache));
  }, [translationsCache]);

  const t = (key: TranslationKey): string => {
    const langTranslations = translations[language] || translations['pt'];
    return langTranslations[key] || translations['pt'][key] || key;
  };

  const translateText = async (text: string): Promise<string> => {
    if (language === 'pt') return text;
    if (translationsCache[language]?.[text]) return translationsCache[language][text];
    if (!ai) return text;

    try {
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = `Translate the following agricultural text to ${language}. Return ONLY the translation, no extra text: "${text}"`;
      const result = await model.generateContent(prompt);
      const translated = result.response.text();

      setTranslationsCache(prev => ({
        ...prev,
        [language]: {
          ...(prev[language] || {}),
          [text]: translated
        }
      }));

      return translated;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  const translateBatch = async (texts: string[]): Promise<string[]> => {
    if (language === 'pt' || !ai) return texts;

    const results = [...texts];
    const toTranslate = texts.filter(t => !translationsCache[language]?.[t]);

    if (toTranslate.length === 0) {
      return texts.map(t => translationsCache[language][t]);
    }

    try {
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = `Translate this list of agricultural terms to ${language}. Return ONLY a JSON array of strings in the same order: ${JSON.stringify(toTranslate)}`;
      const result = await model.generateContent(prompt);
      const translatedArray = JSON.parse(result.response.text());

      setTranslationsCache(prev => {
        const newCache = { ...prev };
        if (!newCache[language]) newCache[language] = {};
        toTranslate.forEach((original, i) => {
          newCache[language][original] = translatedArray[i];
        });
        return newCache;
      });

      return texts.map(t => translationsCache[language]?.[t] || t);
    } catch (error) {
      console.error("Batch translation error:", error);
      return texts;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateText, translateBatch }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
