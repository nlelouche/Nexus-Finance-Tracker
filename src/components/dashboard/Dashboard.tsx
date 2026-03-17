import React from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { ExchangeRateWidget } from '../ui/ExchangeRateWidget';
import { ShoppingCart, Zap, Briefcase, Receipt, CreditCard, Settings2, Check } from 'lucide-react';
import { WidgetShell } from '../ui/WidgetShell';
import { toUSD } from '../../utils/finance';
import { NetWorthSection } from './sections/NetWorthSection';
import { IntelligenceSection } from './sections/IntelligenceSection';
import { RecentActivityList, MainGoals } from './sections/RecentActivity';
import { NexusAdvisor } from './sections/NexusAdvisor';
import { NexusChat } from '../ai/NexusChat';
import { Responsive } from 'react-grid-layout/legacy';
import useMeasure from 'react-use-measure';
import { 
  KpiIncomeWidget, 
  KpiExpenseWidget, 
  KpiSavingsWidget, 
  KpiTopExpenseWidget, 
  KpiInvestmentsWidget, 
  ExpenseDistChartWidget,
  IntelligenceBriefingWidget
} from './GranularWidgets';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

 

export const Dashboard = () => {
  const { 
    transactions, investments, goals, exchangeRates,
    dashboardWidgets, updateWidgetLayout, toggleWidgetVisibility 
  } = useFinanceStore();
  
  const [ref, bounds] = useMeasure();
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);

  // ── Net Worth ───────────────────────────────────────────────
  const invUSD  = investments.filter((i: any) => i.currency === 'USD').reduce((a: number, i: any) => a + i.current, 0);
  const invARS  = investments.filter((i: any) => i.currency === 'ARS').reduce((a: number, i: any) => a + i.current, 0);
  const invEUR  = investments.filter((i: any) => i.currency === 'EUR').reduce((a: number, i: any) => a + i.current, 0);
  const invTotalUSD = invUSD + toUSD(invARS, 'ARS', exchangeRates) + toUSD(invEUR, 'EUR', exchangeRates);
  const goalsUSD = goals.reduce((a: number, g: any) => a + toUSD(g.currentAmount, g.currency, exchangeRates), 0);
  const netWorthUSD = invTotalUSD;

  // ── Mes actual ──────────────────────────────────────────────
  const nowY = new Date().getFullYear();
  const nowM = new Date().getMonth();
  const thisMthTx = transactions.filter((t: any) => {
    const d = new Date(t.date);
    return d.getFullYear() === nowY && d.getMonth() === nowM;
  });
  const incomeUSD = thisMthTx.filter((t: any) => t.type === 'income').reduce((a: number, t: any) => a + toUSD(t.amount, t.currency, exchangeRates), 0);
  const expenseUSD = thisMthTx.filter((t: any) => t.type === 'expense').reduce((a: number, t: any) => a + toUSD(t.amount, t.currency, exchangeRates), 0);
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

  const expenseByCategory = React.useMemo(() => {
    const categories: Record<string, number> = {};
    thisMthTx.filter((t: any) => t.type === 'expense').forEach((tx: any) => {
      const amountUSD = toUSD(tx.amount, tx.currency, exchangeRates);
      categories[tx.category] = (categories[tx.category] || 0) + amountUSD;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [thisMthTx, exchangeRates]);

  const topCategory = expenseByCategory[0] || { name: 'N/A', value: 0 };

  const handleLayoutChange = (current: any) => {
    if (editMode) {
      const updated = dashboardWidgets.map((w: any) => {
        const match = (current as any[]).find((c: any) => c.i === w.id);
        return match ? { ...w, x: match.x, y: match.y, w: match.w, h: match.h } : w;
      });
      updateWidgetLayout(updated);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <ExchangeRateWidget />
      
      <div className="p-6 md:p-10 max-w-[1400px] mx-auto flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-text-secondary font-medium opacity-60">
                Tu centro de comando financiero.
              </p>
              {editMode && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20 animate-pulse">
                  Modo Edición
                </span>
              )}
            </div>
          </div>

          <button 
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0 ${editMode ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-white/5 text-text-primary hover:bg-white/10 border border-white/5'}`}
          >
            {editMode ? <Check size={18} /> : <Settings2 size={18} />}
            {editMode ? 'Guardar Cambios' : 'Personalizar Dashboard'}
          </button>
        </header>

        <div ref={ref} className={`relative min-h-[800px] transition-all duration-500 ${editMode ? 'dashboard-edit-grid p-8 rounded-[40px] bg-white/[0.01] ring-1 ring-white/5' : ''}`}>
          {bounds.width > 0 && (
            <Responsive
              className="layout"
              layouts={{ 
                lg: dashboardWidgets.map((w: any) => ({ ...w, i: w.id })),
                md: dashboardWidgets.map((w: any) => ({ ...w, i: w.id })),
                sm: dashboardWidgets.map((w: any) => ({ ...w, i: w.id })),
                xs: dashboardWidgets.map((w: any) => ({ ...w, i: w.id })),
                xxs: dashboardWidgets.map((w: any) => ({ ...w, i: w.id }))
              }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={120}
              width={bounds.width - (editMode ? 64 : 0)}
              margin={[16, 16]}
              containerPadding={[16, 16]}
              isDraggable={editMode}
              isResizable={editMode}
              draggableHandle=".drag-handle"
              onLayoutChange={handleLayoutChange}
            >
              {dashboardWidgets.filter((w: any) => w.visible || editMode).map((w: any) => (
                <div key={w.id}>
                  <WidgetShell 
                    id={w.id} 
                    editMode={editMode} 
                    visible={w.visible}
                    onToggle={() => toggleWidgetVisibility(w.id)}
                  >
                    {w.id === 'net-worth' && (
                      <NetWorthSection 
                        netWorthUSD={netWorthUSD}
                        invTotalUSD={invTotalUSD}
                        goalsUSD={goalsUSD}
                        exchangeRates={exchangeRates}
                      />
                    )}
                    {w.id === 'kpi-income' && <KpiIncomeWidget amount={incomeUSD} />}
                    {w.id === 'kpi-expense' && <KpiExpenseWidget amount={expenseUSD} />}
                    {w.id === 'kpi-savings' && <KpiSavingsWidget rate={savingsRate} />}
                    {w.id === 'kpi-top-expense' && <KpiTopExpenseWidget name={topCategory.name} value={topCategory.value} />}
                    {w.id === 'kpi-investments' && <KpiInvestmentsWidget total={invTotalUSD} count={investments.length} />}
                    
                    {w.id === 'chart-expenses' && <ExpenseDistChartWidget data={expenseByCategory} />}
                    
                    {w.id === 'nexus-audit' && (
                      <NexusAdvisor onOpenChat={() => setIsChatOpen(true)} />
                    )}
                    {w.id === 'intel-briefing' && (
                      <IntelligenceBriefingWidget>
                        <IntelligenceSection 
                          transactions={transactions}
                          netWorthUSD={netWorthUSD}
                          exchangeRates={exchangeRates}
                        />
                      </IntelligenceBriefingWidget>
                    )}
                    {w.id === 'list-activity' && (
                      <RecentActivityList 
                        transactions={transactions}
                        exchangeRates={exchangeRates}
                        txIcons={txIcons}
                        goals={goals}
                      />
                    )}
                    {w.id === 'list-goals' && (
                      <MainGoals 
                        transactions={transactions}
                        exchangeRates={exchangeRates}
                        txIcons={txIcons}
                        goals={goals}
                      />
                    )}
                  </WidgetShell>
                </div>
              ))}
            </Responsive>
          )}
        </div>
      </div>

      <NexusChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  );
};
