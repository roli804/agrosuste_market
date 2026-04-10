import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { translations, TranslationKey } from './translations';

type Language = 'pt' | 'en';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: any) => string;
  translateBatch: (texts: string[]) => Promise<string[]>;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

// Cache simples para evitar chamadas duplicadas à IA
const translationCache: Record<string, string> = {};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('agro_suste_lang') || 'pt';
  });

  const genAI = useMemo(() => {
    const key = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    if (!key) return null;
    return new GoogleGenAI(key);
  }, []);

  useEffect(() => {
    localStorage.setItem('agro_suste_lang', language);
  }, [language]);

  const translateBatch = async (texts: string[]): Promise<string[]> => {
    if (language === 'pt' || !genAI) return texts;

    const results: string[] = [];
    const ToTranslate: { text: string, originalIndex: number }[] = [];

    // 1. Verificar Cache
    texts.forEach((text, i) => {
      const cacheKey = `${language}:${text}`;
      if (translationCache[cacheKey]) {
        results[i] = translationCache[cacheKey];
      } else {
        ToTranslate.push({ text, originalIndex: i });
      }
    });

    if (ToTranslate.length === 0) return results;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Translate the following agricultural market items from Portuguese to English. 
                     Maintain professional trade terminology. Return ONLY the translated strings separated by '|||'.
                     Items: ${ToTranslate.map(t => t.text).join(' ||| ')}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedPart = response.text().split('|||').map(s => s.trim());

      translatedPart.forEach((translated, i) => {
        const originalInfo = ToTranslate[i];
        const cacheKey = `${language}:${originalInfo.text}`;
        translationCache[cacheKey] = translated;
        results[originalInfo.originalIndex] = translated;
      });

      return results;
    } catch (error) {
      console.error('Translation Error:', error);
      return texts; // Fallback para o original em caso de erro
    }
  };

  const t = (key: string): string => {
    const pt = translations['pt'] || {};
    const en = translations['en'] || {};
    
    // 1. Try Selected Language
    const currentSet = translations[language] || pt;
    if (currentSet[key as TranslationKey]) return currentSet[key as TranslationKey];
    
    // 2. Fallback to Portuguese
    if (pt[key as TranslationKey]) return pt[key as TranslationKey];
    
    // 3. Fallback to English
    if (en[key as TranslationKey]) return en[key as TranslationKey];
    
    // 4. Last resort: Format key as text
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateBatch }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
