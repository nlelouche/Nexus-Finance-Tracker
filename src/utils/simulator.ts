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
  baseline: number;
  simulated: number;
  delta: number;
}

export interface SimulationOptions {
  months: number;
  annualReturn: number;
  monthlySavings: number;
  currentNetWorth: number;
  exchangeRates: ExchangeRates;
}

/**
 * Projects net worth over a period of time, comparing a baseline vs a scenario with events.
 */
export const runSimulation = (
  options: SimulationOptions,
  events: SimulationEvent[]
): SimulationDataPoint[] => {
  const { months, annualReturn, monthlySavings, currentNetWorth } = options;
  const monthlyReturn = Math.pow(1 + annualReturn, 1/12) - 1;
  
  const data: SimulationDataPoint[] = [];
  let baselineBalance = currentNetWorth;
  let simulatedBalance = currentNetWorth;
  let activeAnnualReturn = annualReturn;

  for (let m = 0; m <= months; m++) {
    // 1. Apply Events to simulated balance
    const activeEvents = events.filter(e => e.enabled);
    
    activeEvents.forEach(event => {
      // One-time cashflows
      if (event.type === 'one-time-cashflow' && event.monthOffset === m) {
        simulatedBalance += event.amount;
      }
      
      // Recurring cashflows
      if (event.type === 'recurring-cashflow') {
        const start = event.monthOffset;
        const end = event.durationMonths ? start + event.durationMonths : Infinity;
        if (m >= start && m <= end) {
          simulatedBalance += event.amount;
        }
      }
      
      // Market shocks (Asset value change)
      if (event.type === 'market-shock' && event.monthOffset === m) {
        simulatedBalance *= (1 + event.amount);
      }

      // Yield changes (Permanent change in annual return from this point)
      if (event.type === 'yield-change' && event.monthOffset === m) {
        activeAnnualReturn += event.amount;
      }
    });

    const currentMonthlyReturn = Math.pow(1 + activeAnnualReturn, 1/12) - 1;

    // 2. Logic for this month point
    if (m % 3 === 0 || m === months) { // Sample every quarter for performance
      data.push({
        month: m,
        year: (m / 12).toFixed(1),
        baseline: Math.round(baselineBalance),
        simulated: Math.round(simulatedBalance),
        delta: Math.round(simulatedBalance - baselineBalance)
      });
    }

    // 3. Advance to next month
    baselineBalance = (baselineBalance + monthlySavings) * (1 + monthlyReturn);
    simulatedBalance = (simulatedBalance + monthlySavings) * (1 + currentMonthlyReturn);
  }

  return data;
};
