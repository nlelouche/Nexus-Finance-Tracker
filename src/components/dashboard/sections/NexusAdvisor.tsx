import { useState } from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { TooltipUI as Tooltip } from '../../ui';
import { Brain, Sparkles, AlertTriangle, RefreshCw, MessageSquare, Info } from 'lucide-react';
import { callOllama, buildFinancialContext } from '../../../utils/ai';

interface NexusAdvisorProps {
  onOpenChat: () => void;
}

export const NexusAdvisor = ({ onOpenChat }: NexusAdvisorProps) => {
  const { transactions, investments, exchangeRates, aiConfig } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAudit = async () => {
    setLoading(true);
    setError(null);
    
    const context = buildFinancialContext(transactions, investments, exchangeRates);
    const prompt = `${context}\n\nTAREA: Como mi Mentor Financiero, realizá una auditoría implacable de mi último mes. Identificá los 3 puntos donde estoy siendo más ineficiente o donde mi "yo del futuro" me putearía. No me des consejos de manual; hablame a mí basándote en MIS categorías [X]. Si algo no te cierra, decímelo de frente.`;

    const result = await callOllama(prompt, aiConfig);
    
    if (result.error) {
      setError(result.error);
    } else {
      setAudit(result.content);
    }
    setLoading(false);
  };

  return (
    <div className="h-full relative overflow-hidden bg-indigo-500/5 group/advisor border border-indigo-500/20 rounded-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Brain size={120} className="text-indigo-400" />
      </div>

      <div className="relative p-6">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="text-indigo-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">Nexus AI Advisor</h3>
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Auditoría de Hábitos en Tiempo Real</p>
            </div>
          </div>
          
          <Tooltip content="Ejecuta una auditoría financiera usando tu IA local (Ollama).">
            <div className="p-1.5 bg-white/5 rounded-full text-text-secondary cursor-help">
              <Info size={14} />
            </div>
          </Tooltip>
        </header>

        {error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6 flex items-start gap-3">
            <AlertTriangle className="text-rose-400 shrink-0" size={18} />
            <p className="text-xs text-rose-200">{error}</p>
          </div>
        ) : !audit ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center animate-pulse">
              <Brain className="text-indigo-400/50" size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary mb-1">Nexus está listo para analizar tu laburo financiero.</p>
              <p className="text-[10px] text-text-secondary/60">Se usará el modelo local para máxima privacidad.</p>
            </div>
            <button 
              onClick={performAudit}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
              {loading ? 'Analizando...' : 'Iniciar Auditoría'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm leading-relaxed text-indigo-100 italic">
              "{audit}"
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={performAudit}
                disabled={loading}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} size={14} />
                Recalcular Auditoría
              </button>
              <button 
                onClick={onOpenChat}
                className="flex-1 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare size={14} />
                Chat con Nexus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Play = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
