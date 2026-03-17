import React from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { ExchangeRateWidget } from '../ui/ExchangeRateWidget';
import { ShoppingCart, Zap, Briefcase, Receipt, CreditCard } from 'lucide-react';
import { toUSD } from '../../utils/finance';
import { NetWorthSection } from './sections/NetWorthSection';
import { KpiGrid } from './sections/KpiGrid';
import { ExpenseAnalysisSection } from './sections/ExpenseAnalysisSection';
import { IntelligenceSection } from './sections/IntelligenceSection';
import { RecentActivityList, MainGoals } from './sections/RecentActivity';
import { NexusAdvisor } from './sections/NexusAdvisor';
import { NexusChat } from '../ai/NexusChat';

export const Dashboard = () => {
  const { transactions, investments, goals, exchangeRates, updateTransaction } = useFinanceStore();
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  // ── Net Worth ───────────────────────────────────────────────
  // Inversiones (valor actual de mercado)
  const invUSD  = investments.filter(i => i.currency === 'USD').reduce((a, i) => a + i.current, 0);
  const invARS  = investments.filter(i => i.currency === 'ARS').reduce((a, i) => a + i.current, 0);
  const invEUR  = investments.filter(i => i.currency === 'EUR').reduce((a, i) => a + i.current, 0);
  const invTotalUSD = invUSD + toUSD(invARS, 'ARS', exchangeRates) + toUSD(invEUR, 'EUR', exchangeRates);

  // Ahorros en objetivos (currentAmount = cash apartado para metas)
  const goalsUSD = goals.reduce((a, g) => a + toUSD(g.currentAmount, g.currency, exchangeRates), 0);

  const netWorthUSD = invTotalUSD;

  // ── Mes actual ──────────────────────────────────────────────
  const nowY = new Date().getFullYear();
  const nowM = new Date().getMonth();
  const thisMthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === nowY && d.getMonth() === nowM;
  });
  const incomeUSD = thisMthTx.filter(t => t.type === 'income').reduce((a, t) => a + toUSD(t.amount, t.currency, exchangeRates), 0);
  const expenseUSD = thisMthTx.filter(t => t.type === 'expense').reduce((a, t) => a + toUSD(t.amount, t.currency, exchangeRates), 0);
  const savingsRate = incomeUSD > 0 ? Math.round(((incomeUSD - expenseUSD) / incomeUSD) * 100) : 0;

  const txIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
    'Comida':   { icon: <ShoppingCart size={20} />, bg: 'bg-bg-surface' },
    'Freelance':{ icon: <Briefcase size={20} className="text-accent-green" />, bg: 'bg-accent-green-bg' },
    'Trabajo 1':{ icon: <Briefcase size={20} className="text-accent-green" />, bg: 'bg-accent-green-bg' },
    'Servicios':{ icon: <Zap size={20} />, bg: 'bg-bg-surface' },
    'Impuestos':{ icon: <Receipt size={20} className="text-amber-400" />, bg: 'bg-amber-400/10' },
    'Tarjetas de Credito': { icon: <CreditCard size={20} className="text-rose-400" />, bg: 'bg-rose-400/10' },
    'default':  { icon: <ShoppingCart size={20} />, bg: 'bg-bg-surface' },
  };

  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // ── Análisis de Egresos por Categoría (MES ACTUAL) ──────────
  const expenseByCategory = React.useMemo(() => {
    const categories: Record<string, number> = {};
    thisMthTx.filter(t => t.type === 'expense').forEach(tx => {
      const amountUSD = toUSD(tx.amount, tx.currency, exchangeRates);
      categories[tx.category] = (categories[tx.category] || 0) + amountUSD;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [thisMthTx, exchangeRates]);

  const topCategory = expenseByCategory[0] || { name: 'N/A', value: 0 };

  return (
    <div className="animate-in fade-in duration-500">
      <ExchangeRateWidget />
      
      <div className="p-6 md:p-10 max-w-[1400px] mx-auto flex flex-col gap-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
            Dashboard
          </h1>
          <p className="text-text-secondary font-medium opacity-60">
            Tu centro de comando financiero.
          </p>
        </header>

        <NetWorthSection 
          netWorthUSD={netWorthUSD}
          invTotalUSD={invTotalUSD}
          goalsUSD={goalsUSD}
          exchangeRates={exchangeRates}
        />

        <KpiGrid 
          incomeUSD={incomeUSD}
          expenseUSD={expenseUSD}
          savingsRate={savingsRate}
          topCategoryName={topCategory.name}
          topCategoryValue={topCategory.value}
          invTotalUSD={invTotalUSD}
          investmentsCount={investments.length}
        />

        <NexusAdvisor onOpenChat={() => setIsChatOpen(true)} />

        <IntelligenceSection 
          transactions={transactions}
          netWorthUSD={netWorthUSD}
          exchangeRates={exchangeRates}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 mt-12">
          <div className="lg:col-span-12">
            <ExpenseAnalysisSection 
              expenseByCategory={expenseByCategory}
              expenseUSD={expenseUSD}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              thisMthTx={thisMthTx}
              exchangeRates={exchangeRates}
              updateTransaction={updateTransaction}
              txIcons={txIcons}
            />
          </div>
          <div className="lg:col-span-8">
            <RecentActivityList 
              transactions={transactions}
              exchangeRates={exchangeRates}
              txIcons={txIcons}
              goals={goals}
            />
          </div>
          <div className="lg:col-span-4">
            <MainGoals 
              transactions={transactions}
              exchangeRates={exchangeRates}
              txIcons={txIcons}
              goals={goals}
            />
          </div>
        </div>
      </div>

      <NexusChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  );
};
