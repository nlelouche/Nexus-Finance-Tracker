import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { RefreshCw, Edit3, Wifi } from 'lucide-react';

const RATE_LABELS: Record<string, { label: string; color: string }> = {
  usdToCripto: { label: 'Cripto', color: 'text-purple-400' },
  usdToBlue:   { label: 'Blue',   color: 'text-blue-400' },
  usdToOficial:{ label: 'Oficial',color: 'text-emerald-400' },
  usdToMep:    { label: 'MEP',    color: 'text-amber-400' },
  usdToCcl:    { label: 'CCL',    color: 'text-orange-400' },
};

export const ExchangeRateWidget = () => {
  const { exchangeRates, updateExchangeRates } = useFinanceStore();
  
  const safeRates = {
    usdToCripto: exchangeRates?.usdToCripto || 1290,
    usdToBlue: exchangeRates?.usdToBlue || 1280,
    usdToOficial: exchangeRates?.usdToOficial || 940,
    usdToMep: exchangeRates?.usdToMep || 1285,
    usdToCcl: exchangeRates?.usdToCcl || 1295,
    eurToUsd: exchangeRates?.eurToUsd || 1.08,
    lastUpdated: exchangeRates?.lastUpdated || null,
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(safeRates);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      // ARS dollar types (dolarapi.com — free, no auth)
      const [dolarRes, eurRes] = await Promise.all([
        fetch('https://dolarapi.com/v1/dolares'),
        fetch('https://api.frankfurter.app/latest?from=USD&to=EUR'),
      ]);

      if (!dolarRes.ok) throw new Error('dolarapi.com no respondió');
      if (!eurRes.ok) throw new Error('frankfurter.app no respondió');

      const dolares: { casa: string; compra: number; venta: number }[] = await dolarRes.json();
      const eurData: { rates: { EUR: number } } = await eurRes.json();

      const find = (casa: string) => dolares.find(d => d.casa === casa)?.venta ?? 0;

      updateExchangeRates({
        usdToCripto: find('cripto'),
        usdToBlue:   find('blue'),
        usdToOficial:find('oficial'),
        usdToMep:    find('bolsa'),
        usdToCcl:    find('contadoconliqui'),
        eurToUsd:    1 / eurData.rates.EUR, // EUR→USD
      });
    } catch (e: any) {
      setError(e.message ?? 'Error al obtener cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    updateExchangeRates(draft);
    setEditMode(false);
  };

  const lastUpdated = safeRates.lastUpdated
    ? new Date(safeRates.lastUpdated).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="w-full bg-white/5 backdrop-blur-md border-y border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top duration-700">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-tighter text-text-secondary opacity-50">Mercado USD</span>
          <div className="flex items-center gap-1">
            <Wifi size={10} className={safeRates.lastUpdated ? "text-emerald-400" : "text-amber-400"} />
            <span className="text-[10px] font-bold text-text-secondary">{lastUpdated || 'Sin conexión'}</span>
          </div>
        </div>

        {Object.entries(RATE_LABELS).map(([key, meta]) => {
          const value = safeRates[key as keyof typeof safeRates] as number;
          const isCripto = key === 'usdToCripto';
          return (
            <div key={key} className="flex flex-col border-l border-white/10 pl-4 min-w-[80px]">
              <span className={`text-[10px] font-black uppercase tracking-tight ${meta.color}`}>{meta.label}</span>
              <span className={`text-sm font-black tracking-tighter ${isCripto ? 'text-text-primary' : 'text-text-primary/80'}`}>
                ${value.toLocaleString('es-AR')}
              </span>
            </div>
          );
        })}

        <div className="flex flex-col border-l border-white/10 pl-4 pr-4">
          <span className="text-[10px] font-black uppercase tracking-tight text-text-secondary">EUR/USD</span>
          <span className="text-sm font-black tracking-tighter text-text-primary/80">
            {safeRates.eurToUsd.toFixed(3)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {error && <span className="text-[10px] text-rose-400 animate-pulse">⚠️ Error</span>}
        <button
          onClick={handleFetch}
          disabled={loading}
          className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-400' : ''} />
        </button>
        <button
          onClick={() => { setDraft(safeRates); setEditMode(true); }}
          className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-all"
        >
          <Edit3 size={14} />
        </button>
      </div>

      {/* Manual Input Modal (Minimal) - Portaled to avoid clipping by parent transitions */}
      {editMode && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0b] border border-white/10 p-6 md:p-10 rounded-[40px] w-full max-w-lg shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tighter text-text-primary">Ajustar Cotizaciones</h3>
              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-black text-text-secondary uppercase tracking-widest">Manual Override</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(RATE_LABELS).map(([key, meta]) => (
                <div key={key} className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${meta.color}`}>{meta.label}</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary font-black text-xs opacity-40 group-focus-within:opacity-100 transition-opacity">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-10 pr-6 text-base font-black text-text-primary focus:bg-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      value={draft[key as keyof typeof draft] as number}
                      onChange={e => setDraft(d => ({ ...d, [key]: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-indigo-400">EUR / USD</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary font-black text-xs opacity-40 group-focus-within:opacity-100 transition-opacity">€</span>
                  <input
                    type="number"
                    step="0.001"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-10 pr-6 text-base font-black text-text-primary focus:bg-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    value={draft.eurToUsd}
                    onChange={e => setDraft(d => ({ ...d, eurToUsd: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setEditMode(false)}
                className="flex-1 px-8 py-5 rounded-2xl bg-white/5 hover:bg-white/10 font-black text-sm transition-all border border-white/5 text-text-primary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveDraft}
                className="flex-1 px-8 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-sm transition-all shadow-2xl shadow-indigo-600/40 text-white"
              >
                Confirmar Cambios
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
