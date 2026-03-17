import React, { useState } from 'react';
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

      {/* Manual Input Modal (Minimal) */}
      {editMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-white/20 p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black mb-6">Ajustar Cotizaciones</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(RATE_LABELS).map(([key, meta]) => (
                <div key={key}>
                  <label className={`text-[10px] font-bold uppercase mb-1 block ${meta.color}`}>{meta.label}</label>
                  <input
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    value={draft[key as keyof typeof draft] as number}
                    onChange={e => setDraft(d => ({ ...d, [key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setEditMode(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveDraft}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
