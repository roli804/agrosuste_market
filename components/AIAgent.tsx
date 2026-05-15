
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Leaf, Sprout, TrendingUp, MapPin, MessageCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `És o Assistente AgroSuste — especialista em agricultura sustentável e mercados agrícolas de Moçambique.
Responde sempre em Português de Moçambique. Sê conciso, útil e profissional. Máximo 3 parágrafos por resposta.
Podes ajudar com: preços de mercado actuais, técnicas de cultivo sustentável, logística e transportes, financiamento agrícola, culturas regionais de Moçambique (milho, mandioca, amendoim, soja, hortícolas), e como usar a plataforma AgroSuste Market.
A plataforma AgroSuste conecta produtores rurais a compradores urbanos, com verificação de certificação e pagamentos via M-Pesa e e-Mola.
Quando não souberes uma resposta específica, sugere contactar um técnico ou extensionista da região.`;

const SUGGESTIONS = [
  { icon: <TrendingUp size={12} />, text: 'Preços actuais do mercado' },
  { icon: <Sprout size={12} />, text: 'Dicas de cultivo sustentável' },
  { icon: <MapPin size={12} />, text: 'Logística e transportes' },
  { icon: <Leaf size={12} />, text: 'Culturas recomendadas' },
];

const AIAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const groqKey: string | undefined = (import.meta as any).env.VITE_GROQ_API_KEY;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const handler = () => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 300); };
    window.addEventListener('open-ai-chat', handler);
    return () => window.removeEventListener('open-ai-chat', handler);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    if (!ai) {
      setMessages(prev => [...prev, { role: 'model', text: 'Assistente de IA não configurado. Por favor, contacte o suporte.' }]);
      setLoading(false);
      return;
    }

    try {
      const history = messages.map(m => `${m.role === 'user' ? 'Utilizador' : 'Assistente'}: ${m.text}`).join('\n');
      const prompt = `${SYSTEM_PROMPT}\n\n${history}\nUtilizador: ${text}\nAssistente:`;
      const result = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
      const reply = result.text?.trim() || 'Não consegui gerar uma resposta. Tente novamente.';
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'Erro temporário. Verifique a sua ligação e tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500]">
      {/* ── Chat Widget ─────────────────────────────────── */}
      {isOpen && (
        <div
          className="mb-4 flex flex-col overflow-hidden"
          style={{
            width: '360px', height: '540px',
            borderRadius: '24px',
            background: 'white',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
            border: '1px solid rgba(0,0,0,0.06)',
            animation: 'chatSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.20)' }}
              >
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-poppins font-bold text-white text-[14px] leading-none">{t('ai_agent_title')}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-[#69F0AE] rounded-full animate-pulse" />
                  <span className="text-white/60 text-[10px] font-medium">Online · Núcleo Central</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:rotate-90"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }}
            >
              <X size={15} className="text-white" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-grow overflow-y-auto px-4 py-4 space-y-3"
            style={{ background: '#F8FAF8' }}
          >
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center pt-4 pb-2">
                <div className="w-14 h-14 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mb-3">
                  <Leaf size={28} className="text-[#2E7D32]" />
                </div>
                <p className="font-poppins font-bold text-[#1C1C1C] text-[14px] mb-1">Como posso ajudar?</p>
                <p className="text-[#9A9A9A] text-[12px] leading-relaxed mb-5 max-w-[200px]">
                  Sou especialista em agricultura e mercados de Moçambique
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s.text}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:bg-[#2E7D32] hover:text-white"
                      style={{ background: 'white', color: '#2E7D32', border: '1px solid #C8E6C9' }}
                    >
                      {s.icon} {s.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'model' && (
                  <div className="w-7 h-7 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0 mb-0.5">
                    <Bot size={14} className="text-[#2E7D32]" />
                  </div>
                )}
                <div
                  className="max-w-[78%] px-3.5 py-2.5 text-[13px] leading-relaxed font-medium"
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg,#2E7D32,#1B5E20)'
                      : 'white',
                    color: msg.role === 'user' ? 'white' : '#2D2D2D',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    boxShadow: msg.role === 'model' ? '0 1px 4px rgba(0,0,0,0.07)' : '0 2px 8px rgba(46,125,50,0.22)',
                    border: msg.role === 'model' ? '1px solid #F0F0F0' : 'none',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-[#2E7D32]" />
                </div>
                <div className="bg-white border border-[#F0F0F0] px-4 py-3 rounded-[18px] rounded-bl-[4px] shadow-sm flex gap-1.5 items-center">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="px-4 py-3 flex-shrink-0 flex items-center gap-2"
            style={{ background: 'white', borderTop: '1px solid #F0F0F0' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai_agent_placeholder')}
              disabled={loading}
              className="flex-grow bg-[#F5F7F5] rounded-xl px-4 py-2.5 text-[13px] font-medium text-[#1C1C1C] outline-none border border-transparent focus:border-[#C8E6C9] focus:bg-white transition-all placeholder:text-[#B0B0B0]"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#2E7D32,#1B5E20)', boxShadow: '0 2px 8px rgba(46,125,50,0.28)' }}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── FAB Toggle ──────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(o => !o)}
          className="relative flex items-center justify-center transition-all duration-300 group active:scale-95"
          style={{
            width: '52px', height: '52px', borderRadius: '16px',
            background: isOpen ? '#1B5E20' : 'linear-gradient(135deg,#2E7D32,#1B5E20)',
            boxShadow: '0 4px 20px rgba(46,125,50,0.38), 0 2px 8px rgba(0,0,0,0.14)',
            border: '2px solid rgba(255,255,255,0.15)',
            transform: isOpen ? 'rotate(0deg)' : undefined,
          }}
        >
          {isOpen
            ? <X size={20} className="text-white" />
            : <MessageCircle size={20} className="text-white" />
          }
          {!isOpen && (
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#69F0AE] rounded-full border-2 border-white animate-pulse"
            />
          )}
        </button>
      </div>

      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AIAgent;
