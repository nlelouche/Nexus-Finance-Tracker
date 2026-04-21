import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinanceStore } from '../store/useFinanceStore';
import { toUSD, formatMoney } from '../utils/finance';
import { calculateAssetTWRR, calculateLastUpdateDelta } from '../utils/metrics';

export type KPIIconType = 'wallet' | 'dollar' | 'trending' | 'brain' | 'strategies' | 'clock' | 'chart';

export const useInvestmentData = (searchTerm: string) => {
  const { t } = useTranslation();
  const { investments, exchangeRates, investmentWidgets } = useFinanceStore();

  // ── Totales y Cálculos Core ─────────────────────────────────────
  const totals = useMemo(() => {
    const invUSD = investments.filter(i => i.currency === 'USD').reduce((a, i) => a + (Number(i.current) || 0), 0);
    const invARS = investments.filter(i => i.currency === 'ARS').reduce((a, i) => a + (Number(i.current) || 0), 0);
    const invEUR = investments.filter(i => i.currency === 'EUR').reduce((a, i) => a + (Number(i.current) || 0), 0);

    const totalCurrent = (invUSD || 0) + toUSD(invARS || 0, 'ARS', exchangeRates) + toUSD(invEUR || 0, 'EUR', exchangeRates);
    
    // Calcular capital invertido histórico (Base de Costo USD)
    const totalInvested = investments.reduce((sum, inv) => {
      // Intentamos reconstruir el costo en USD desde la historia
      if (inv.history && inv.history.length > 0) {
        const historicalCostUSD = inv.history.reduce((hSum, entry) => {
          if (entry.type === 'creation' || entry.type === 'injection') {
            const rate = entry.exchangeRate || (inv.currency === 'ARS' ? exchangeRates.usdToCripto : 1);
            return hSum + (entry.amount / rate);
          }
          if (entry.type === 'withdrawal') {
            const rate = entry.exchangeRate || (inv.currency === 'ARS' ? exchangeRates.usdToCripto : 1);
            return hSum - (entry.amount / rate);
          }
          return hSum;
        }, 0);
        return sum + historicalCostUSD;
      }
      // Fallback si no hay historia (usar tasa actual)
      return sum + toUSD(Number(inv.invested) || 0, inv.currency, exchangeRates);
    }, 0);

    const totalGain = totalCurrent - totalInvested;
    const totalPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    // Calcular días totales desde la primera inversión
    let earliestDate = new Date();
    let hasDate = false;
    investments.forEach(inv => {
      inv.history?.forEach(h => {
        const d = new Date(h.date);
        if (d < earliestDate) {
          earliestDate = d;
          hasDate = true;
        }
      });
    });
    const totalDaysInvesting = hasDate 
      ? Math.max(0, Math.round((new Date().getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return { totalCurrent, totalInvested, totalGain, totalPct, totalDaysInvesting };
  }, [investments, exchangeRates]);

  // ── Deltas de Última Actualización ──────────────────────────────
  const updateMetrics = useMemo(() => {
    let totalDeltaUSD = 0;
    let maxDays = 0;
    let count = 0;

    investments.forEach(inv => {
      const { deltaAmount, daysDiff, hasCheckpoints } = calculateLastUpdateDelta(inv.history);
      if (hasCheckpoints) {
        totalDeltaUSD += toUSD(deltaAmount || 0, inv.currency, exchangeRates);
        maxDays = Math.max(maxDays, daysDiff || 0);
        count++;
      }
    });

    return { totalDeltaUSD, maxDays, hasData: count > 0 };
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
  const portfolioMetrics = useMemo(() => {
    let weightedAnnualTwrr = 0;
    let weightedAbsoluteTwrr = 0;
    let totalWeightUSD = 0;
    let hasValidData = false;

    investments.forEach(inv => {
      const { annualTwrr, twrr } = calculateAssetTWRR(inv.history);
      const invUSD = toUSD(inv.current, inv.currency, exchangeRates);
      
      if (invUSD > 0) {
        if (annualTwrr !== null) weightedAnnualTwrr += annualTwrr * invUSD;
        weightedAbsoluteTwrr += twrr * invUSD;
        totalWeightUSD += invUSD;
        hasValidData = true;
      }
    });

    const annual = totalWeightUSD > 0 ? weightedAnnualTwrr / totalWeightUSD : null;
    const absolute = totalWeightUSD > 0 ? weightedAbsoluteTwrr / totalWeightUSD : 0;

    return { 
      annual, 
      absolute, 
      hasValidData,
      benchmarks: {
        spy: 0.102, // 10.2% S&P 500
        btc: 0.45   // 45% BTC
      }
    };
  }, [investments, exchangeRates]);

  // ── Configuración de KPIs para la UI (No JSX here) ─────────────────
  const kpis = useMemo(() => [
    { 
      label: t('investments.kpis.portfolioValue'), 
      value: formatMoney(totals.totalCurrent, 'USD'), 
      sub: 'Valor de Mercado', 
      iconId: 'wallet' as KPIIconType, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10' 
    },
    { 
      label: t('investments.kpis.realPerformance'), 
      value: portfolioMetrics.annual !== null 
        ? `${portfolioMetrics.annual >= 0 ? '+' : ''}${(portfolioMetrics.annual * 100).toFixed(2)}%` 
        : `${portfolioMetrics.absolute >= 0 ? '+' : ''}${(portfolioMetrics.absolute * 100).toFixed(2)}%`,
      sub: portfolioMetrics.annual !== null 
        ? `${t('investments.kpis.annualized')} (USD)` 
        : `${t('investments.kpis.absolute')} (USD)`,
      iconId: 'brain' as KPIIconType, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10',
      extra: portfolioMetrics.annual !== null ? {
        label: 'vs S&P 500 (10.2%)',
        status: portfolioMetrics.annual > 0.102 ? 'better' : 'worse'
      } : undefined
    },
    { 
      label: t('investments.kpis.totalGain'), 
      value: formatMoney(totals.totalGain, 'USD'), 
      sub: `${totals.totalPct >= 0 ? '+' : ''}${totals.totalPct.toFixed(2)}% de retorno · ${totals.totalDaysInvesting} ${t('investments.kpis.days')}`, 
      iconId: 'trending' as KPIIconType, 
      color: totals.totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400', 
      bg: totals.totalGain >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' 
    },
    { 
      label: t('investments.kpis.lastDelta'), 
      value: updateMetrics.hasData 
        ? `${updateMetrics.totalDeltaUSD >= 0 ? '+' : ''}${formatMoney(updateMetrics.totalDeltaUSD, 'USD')}`
        : t('investments.kpis.noData'), 
      sub: updateMetrics.hasData 
        ? `En ${updateMetrics.maxDays} ${t('investments.kpis.days')} desde el update` 
        : 'Esperando segundo checkpoint', 
      iconId: 'chart' as KPIIconType, 
      color: updateMetrics.totalDeltaUSD >= 0 ? 'text-emerald-400' : 'text-rose-400', 
      bg: updateMetrics.totalDeltaUSD >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' 
    }
  ], [totals, investments, portfolioMetrics, updateMetrics, t]);

  return {
    investments,
    filteredInvestments,
    sortedByCurrent,
    totals,
    kpis,
    portfolioTWRR: portfolioMetrics.annual,
    exchangeRates,
    investmentWidgets
  };
};
