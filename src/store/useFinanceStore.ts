import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FinanceState, Transaction } from '../types';

// Mock data inicial basada en el mockup.html
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Supermercado Coto', amount: 65000, currency: 'ARS', date: '2026-10-15', type: 'expense', category: 'Comida' },
  { id: '2', description: 'Freelance USD', amount: 1200, currency: 'USD', date: '2026-10-14', type: 'income', category: 'Freelance', source: 'Freelance USD' },
  { id: '3', description: 'Edesur', amount: 12400, currency: 'ARS', date: '2026-10-12', type: 'expense', category: 'Servicios' },
  { id: '4', description: 'EuroTech', amount: 2500, currency: 'EUR', date: '2026-10-05', type: 'income', category: 'Trabajo 1', source: 'EuroTech' },
];

const INITIAL_INVESTMENTS = [
  { id: '1', name: 'SPY (S&P 500)', invested: 1000, current: 1150, currency: 'USD' as const, category: 'CEDEARs' as const, strategy: 'Renta Variable Global' as const },
  { id: '2', name: 'Bitcoin (BTC)', invested: 2000, current: 4500, currency: 'USD' as const, category: 'Cripto' as const, strategy: 'Cripto' as const, cryptoSymbol: 'BTC', cryptoAmount: 0.045 },
  { id: '3', name: 'YPF S.A.', invested: 500000, current: 520000, currency: 'ARS' as const, category: 'Acciones Arg' as const, strategy: 'Renta Variable AR' as const },
  { id: '4', name: 'ON YPF 2026', invested: 1500, current: 1550, currency: 'USD' as const, category: 'ONs Dólar' as const, strategy: 'Renta Fija USD' as const },
];

const INITIAL_GOALS = [
  { id: '1', name: 'Camioneta Toyota Hilux', targetAmount: 25000000, currentAmount: 8500000, currency: 'ARS' as const, startDate: '2025-01', targetDate: '2026-12' },
  { id: '2', name: 'Viaje Europa 2027', targetAmount: 5000, currentAmount: 750, currency: 'USD' as const, startDate: '2026-01', targetDate: '2027-06' },
];

