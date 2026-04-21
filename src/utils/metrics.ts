import { InvestmentHistoryEntry } from '../types';

export function calculateAssetTWRR(history?: InvestmentHistoryEntry[]) {
  if (!history || history.length < 2) return { twrr: 0, annualTwrr: null, isShortPeriod: false };

  // 1. Sort history by date ASC
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulativeReturn = 1;
  const firstDate = new Date(sorted[0].date).getTime();
  const lastDate = new Date(sorted[sorted.length - 1].date).getTime();
  
  const totalDays = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Dolarizar si tenemos el rate, sino usar nominal (retrocompatibilidad)
    const ratePrev = prev.exchangeRate || 1;
    const rateCurr = curr.exchangeRate || 1;

    const startValue = prev.valueAfter / ratePrev;
    const cashFlow = (curr.type === 'injection' ? curr.amount : (curr.type === 'withdrawal' ? -curr.amount : 0)) / rateCurr;
    const endValueBeforeFlow = (curr.valueAfter / rateCurr) - cashFlow;

    if (startValue > 0) {
      const periodReturn = (endValueBeforeFlow - startValue) / startValue;
      cumulativeReturn *= (1 + periodReturn);
    }
  }

  const twrr = cumulativeReturn - 1;
  const isShortPeriod = totalDays < 30;
  
  let annualTwrr = null;
  if (!isShortPeriod) {
    // Rendimiento anualizado = (1 + twrr)^(365.25 / totalDays) - 1
    annualTwrr = Math.pow(1 + twrr, 365.25 / totalDays) - 1;
  }

  // Si anualizamos y da números estratosféricos (como Infinity), cortamos a null o límites seguros.
  if (annualTwrr && !isFinite(annualTwrr)) {
    annualTwrr = null;
  }

  return { twrr, annualTwrr, isShortPeriod };
}

/**
 * Calcula la diferencia de valor y días entre las últimas dos actualizaciones de precio (valuation/creation).
 */
export function calculateLastUpdateDelta(history?: InvestmentHistoryEntry[]) {
  if (!history || history.length < 2) return { deltaAmount: 0, daysDiff: 0, hasCheckpoints: false };

  // Ordenar por fecha ASC
  const sorted = [...history]
    .filter(h => h.type === 'valuation' || h.type === 'creation' || h.type === 'injection' || h.type === 'withdrawal')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length < 2) return { deltaAmount: 0, daysDiff: 0, hasCheckpoints: false };

  const last = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  // El delta de monto es simplemente la diferencia de valor final, 
  // PERO restando cualquier inyección/retiro que haya ocurrido en el último evento 
  // para obtener solo la ganancia por mercado.
  const cashFlow = last.type === 'injection' ? last.amount : (last.type === 'withdrawal' ? -last.amount : 0);
  const deltaAmount = last.valueAfter - (previous.valueAfter + cashFlow);
  
  const daysDiff = Math.round((new Date(last.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24));

  return { deltaAmount, daysDiff, hasCheckpoints: true };
}

// Proyecciones
export function projectFuture(currentValue: number, monthlyContribution: number, annualRatePct: number, months: number): number {
  if (months <= 0) return currentValue;
  const r = annualRatePct / 100 / 12;
  let v = currentValue;
  for (let i = 0; i < months; i++) {
    v = v * (1 + r) + monthlyContribution;
  }
  return v;
}
