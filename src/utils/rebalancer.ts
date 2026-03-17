import { Investment, ExchangeRates } from '../types';
import { toUSD } from './finance';

export interface RebalanceResult {
  category: string;
  currentUSD: number;
  currentPercentage: number;
  targetPercentage: number;
  diffUSD: number;
  action: 'buy' | 'sell' | 'hold';
}

/**
 * Calcula el desvío del portafolio y sugiere acciones para rebalancear.
 */
export const calculateRebalance = (
  investments: Investment[],
  targets: Record<string, number>,
  rates: ExchangeRates
): RebalanceResult[] => {
  // 1. Total USD de la cartera
  const totalUSD = investments.reduce((sum, inv) => 
    sum + toUSD(inv.current, inv.currency, rates), 0
  );

  // 2. Agrupar por categoría
  const byCategoryUSD: Record<string, number> = {};
  investments.forEach(inv => {
    const amountUSD = toUSD(inv.current, inv.currency, rates);
    byCategoryUSD[inv.category] = (byCategoryUSD[inv.category] || 0) + amountUSD;
  });

  // 3. Evaluar cada categoría definida en los targets
  return Object.entries(targets).map(([category, targetPct]) => {
    const currentUSD = byCategoryUSD[category] || 0;
    const currentPercentage = totalUSD > 0 ? (currentUSD / totalUSD) * 100 : 0;
    
    // Cuánto debería tener según el target
    const targetUSD = (totalUSD * targetPct) / 100;
    const diffUSD = targetUSD - currentUSD;

    // Umbral del 1% para 'hold'
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    if (diffUSD > (totalUSD * 0.01)) action = 'buy';
    else if (diffUSD < -(totalUSD * 0.01)) action = 'sell';

    return {
      category,
      currentUSD,
      currentPercentage,
      targetPercentage: targetPct,
      diffUSD,
      action
    };
  });
};
