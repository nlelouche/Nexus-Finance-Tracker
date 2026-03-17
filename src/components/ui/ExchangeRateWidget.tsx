import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { RefreshCw, Edit3, Check, X, Wifi, WifiOff } from 'lucide-react';

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
    <div className="bg-bg-card border border-white/10 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-text-primary text-sm">Cotizaciones USD/ARS</h3>
          {lastUpdated ? (
            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
              <Wifi size={10} className="text-emerald-400" /> Actualizado: {lastUpdated}
            </p>
          ) : (
            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
              <WifiOff size={10} className="text-amber-400" /> Sin actualizar — valores iniciales
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <>
              <button
                onClick={() => { setDraft(safeRates); setEditMode(true); }}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-text-secondary"
                title="Editar manualmente"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={handleFetch}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-60"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(false)} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-text-secondary"><X size={14} /></button>
              <button onClick={handleSaveDraft} className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"><Check size={14} /></button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-400 mb-3 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">⚠️ {error}</p>
      )}

      {/* Rates grid */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {Object.entries(RATE_LABELS).map(([key, meta]) => {
          const value = safeRates[key as keyof typeof safeRates] as number;
          const draftValue = draft[key as keyof typeof draft] as number;
          const isCripto = key === 'usdToCripto';
          return (
            <div
              key={key}
              className={`rounded-xl p-2.5 text-center border transition-all ${isCripto ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/3 border-white/8'}`}
            >
              <div className={`text-xs font-bold mb-1 ${meta.color}`}>{meta.label}</div>
              {editMode ? (
                <input
                  type="number"
                  className="w-full text-center bg-white/10 border border-white/20 rounded-lg text-xs font-mono font-bold text-text-primary p-1"
                  value={draftValue}
                  onChange={e => setDraft(d => ({ ...d, [key]: Number(e.target.value) }))}
                />
              ) : (
                <div className={`text-sm font-black ${isCripto ? 'text-purple-300' : 'text-text-primary'}`}>
                  ${value.toLocaleString('es-AR')}
                </div>
              )}
              {isCripto && <div className="text-xs text-purple-500 mt-0.5">⭐ principal</div>}
            </div>
          );
        })}
      </div>

      {/* EUR/USD */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/3 rounded-lg border border-white/8 text-xs">
        <span className="text-text-secondary">EUR → USD</span>
        {editMode ? (
          <input
            type="number"
            step="0.001"
            className="w-20 text-right bg-white/10 border border-white/20 rounded px-2 py-1 font-mono text-text-primary"
            value={draft.eurToUsd}
            onChange={e => setDraft(d => ({ ...d, eurToUsd: Number(e.target.value) }))}
          />
        ) : (
          <span className="font-mono font-bold text-text-primary">1 EUR = {safeRates.eurToUsd.toFixed(4)} USD</span>
        )}
      </div>
    </div>
  );
};
