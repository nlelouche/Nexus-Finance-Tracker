import React, { useState, useEffect, useRef } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Card } from '../ui';
import { X, Send, User, Sparkles, Brain } from 'lucide-react';
import { callOllama, buildFinancialContext } from '../../utils/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NexusChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export const NexusChat = ({ isOpen, onClose, initialMessage }: NexusChatProps) => {
  const { transactions, investments, exchangeRates } = useFinanceStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([{ role: 'assistant', content: initialMessage }]);
    } else if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: '¡Hola! Soy Nexus. ¿En qué quilombo financiero te puedo ayudar hoy? Tengo acceso a tus datos locales para darte la posta.' }]);
    }
  }, [initialMessage, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const context = buildFinancialContext(transactions, investments, exchangeRates);
      
      // Build conversation history for the prompt
      const history = messages
        .slice(-5) // Send last 5 messages for context
        .map(m => `${m.role === 'user' ? 'Usuario' : 'Nexus'}: ${m.content}`)
        .join('\n');

      const prompt = `
${context}

HISTORIAL DE CHAT:
${history}

NUEVA PREGUNTA DEL USUARIO:
${userMessage}

RESPUESTA:
(Responde de forma concisa, profesional y con personalidad rioplatense. Usa los datos del contexto si es relevante para la pregunta.)
`;

      const result = await callOllama(prompt);
      
      if (result.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Perdón, tuve un problema: ${result.error}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Se rompió algo conectando con la IA. Fijate si Ollama está prendido.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-end p-4 md:p-8 pointer-events-none">
      <Card className="w-full max-w-[450px] h-[600px] flex flex-col shadow-2xl border-white/10 bg-gray-950/90 backdrop-blur-2xl pointer-events-auto animate-in slide-in-from-right-10 duration-300 overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="text-indigo-400" size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Nexus Advisor</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Local Insight Active</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
        >
          {messages.map((m, i) => (
            <div 
              key={i}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white'}`}>
                {m.role === 'user' ? <User size={16} /> : <Brain size={16} />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-white/5 text-indigo-100 border border-white/5 rounded-tl-none'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Brain size={16} />
              </div>
              <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-white/5">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Preguntale lo que sea a Nexus..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-white/20 text-white rounded-lg transition-all"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[9px] text-center text-text-secondary mt-2 opacity-50">Privacidad garantizada. Nexus corre localmente.</p>
        </div>
      </Card>
    </div>
  );
};
