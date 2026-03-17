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
    const startValue = sorted[i - 1].valueAfter;
    const event = sorted[i];

    const cashFlow = event.type === 'injection' ? event.amount : (event.type === 'withdrawal' ? -event.amount : 0);
    const endValueBeforeFlow = event.valueAfter - cashFlow;

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
