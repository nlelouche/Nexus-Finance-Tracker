import { Currency, ExchangeRates } from '../types';

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
