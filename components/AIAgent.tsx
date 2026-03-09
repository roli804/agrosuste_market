
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const AIAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const ai = React.useMemo(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    if (!ai) {
      setMessages(prev => [...prev, { role: 'model', text: "IA não configurada. Por favor, adicione sua chave API nas configurações." }]);
      setLoading(false);
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: t('ai_agent_system'),
        },
      });

      const text = response.text || t('ai_agent_error');
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error("AI Agent Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: t('ai_agent_error') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[500]">
      {isOpen ? (
        <div className="bg-white w-[350px] h-[500px] rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1B5E20] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">{t('ai_agent_title')}</h3>
                <p className="text-[8px] font-bold opacity-50 uppercase tracking-widest">{t('ai_agent_status')}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-all">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="text-center py-10 space-y-4 opacity-30">
                <Bot size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">{t('ai_agent_placeholder')}</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${msg.role === 'user'
                  ? 'bg-[#1B5E20] text-white rounded-tr-none'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[#43A047] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#43A047] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#43A047] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder={t('ai_agent_placeholder')}
              className="flex-grow bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-green-500/20"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-[#1B5E20] text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-[#1B5E20] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
        >
          <Bot size={32} />
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
          <span className="absolute right-20 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {t('ai_agent_title')}
          </span>
        </button>
      )}
    </div>
  );
};

export default AIAgent;
