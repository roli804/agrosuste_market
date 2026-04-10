import { GoogleGenAI, Type } from "@google/genai";

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY não foi configurado. Recursos de IA estarão limitados.");
} else {
  ai = new GoogleGenAI({ apiKey });
}

export interface CountryPhoneInfo {
  prefix: string;
  minLength: number;
  maxLength: number;
  example: string;
  validPrefixes: string[]; // Ex: ["82", "83", "84", "85", "86", "87"] para MZ
}

export interface VerificationRequirements {
  documentName: string;
  documentPlaceholder: string;
  bankRequiredFields: string[];
  mobileWalletProviders: string[];
}

export interface EmailCredibility {
  isValid: boolean;
  reason?: string;
}

export async function verifyEmailCredibility(email: string): Promise<EmailCredibility> {
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!ai) {
    return { isValid: basicRegex.test(email), reason: "Validação básica (IA não configurada)." };
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Avalie se o endereço de email é válido e real: ${email}.
      Regras:
      1. Deve ser um email bem formado sintaticamente.
      2. Todos os provedores comuns (Gmail, Outlook, Hotmail, Yahoo, iCloud, MSN) e domínios corporativos são VÁLIDOS e respeitáveis.
      3. APENAS bloqueie emails de serviços de email temporário conhecidos (ex: mailinator, 10minutemail, temp-mail, guerrilla mail).
      4. Se for um domínio comum como outlook.com, hotmail.com ou yahoo.com, deve ser considerado VÁLIDO.
      Retorne apenas JSON com "isValid" (boolean) e "reason" (string curta em português explicando o motivo se for inválido).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["isValid", "reason"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    // Fallback básico se a IA falhar
    return { isValid: basicRegex.test(email), reason: "Email em formato inválido." };
  }
}

export async function getVerificationRequirements(country: string): Promise<VerificationRequirements> {
  const fallback = {
    documentName: "Documento de Identificação",
    documentPlaceholder: "Número do Documento",
    bankRequiredFields: ["Número de Conta", "NIB/IBAN"],
    mobileWalletProviders: ["M-Pesa", "e-Mola"]
  };
  if (!ai) return fallback;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List the financial verification requirements for an agricultural marketplace in ${country}.
      Return as JSON with the official document name, a placeholder for that document, a list of standard bank fields required, and common mobile wallet providers.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentName: { type: Type.STRING },
            documentPlaceholder: { type: Type.STRING },
            bankRequiredFields: { type: Type.ARRAY, items: { type: Type.STRING } },
            mobileWalletProviders: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["documentName", "documentPlaceholder", "bankRequiredFields", "mobileWalletProviders"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return fallback;
  }
}

export async function getCountryPhoneInfo(country: string): Promise<CountryPhoneInfo> {
  const fallback = {
    prefix: "+258",
    minLength: 9,
    maxLength: 9,
    example: "841234567",
    validPrefixes: ["82", "83", "84", "85", "86", "87"]
  };
  if (!ai) return fallback;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide the international phone metadata for: ${country}.
      Include dial code (e.g. +258), digits length (excluding prefix), a placeholder, AND a list of all current valid 2-digit starting prefixes for mobile and fixed operators.
      Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prefix: { type: Type.STRING },
            minLength: { type: Type.NUMBER },
            maxLength: { type: Type.NUMBER },
            example: { type: Type.STRING },
            validPrefixes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["prefix", "minLength", "maxLength", "example", "validPrefixes"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return fallback;
  }
}
