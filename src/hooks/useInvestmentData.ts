import { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { toUSD, formatMoney } from '../utils/finance';
import { calculateAssetTWRR } from '../utils/metrics';

export type KPIIconType = 'wallet' | 'dollar' | 'trending' | 'brain' | 'strategies';

export const useInvestmentData = (searchTerm: string) => {
  const { investments, exchangeRates, investmentWidgets } = useFinanceStore();

  // ── Totales y Cálculos Core ─────────────────────────────────────
  const totals = useMemo(() => {
    const invUSD = investments.filter(i => i.currency === 'USD').reduce((a, i) => a + i.current, 0);
    const invARS = investments.filter(i => i.currency === 'ARS').reduce((a, i) => a + i.current, 0);
    const invEUR = investments.filter(i => i.currency === 'EUR').reduce((a, i) => a + i.current, 0);

    const totalCurrent = invUSD + toUSD(invARS, 'ARS', exchangeRates) + toUSD(invEUR, 'EUR', exchangeRates);
    const totalInvested = investments.reduce((a, i) => a + toUSD(i.invested, i.currency, exchangeRates), 0);
    const totalGain = totalCurrent - totalInvested;
    const totalPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return { totalCurrent, totalInvested, totalGain, totalPct };
  }, [investments, exchangeRates]);

  // ── Filtrado y búsqueda ────────────────────────────────────────
  const filteredInvestments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return investments.filter(inv => 
      inv.name.toLowerCase().includes(term) || 
      inv.category.toLowerCase().includes(term) ||
      inv.strategy.toLowerCase().includes(term) ||
      (inv.cryptoSymbol && inv.cryptoSymbol.toLowerCase().includes(term))
    );
  }, [investments, searchTerm]);

  // ── Datos para Gráficos y Composición ──────────────────────────
  const sortedByCurrent = useMemo(() => {
    return investments
      .map(inv => ({ ...inv, currentUSD: toUSD(inv.current, inv.currency, exchangeRates) }))
      .sort((a, b) => b.currentUSD - a.currentUSD);
  }, [investments, exchangeRates]);

  // ── Rendimiento Avanzado (TWRR) ───────────────────────────────
  const portfolioTWRR = useMemo(() => {
    let weightedAnnualTwrr = 0;
    let totalWeightUSD = 0;
    let hasValidData = false;

    investments.forEach(inv => {
      const { annualTwrr } = calculateAssetTWRR(inv.history);
      if (annualTwrr !== null) {
        const invUSD = toUSD(inv.current, inv.currency, exchangeRates);
        weightedAnnualTwrr += annualTwrr * invUSD;
        totalWeightUSD += invUSD;
        hasValidData = true;
      }
    });

    return hasValidData && totalWeightUSD > 0 ? weightedAnnualTwrr / totalWeightUSD : null;
  }, [investments, exchangeRates]);

  // ── Configuración de KPIs para la UI (No JSX here) ─────────────────
  const kpis = useMemo(() => [
    { 
      label: 'Patrimonio Total', 
      value: formatMoney(totals.totalCurrent, 'USD'), 
      sub: 'Valor de Mercado', 
      iconId: 'wallet' as KPIIconType, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10' 
    },
    { 
      label: 'Rendimiento Real', 
      value: portfolioTWRR !== null ? `${portfolioTWRR >= 0 ? '+' : ''}${(portfolioTWRR * 100).toFixed(2)}%` : '-- %',
      sub: portfolioTWRR !== null ? 'Ponderado TWRR Anual' : 'Sin datos (+30d)',
      iconId: 'brain' as KPIIconType, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10' 
    },
    { 
      label: 'Rendimiento Total', 
      value: formatMoney(totals.totalGain, 'USD'), 
      sub: `${totals.totalPct >= 0 ? '+' : ''}${totals.totalPct.toFixed(2)}% de retorno`, 
      iconId: 'trending' as KPIIconType, 
      color: totals.totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400', 
      bg: totals.totalGain >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' 
    },
    { 
      label: 'Capital Invertido', 
      value: formatMoney(totals.totalInvested, 'USD'), 
      sub: 'Costo de Adquisición', 
      iconId: 'dollar' as KPIIconType, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10' 
    }
  ], [totals, investments, portfolioTWRR]);

  return {
    investments,
    filteredInvestments,
    sortedByCurrent,
    totals,
    kpis,
    portfolioTWRR,
    exchangeRates,
    investmentWidgets
  };
};