const INITIAL_RECURRING = [
  { id: '1', name: 'Netflix', amount: 6000, currency: 'ARS' as const, category: 'Entretenimiento', dayOfMonth: 5, paidMonths: [] as { month: string; txId: string }[] },
  { id: '2', name: 'Spotify', amount: 3500, currency: 'ARS' as const, category: 'Entretenimiento', dayOfMonth: 12, paidMonths: [] as { month: string; txId: string }[] },
  { id: '3', name: 'Internet Fibertel', amount: 18000, currency: 'ARS' as const, category: 'Servicios', dayOfMonth: 20, paidMonths: [] as { month: string; txId: string }[] },
  { id: '4', name: 'ChatGPT Plus', amount: 20, currency: 'USD' as const, category: 'Suscripciones', dayOfMonth: 1, paidMonths: [] as { month: string; txId: string }[] },
];
const INITIAL_TARGET_ALLOCATIONS = [
  { id: crypto.randomUUID(), name: 'CEDEAR S&P 500', percentage: 35 },
  { id: crypto.randomUUID(), name: 'Renta Fija USD (ONs)', percentage: 25 },
  { id: crypto.randomUUID(), name: 'Cripto (BTC/ETH)', percentage: 15 },
  { id: crypto.randomUUID(), name: 'Acciones Argentinas', percentage: 15 },
  { id: crypto.randomUUID(), name: 'Renta Fija Pesos', percentage: 10 },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      transactions: INITIAL_TRANSACTIONS,
      investments: INITIAL_INVESTMENTS,
      goals: INITIAL_GOALS,
      recurringExpenses: INITIAL_RECURRING,
      targetAllocations: INITIAL_TARGET_ALLOCATIONS,
      baseCurrency: 'USD',
      exchangeRates: {
        usdToCripto: 1290,  // ARS por USD cripto (actualizar con botón)
        usdToBlue: 1280,
        usdToOficial: 940,
        usdToMep: 1285,
        usdToCcl: 1295,
        eurToUsd: 1.08,
        lastUpdated: null,
      },
      
      addTransaction: (tx: Omit<Transaction, 'id'>) => set((state) => ({ 
        transactions: [{ ...tx, id: crypto.randomUUID() }, ...state.transactions] 
      })),

      updateTransaction: (id, data) => set((state) => ({
        transactions: state.transactions.map(t => t.id === id ? { ...t, ...data } : t)
      })),

      deleteTransaction: (id: string) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      })),

      updateExchangeRates: (rates) => set((state) => ({
        exchangeRates: { ...state.exchangeRates, ...rates, lastUpdated: new Date().toISOString() }
      })),
      
      addInvestment: (inv) => set((state) => {
        const id = crypto.randomUUID();
        const initialHistoryEntry = {
          date: new Date().toISOString(),
          type: 'creation' as const,
          amount: inv.invested,
          valueAfter: inv.current
        };
        return {
          investments: [...state.investments, { ...inv, id, history: [initialHistoryEntry] }]
        };
      }),
      
      updateInvestmentCurrent: (id, newCurrent) => set((state) => ({
        investments: state.investments.map(i => {
          if (i.id !== id) return i;
          const entry = { date: new Date().toISOString(), type: 'valuation' as const, amount: 0, valueAfter: newCurrent };
          return { ...i, current: newCurrent, history: [...(i.history || []), entry] };
        })
      })),
      
      injectInvestment: (id, amount, cryptoAmount) => set((state) => ({
        investments: state.investments.map(i => {
          if (i.id !== id) return i;
          const newCurrent = i.current + amount;
          const entry = { date: new Date().toISOString(), type: 'injection' as const, amount, valueAfter: newCurrent };
          return {
            ...i,
            invested: i.invested + amount,
            current: newCurrent,
            cryptoAmount: cryptoAmount && i.cryptoAmount !== undefined ? i.cryptoAmount + cryptoAmount : i.cryptoAmount,
            history: [...(i.history || []), entry]
          };
        })
      })),
      
      withdrawInvestment: (id, amount, cryptoAmount) => set((state) => ({
        investments: state.investments.map(i => {
          if (i.id !== id) return i;
          const newCurrent = Math.max(0, i.current - amount);
          const entry = { date: new Date().toISOString(), type: 'withdrawal' as const, amount, valueAfter: newCurrent };
          return {
            ...i,
            invested: Math.max(0, i.invested - amount),
            current: newCurrent,
            cryptoAmount: cryptoAmount && i.cryptoAmount !== undefined ? Math.max(0, i.cryptoAmount - cryptoAmount) : i.cryptoAmount,
            history: [...(i.history || []), entry]
          };
        })
      })),
      
      fixInvestmentInitial: (id, newInvested) => set((state) => ({
        investments: state.investments.map(i => i.id === id ? { ...i, invested: newInvested } : i)
      })),
      
      deleteInvestment: (id) => set((state) => ({
        investments: state.investments.filter(i => i.id !== id)
      })),
      
      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, { ...goal, id: crypto.randomUUID() }]
      })),

      updateGoal: (id, data) => set((state) => ({
        goals: state.goals.map(g => g.id === id ? { ...g, ...data } : g)
      })),
      
      updateGoalProgress: (id, amount, currency, note) => set((state) => ({
        goals: state.goals.map(g => {
          if (g.id !== id) return g;
          
          const entry: any = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            amount,
            currency,
            note
          };

          // Conversor interno para el store
          const toTarget = (val: number, from: string, to: string): number => {
            if (from === to) return val;
            const rates = state.exchangeRates;
            let usd = val;
            if (from === 'ARS') usd = val / rates.usdToCripto;
            if (from === 'EUR') usd = val * rates.eurToUsd;
            if (to === 'ARS') return usd * rates.usdToCripto;
            if (to === 'EUR') return usd / rates.eurToUsd;
            return usd;
          };

          const convertedAmount = toTarget(amount, currency, g.currency);
          return { 
            ...g, 
            currentAmount: g.currentAmount + convertedAmount,
            history: [...(g.history || []), entry]
          };
        })
      })),

      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter(g => g.id !== id)
      })),
      
      setBaseCurrency: (currency) => set({ baseCurrency: currency }),

      // Costos Fijos
      addRecurringExpense: (exp) => set((state) => ({
        recurringExpenses: [...state.recurringExpenses, { ...exp, id: crypto.randomUUID(), paidMonths: [] }]
      })),

      updateRecurringExpense: (id, data) => set((state) => ({
        recurringExpenses: state.recurringExpenses.map(r => r.id === id ? { ...r, ...data } : r)
      })),

      deleteRecurringExpense: (id) => set((state) => ({
        recurringExpenses: state.recurringExpenses.filter(r => r.id !== id)
      })),

      markRecurringPaid: (id, month) => set((state) => {
        const exp = state.recurringExpenses.find(r => r.id === id);
        if (!exp || exp.paidMonths.some(p => p.month === month)) return state;
        const txId = crypto.randomUUID();
        const newTx: Transaction = {
          id: txId,
          description: `[Fijo] ${exp.name}`,
          amount: exp.amount,
          currency: exp.currency,
          date: `${month}-${String(exp.dayOfMonth).padStart(2, '0')}`,
          type: 'expense',
          category: exp.category,
        };
        return {
          recurringExpenses: state.recurringExpenses.map(r =>
            r.id === id ? { ...r, paidMonths: [...r.paidMonths, { month, txId }] } : r
          ),
          transactions: [newTx, ...state.transactions],
        };
      }),

      unmarkRecurringPaid: (id, month) => set((state) => {
        const exp = state.recurringExpenses.find(r => r.id === id);
        const entry = exp?.paidMonths.find(p => p.month === month);
        return {
          recurringExpenses: state.recurringExpenses.map(r =>
            r.id === id ? { ...r, paidMonths: r.paidMonths.filter(p => p.month !== month) } : r
          ),
          // Borrar la transaccion vinculada por su txId exacto
          transactions: entry
            ? state.transactions.filter(t => t.id !== entry.txId)
            : state.transactions,
        };
      }),
      
      addAllocationEntry: (name, percentage) => set((state) => ({
        targetAllocations: [...state.targetAllocations, { id: crypto.randomUUID(), name, percentage }]
      })),

      updateAllocationEntry: (id, name, percentage) => set((state) => ({
        targetAllocations: state.targetAllocations.map(a => a.id === id ? { ...a, name, percentage } : a)
      })),

      removeAllocationEntry: (id) => set((state) => ({
        targetAllocations: state.targetAllocations.filter(a => a.id !== id)
      })),

      clearDatabase: () => set(() => ({
        transactions: [],
        investments: [],
        goals: [],
        recurringExpenses: [],
        targetAllocations: []
      }))
    }),
    {
      name: 'nexus-finance-storage',
    }
  )
);
