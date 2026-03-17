import React, { useMemo } from 'react';
import { Card } from '../../ui';
import { Zap, ShieldCheck, TrendingDown, Target, Clock } from 'lucide-react';
import { calculateBurnRate, calculateRunway, formatMoney, SAFE_WITHDRAWAL_RATE, fromUSD } from '../../../utils/finance';
import { Transaction, ExchangeRates } from '../../../types';

interface IntelligenceSectionProps {
  transactions: Transaction[];
  netWorthUSD: number;
  exchangeRates: ExchangeRates;
}

export const IntelligenceSection: React.FC<IntelligenceSectionProps> = ({
  transactions,
  netWorthUSD,
  exchangeRates,
}) => {
  const burnRateUSD = useMemo(() => 
    calculateBurnRate(transactions, exchangeRates), 
    [transactions, exchangeRates]
  );

  const runwayMonths = useMemo(() => 
    calculateRunway(netWorthUSD, burnRateUSD),
    [netWorthUSD, burnRateUSD]
  );

  const fireNumberUSD = useMemo(() => 
    (burnRateUSD * 12) / SAFE_WITHDRAWAL_RATE,
    [burnRateUSD]
  );

  const fireProgress = useMemo(() => 
    Math.min(100, (netWorthUSD / fireNumberUSD) * 100),
    [netWorthUSD, fireNumberUSD]
  );

  const runwayYears = Math.floor(runwayMonths / 12);
  const remainingMonths = Math.round(runwayMonths % 12);

  return (
    <section className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Zap size={18} className="text-indigo-400" />
        </div>
        <h2 className="text-2xl font-black text-text-primary tracking-tight">Cerebro Financiero</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Runway Card */}
        <Card className="relative overflow-hidden group border-indigo-500/30 bg-indigo-500/5">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Supervivencia (Runway)</p>
            <h3 className="text-4xl font-black text-text-primary mb-2">
              {runwayMonths === Infinity ? '∞' : (
                <>
                  {runwayYears} <span className="text-lg font-normal text-text-secondary">años</span>
                  {remainingMonths > 0 && (
                    <span className="ml-2">
                      {remainingMonths} <span className="text-lg font-normal text-text-secondary">meses</span>
                    </span>
                  )}
                </>
              )}
            </h3>
            <p className="text-sm text-text-secondary leading-tight">
              Tiempo que podés vivir hoy sin generar un solo peso extra.
            </p>
          </div>
        </Card>

        {/* Burn Rate Card */}
        <Card className="border-rose-500/30 bg-rose-500/5">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Costo de Vida Real (USD)</p>
          <div className="flex items-end gap-2 mb-2">
            <h3 className="text-3xl font-black text-text-primary">
              {formatMoney(burnRateUSD, 'USD')}
            </h3>
            <span className="text-rose-400 text-xs font-bold pb-1 flex items-center gap-1">
              <TrendingDown size={14} /> mensual
            </span>
          </div>
          <p className="text-sm text-text-secondary leading-tight">
            Promedio de gastos de los últimos 3 meses. Tu "burn rate".
            <span className="block mt-1 font-mono text-[10px] opacity-60">
              ≈ {formatMoney(fromUSD(burnRateUSD, 'ARS', exchangeRates), 'ARS')}
            </span>
          </p>
        </Card>

        {/* FIRE Progress Card */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Independencia Financiera</p>
              <h3 className="text-3xl font-black text-text-primary">{fireProgress.toFixed(1)}%</h3>
            </div>
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
          </div>
          
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-emerald-400 transition-all duration-1000 ease-out"
              style={{ width: `${fireProgress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-secondary">Meta FIRE:</span>
            <span className="font-bold text-text-primary">{formatMoney(fireNumberUSD, 'USD')}</span>
          </div>
        </Card>
      </div>

      {/* Insight Footer */}
      <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
        <Target size={18} className="text-amber-400" />
        <p className="text-xs text-text-secondary italic">
          Tip: La regla del 4% asume que retirás el {SAFE_WITHDRAWAL_RATE * 100}% anual de tu cartera ajustado por inflación. 
          {fireProgress < 100 ? " Seguí laburando, todavía falta un trecho." : " ¡Felicitaciones! Sos técnicamente libre."}
        </p>
      </div>
    </section>
  );
};
