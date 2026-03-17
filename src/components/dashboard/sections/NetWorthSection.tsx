import React, { useMemo } from 'react';
import { Landmark, Euro, DollarSign } from 'lucide-react';
import { formatMoney, formatShort } from '../../../utils/finance';
import { ExchangeRates } from '../../../types';

interface NetWorthSectionProps {
  netWorthUSD: number;
  invTotalUSD: number;
  goalsUSD: number;
  exchangeRates: ExchangeRates;
}

export const NetWorthSection: React.FC<NetWorthSectionProps> = ({
  netWorthUSD,
  invTotalUSD,
  goalsUSD,
  exchangeRates,
}) => {
  const rateCripto = exchangeRates?.usdToCripto || 1290;
  const rateEur = exchangeRates?.eurToUsd || 1.08;

  const netWorthARS = useMemo(() => netWorthUSD * rateCripto, [netWorthUSD, rateCripto]);
  const netWorthEUR = useMemo(() => netWorthUSD / rateEur, [netWorthUSD, rateEur]);

  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
        Valor Total de Cartera
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* USD — principal */}
        <div className="relative bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(99,102,241,0.15)] overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10 text-indigo-300"><DollarSign size={60} /></div>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <DollarSign size={12} /> USD · tipo cripto
          </p>
          <h2 className="text-4xl font-black text-white">{formatShort(netWorthUSD)}</h2>
          <p className="text-sm text-indigo-300 mt-1 font-mono">{formatMoney(netWorthUSD, 'USD')}</p>
          <div className="mt-3 pt-3 border-t border-indigo-500/20 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-indigo-400/70">Inversiones</div>
              <div className="font-bold text-white">{formatMoney(invTotalUSD, 'USD')}</div>
            </div>
            <div>
              <div className="text-indigo-400/70">Ahorros (metas)</div>
              <div className="font-bold text-white">{formatMoney(goalsUSD, 'USD')}</div>
            </div>
          </div>
        </div>

        {/* ARS */}
        <div className="relative bg-bg-card border border-white/10 rounded-2xl p-5 overflow-hidden">
          <div className="absolute top-3 right-3 opacity-5 text-white"><Landmark size={60} /></div>
          <p className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">ARS · equivalente cripto</p>
          <h2 className="text-3xl font-black text-text-primary">{formatShort(netWorthARS)}</h2>
          <p className="text-sm text-text-secondary mt-1 font-mono">{formatMoney(netWorthARS, 'ARS')}</p>
          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-text-secondary">
            @${rateCripto.toLocaleString('es-AR')} ARS/USD
          </div>
        </div>

        {/* EUR */}
        <div className="relative bg-bg-card border border-white/10 rounded-2xl p-5 overflow-hidden">
          <div className="absolute top-3 right-3 opacity-5 text-white"><Euro size={60} /></div>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">EUR · equivalente</p>
          <h2 className="text-3xl font-black text-text-primary">{formatShort(netWorthEUR)}</h2>
          <p className="text-sm text-text-secondary mt-1 font-mono">{formatMoney(netWorthEUR, 'EUR')}</p>
          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-text-secondary">
            @{rateEur.toFixed(4)} USD/EUR
          </div>
        </div>
      </div>
    </div>
  );
};
