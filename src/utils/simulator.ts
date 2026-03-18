import { ExchangeRates } from '../types';

export type EventType = 'one-time-cashflow' | 'recurring-cashflow' | 'market-shock' | 'rate-change' | 'yield-change';

export interface SimulationEvent {
  id: string;
  name: string;
  type: EventType;
  amount: number; // For cashflows (USD) or percentage (0.1 = +10%)
  monthOffset: number; // When does the event happen
  durationMonths?: number; // For recurring events
  enabled: boolean;
}

export interface SimulationDataPoint {
  month: number;
  year: string;
  totalPrincipal: number;
  nominalValue: number;
  realValue: number;
  optimistic: number;
  pessimistic: number;
  totalInterest: number;
}

export interface SimulationOptions {
  months: number;
  expectedReturn: number;
  monthlySavings: number;
  currentNetWorth: number;
  inflationRate: number;
  exchangeRates: ExchangeRates;
}

/**
 * Projects net worth over a period of time, comparing a baseline vs a scenario with events.
 */
export const runSimulation = (
  options: SimulationOptions,
  events: SimulationEvent[]
): SimulationDataPoint[] => {
  const { months, expectedReturn, monthlySavings, currentNetWorth, inflationRate } = options;
  const monthlyInflation = Math.pow(1 + inflationRate, 1/12) - 1;
  
  const data: SimulationDataPoint[] = [];
  let totalPrincipal = currentNetWorth;
  
  let simulatedBase = currentNetWorth;
  let simulatedOpt = currentNetWorth;
  let simulatedPess = currentNetWorth;
  
  let currentInflationMult = 1;

  let activeBaseReturn = expectedReturn;
  let activeOptReturn = expectedReturn + 0.04;
  let activePessReturn = Math.max(0, expectedReturn - 0.04);

  for (let m = 0; m <= months; m++) {
    // 1. Apply Events to simulated balance
    const activeEvents = events.filter(e => e.enabled);
    
    activeEvents.forEach(event => {
      // One-time cashflows
      if (event.type === 'one-time-cashflow' && event.monthOffset === m) {
        simulatedBase += event.amount;
        simulatedOpt += event.amount;
        simulatedPess += event.amount;
        if (event.amount > 0) totalPrincipal += event.amount;
      }
      
      // Recurring cashflows
      if (event.type === 'recurring-cashflow') {
        const start = event.monthOffset;
        const end = event.durationMonths ? start + event.durationMonths : Infinity;
        if (m >= start && m <= end) {
          simulatedBase += event.amount;
          simulatedOpt += event.amount;
          simulatedPess += event.amount;
          if (event.amount > 0) totalPrincipal += event.amount;
        }
      }
      
      // Market shocks (Asset value change)
      if (event.type === 'market-shock' && event.monthOffset === m) {
        simulatedBase *= (1 + event.amount);
        simulatedOpt *= (1 + event.amount);
        simulatedPess *= (1 + event.amount);
      }

      // Yield changes (Permanent change in annual return from this point)
      if (event.type === 'yield-change' && event.monthOffset === m) {
        activeBaseReturn += event.amount;
        activeOptReturn += event.amount;
        activePessReturn = Math.max(0, activePessReturn + event.amount);
      }
    });

    const currentBaseMonthlyReturn = Math.pow(1 + activeBaseReturn, 1/12) - 1;
    const currentOptMonthlyReturn = Math.pow(1 + activeOptReturn, 1/12) - 1;
    const currentPessMonthlyReturn = Math.pow(1 + activePessReturn, 1/12) - 1;

    // 2. Logic for this month point
    if (m % 3 === 0 || m === months) { // Sample every quarter for performance
      data.push({
        month: m,
        year: (m / 12).toFixed(1),
        totalPrincipal: Math.round(totalPrincipal),
        nominalValue: Math.round(simulatedBase),
        optimistic: Math.round(simulatedOpt),
        pessimistic: Math.round(simulatedPess),
        realValue: Math.round(simulatedBase / currentInflationMult),
        totalInterest: Math.round(simulatedBase - totalPrincipal)
      });
    }

    // 3. Advance to next month
    totalPrincipal += monthlySavings;
    simulatedBase = (simulatedBase + monthlySavings) * (1 + currentBaseMonthlyReturn);
    simulatedOpt = (simulatedOpt + monthlySavings) * (1 + currentOptMonthlyReturn);
    simulatedPess = (simulatedPess + monthlySavings) * (1 + currentPessMonthlyReturn);
    
    currentInflationMult *= (1 + monthlyInflation);
  }

  return data;
};
