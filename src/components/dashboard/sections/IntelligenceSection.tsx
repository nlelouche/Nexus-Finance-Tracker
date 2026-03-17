import React, { useMemo } from 'react';
import { Card, TooltipUI as Tooltip } from '../../ui';
import { Zap, ShieldCheck, TrendingDown, Target, Clock, Info } from 'lucide-react';
import { calculateBurnRate, calculateRunway, calculateSavingsRate, calculateYearsToFIRE, formatMoney, SAFE_WITHDRAWAL_RATE, fromUSD, toUSD } from '../../../utils/finance';
import { Transaction, ExchangeRates } from '../../../types';
import { WealthForecast } from './WealthForecast';

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

  const savingsRate = useMemo(() => 
    calculateSavingsRate(transactions, exchangeRates),
    [transactions, exchangeRates]
  );

  const yearsToFire = useMemo(() => {
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1))
      .reduce((sum, t) => sum + fromUSD(toUSD(t.amount, t.currency, exchangeRates), 'USD', exchangeRates), 0) / 3;
    
    const monthlySavings = monthlyIncome * savingsRate;
    return calculateYearsToFIRE(netWorthUSD, monthlySavings, burnRateUSD * 12);
  }, [netWorthUSD, burnRateUSD, savingsRate, transactions, exchangeRates]);

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
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Supervivencia (Runway)</p>
              <Tooltip content="Indica cuántos meses podés mantener tu nivel de vida actual usando solo tus ahorros e inversiones, sin ingresos nuevos.">
                <Info size={16} className="text-indigo-400/80 cursor-help" />
              </Tooltip>
            </div>
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
          <div className="flex items-center gap-1 mb-1">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Costo de Vida (Burn Rate)</p>
            <Tooltip content="Es el promedio de gastos mensuales de los últimos 3 meses convertido a USD. Te dice cuánto 'quemás' por mes para vivir.">
              <Info size={16} className="text-rose-400/80 cursor-help" />
            </Tooltip>
          </div>
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
        <Card className="border-emerald-500/30 bg-emerald-500/5 col-span-1 md:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Independencia Financiera</p>
                <Tooltip content="Tu progreso hacia el 'FIRE Number'. Cuando llegues al 100%, tus inversiones podrían cubrir tus gastos para siempre (regla del 4%).">
                  <Info size={16} className="text-emerald-400/80 cursor-help" />
                </Tooltip>
              </div>
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
            <span className="text-text-secondary">Libertad en:</span>
            <span className="font-bold text-emerald-400">
              {yearsToFire === 0 ? '¡YA!' : yearsToFire === Infinity ? 'Nunca (ahorro ≤ 0)' : `${yearsToFire.toFixed(1)} años`}
            </span>
          </div>
        </Card>
      </div>

      <WealthForecast 
        currentNetWorth={netWorthUSD}
        monthlySavings={((transactions
          .filter(t => t.type === 'income' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1))
          .reduce((sum, t) => sum + fromUSD(toUSD(t.amount, t.currency, exchangeRates), 'USD', exchangeRates), 0) / 3) * savingsRate)}
        fireTarget={fireNumberUSD}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Savings Rate Card */}
        <Card className="border-indigo-500/30 bg-indigo-500/5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Target size={20} className="text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Tasa de Ahorro Mensual</p>
                  <Tooltip content="El % de tus ingresos que no gastás. Cuanto más alto sea, más rápido vas a llegar a tu libertad financiera.">
                    <Info size={14} className="text-text-secondary/80 cursor-help" />
                  </Tooltip>
                </div>
                <h4 className="text-2xl font-black text-text-primary">{(savingsRate * 100).toFixed(1)}%</h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text-secondary uppercase mb-1">Status</p>
              <span className={`text-xs font-bold px-2 py-1 rounded ${savingsRate > 0.3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {savingsRate > 0.5 ? 'Elite' : savingsRate > 0.3 ? 'Saludable' : 'Peligro'}
              </span>
            </div>
          </div>
        </Card>

        {/* Wealth Multiplier / Efficiency (Future place for more metrics) */}
        <Card className="border-white/10 bg-white/5 py-4">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Zap size={20} className="text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Eficiencia Patrimonial</p>
                  <Tooltip content="Muestra cuántos años de vida tenés cubiertos en tu 'cajón' de inversiones. Es tu NW dividido tu gasto anual.">
                    <Info size={14} className="text-text-secondary/80 cursor-help" />
                  </Tooltip>
                </div>
                <h4 className="text-2xl font-black text-text-primary">
                  {((netWorthUSD / (burnRateUSD * 12)) || 0).toFixed(1)}x <span className="text-xs font-normal text-text-secondary">gastos anuales</span>
                </h4>
              </div>
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
