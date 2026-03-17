export type Currency = 'ARS' | 'USD' | 'EUR';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  type: 'income' | 'expense';
  category: string;
  source?: string;
  isRecurring?: boolean;
}

export type InvestmentCategory = 'CEDEARs' | 'FCI' | 'Acciones Arg' | 'ONs Dólar' | 'Cripto' | 'Otro';
export type InvestmentStrategy = 'Renta Variable Global' | 'Renta Variable AR' | 'Renta Fija USD' | 'Renta Fija Pesos' | 'Renta Mixta' | 'Cripto' | 'Otro / No Asignada';

export interface InvestmentHistoryEntry {
  date: string; // ISO string
  type: 'creation' | 'valuation' | 'injection' | 'withdrawal';
  amount: number;      // El monto del flujo de capital (no el cambio de valoración)
  valueAfter: number;  // Valor total del asset luego de este evento
}

export interface Investment {
  id: string;
  name: string;
  invested: number;
  current: number;
  currency: Currency;
  category: InvestmentCategory;
  strategy: InvestmentStrategy;
  cryptoSymbol?: string;
  cryptoAmount?: number;
  history?: InvestmentHistoryEntry[]; // Historial para el TWRR
}

export interface GoalProgressEntry {
  id: string;
  date: string; // ISO string
  amount: number;      // Amount in the original currency of the contribution
  currency: Currency;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  targetDate: string; // YYYY-MM
  startDate: string;  // YYYY-MM
  history?: GoalProgressEntry[];
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  category: string;
  dayOfMonth: number;
  paidMonths: { month: string; txId: string }[];
}

export interface AllocationEntry {
  id: string;
  name: string;
  percentage: number;
}

export interface ExchangeRates {
  usdToCripto: number;   // ARS por 1 USD tipo cripto — referencia principal
  usdToBlue: number;
  usdToOficial: number;
  usdToMep: number;
  usdToCcl: number;
  eurToUsd: number;      // cuántos USD vale 1 EUR
  lastUpdated: string | null;
}

export interface FinanceState {
  transactions: Transaction[];
  investments: Investment[];
  goals: Goal[];
  recurringExpenses: RecurringExpense[];
  targetAllocations: AllocationEntry[];
  baseCurrency: Currency;
  exchangeRates: ExchangeRates;

  // Acciones Transacciones
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  updateExchangeRates: (rates: Partial<ExchangeRates>) => void;

  // Acciones Inversiones
  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  updateInvestmentCurrent: (id: string, newCurrent: number) => void;
  injectInvestment: (id: string, amount: number, cryptoAmount?: number) => void;
  withdrawInvestment: (id: string, amount: number, cryptoAmount?: number) => void;
  fixInvestmentInitial: (id: string, newInvested: number) => void;
  deleteInvestment: (id: string) => void;

  // Acciones Goals
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, data: Partial<Omit<Goal, 'id'>>) => void;
  updateGoalProgress: (id: string, amount: number, currency: Currency, note?: string) => void;
  deleteGoal: (id: string) => void;
  setBaseCurrency: (currency: Currency) => void;

  // Acciones Costos Fijos
  addRecurringExpense: (exp: Omit<RecurringExpense, 'id' | 'paidMonths'>) => void;
  updateRecurringExpense: (id: string, data: Partial<Omit<RecurringExpense, 'id' | 'paidMonths'>>) => void;
  deleteRecurringExpense: (id: string) => void;
  markRecurringPaid: (id: string, month: string) => void;
  unmarkRecurringPaid: (id: string, month: string) => void;

  // Acciones Allocation
  addAllocationEntry: (name: string, percentage: number) => void;
  updateAllocationEntry: (id: string, name: string, percentage: number) => void;
  removeAllocationEntry: (id: string) => void;
  
  clearDatabase: () => void;
}
