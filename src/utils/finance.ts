import { Currency, ExchangeRates, Transaction } from '../types';

/**
 * Convierte un monto a USD basándose en los tipos de cambio provistos.
 */
export const toUSD = (amount: number, from: Currency, rates: ExchangeRates): number => {
  if (from === 'USD') return amount;
  if (from === 'ARS') return amount / rates.usdToCripto;
  if (from === 'EUR') return amount * rates.eurToUsd;
  return amount;
};

/**
 * Convierte desde USD a una moneda destino.
 */
export const fromUSD = (amountUSD: number, to: Currency, rates: ExchangeRates): number => {
  if (to === 'USD') return amountUSD;
  if (to === 'ARS') return amountUSD * rates.usdToCripto;
  if (to === 'EUR') return amountUSD / rates.eurToUsd;
  return amountUSD;
};

/**
 * Convierte entre dos monedas cualesquiera.
 */
export const convertCurrency = (amount: number, from: Currency, to: Currency, rates: ExchangeRates): number => {
  if (from === to) return amount;
  const usdAmount = toUSD(amount, from, rates);
  return fromUSD(usdAmount, to, rates);
};

/**
 * Formatea un monto según la moneda y el locale es-AR.
 */
export const formatMoney = (amount: number, currency: string, maximumFractionDigits = 0) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(amount);
};

/**
 * Formatea un monto abreviado (K, M).
 */
export const formatShort = (amount: number) => {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
};

/**
 * Calcula el 'Burn Rate' mensual promedio en USD.
 */
export const calculateBurnRate = (transactions: Transaction[], rates: ExchangeRates, months = 3): number => {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
  
  const relevantExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    new Date(t.date) >= cutoff
  );

  const totalUSD = relevantExpenses.reduce((sum, t) => 
    sum + toUSD(t.amount, t.currency, rates), 0
  );

  return months > 0 ? totalUSD / months : 0;
};

/**
 * Calcula la pista de aterrizaje (Runway) en meses.
 */
export const calculateRunway = (netWorthUSD: number, monthlyBurnUSD: number): number => {
  if (monthlyBurnUSD <= 0) return Infinity;
  return netWorthUSD / monthlyBurnUSD;
};

export const SAFE_WITHDRAWAL_RATE = 0.04; // Regla del 4%

/**
 * Calcula la tasa de ahorro (% de ingresos no gastados).
 */
export const calculateSavingsRate = (transactions: Transaction[], rates: ExchangeRates, months = 3): number => {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
  
  const relevant = transactions.filter(t => new Date(t.date) >= cutoff);
  
  const incomeUSD = relevant.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + toUSD(t.amount, t.currency, rates), 0);
  
  const expenseUSD = relevant.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + toUSD(t.amount, t.currency, rates), 0);

  if (incomeUSD <= 0) return 0;
  return Math.max(0, (incomeUSD - expenseUSD) / incomeUSD);
};

/**
 * Calcula cuántos años faltan para alcanzar el FIRE Number basado en el ahorro actual y retorno esperado.
 * n = log((FIRE_Target * r / (S * (1+r)) + 1)) / log(1 + r) -- Simplificado para ahorro constante
 */
export const calculateYearsToFIRE = (
  currentNetWorthUSD: number,
  monthlySavingsUSD: number,
  annualBurnUSD: number,
  annualReturnRate = 0.07 // 7% real return (standard)
): number => {
  const fireTarget = annualBurnUSD / SAFE_WITHDRAWAL_RATE;
  if (currentNetWorthUSD >= fireTarget) return 0;
  if (monthlySavingsUSD <= 0) return Infinity;

  const monthlyReturn = Math.pow(1 + annualReturnRate, 1/12) - 1;
  let months = 0;
  let capital = currentNetWorthUSD;

  // Simulación simple mes a mes para mayor precisión con interés compuesto
  while (capital < fireTarget && months < 1200) { // Cap at 100 years
    capital = (capital + monthlySavingsUSD) * (1 + monthlyReturn);
    months++;
  }

  return months / 12;
};
