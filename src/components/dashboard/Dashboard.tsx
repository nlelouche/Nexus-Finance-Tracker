import React from 'react';
import { Card, ProgressBar } from '../ui';
import { ExchangeRateWidget } from '../ui/ExchangeRateWidget';
import { useFinanceStore } from '../../store/useFinanceStore';
import { TrendingUp, ShoppingCart, Zap, Briefcase, DollarSign, Euro, Landmark, Check, X, Plus, Receipt, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const fmtShort = (amount: number) => {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
};

export const Dashboard = () => {
  const { transactions, investments, goals, exchangeRates, updateTransaction } = useFinanceStore();

  // Para evitar errores si el LocalStorage tiene el formato viejo de exchangeRates
  const rateCripto = exchangeRates?.usdToCripto || 1290;
  const rateEur = exchangeRates?.eurToUsd || 1.08;

  // ── Conversor a USD usando tipo cripto como referencia ──────
  const toUSD = (amount: number, cur: string): number => {
    if (cur === 'USD') return amount;
    if (cur === 'ARS') return amount / rateCripto;
    if (cur === 'EUR') return amount * rateEur;
    return amount;
  };

  // ── Net Worth ───────────────────────────────────────────────
  // Inversiones (valor actual de mercado)
  const invUSD  = investments.filter(i => i.currency === 'USD').reduce((a, i) => a + i.current, 0);
  const invARS  = investments.filter(i => i.currency === 'ARS').reduce((a, i) => a + i.current, 0);
  const invEUR  = investments.filter(i => i.currency === 'EUR').reduce((a, i) => a + i.current, 0);
  const invTotalUSD = invUSD + toUSD(invARS, 'ARS') + toUSD(invEUR, 'EUR');

  // Ahorros en objetivos (currentAmount = cash apartado para metas)
  const goalsUSD = goals.reduce((a, g) => a + toUSD(g.currentAmount, g.currency), 0);

  const netWorthUSD = invTotalUSD;
  const netWorthARS = netWorthUSD * rateCripto;
  const netWorthEUR = netWorthUSD / rateEur;

  // ── Mes actual ──────────────────────────────────────────────
  const nowY = new Date().getFullYear();
  const nowM = new Date().getMonth();
  const thisMthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === nowY && d.getMonth() === nowM;
  });
  const incomeUSD = thisMthTx.filter(t => t.type === 'income').reduce((a, t) => a + toUSD(t.amount, t.currency), 0);
  const expenseUSD = thisMthTx.filter(t => t.type === 'expense').reduce((a, t) => a + toUSD(t.amount, t.currency), 0);
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
  const [editingTxId, setEditingTxId] = React.useState<string | null>(null);
  const [desc, setDesc] = React.useState('');
  const [category, setCategory] = React.useState('');

  // ── Análisis de Egresos por Categoría (MES ACTUAL) ──────────
  const expenseByCategory = React.useMemo(() => {
    const categories: Record<string, number> = {};
    thisMthTx.filter(t => t.type === 'expense').forEach(tx => {
      const amountUSD = toUSD(tx.amount, tx.currency);
      categories[tx.category] = (categories[tx.category] || 0) + amountUSD;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [thisMthTx, toUSD]);

  const topCategory = expenseByCategory[0] || { name: 'N/A', value: 0 };
  const CHART_COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9'];
  const CATEGORIES_LIST = ['Alquiler', 'Comida', 'Servicios', 'Impuestos', 'Tarjetas de Credito', 'Transporte', 'Entretenimiento', 'Suscripciones', 'Salud', 'Otros'];

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Dashboard
          </h1>
          <p className="text-text-secondary mt-1 text-lg">Resumen financiero a hoy.</p>
        </div>
      </header>

      {/* ── Cartera multi-moneda ────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
          Valor Total de Cartera
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* USD — principal */}
          <div className="relative bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(99,102,241,0.15)] overflow-hidden">
            <div className="absolute top-3 right-3 opacity-10 text-indigo-300"><DollarSign size={60} /></div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <DollarSign size={12} /> USD · tipo cripto
            </p>
            <h2 className="text-4xl font-black text-white">{fmtShort(netWorthUSD)}</h2>
            <p className="text-sm text-indigo-300 mt-1 font-mono">{fmt(netWorthUSD, 'USD')}</p>
            <div className="mt-3 pt-3 border-t border-indigo-500/20 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-indigo-400/70">Inversiones</div>
                <div className="font-bold text-white">{fmt(invTotalUSD, 'USD')}</div>
              </div>
              <div>
                <div className="text-indigo-400/70">Ahorros (metas)</div>
                <div className="font-bold text-white">{fmt(goalsUSD, 'USD')}</div>
              </div>
            </div>
          </div>

          {/* ARS */}
          <div className="relative bg-bg-card border border-white/10 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-3 right-3 opacity-5 text-white"><Landmark size={60} /></div>
            <p className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">ARS · equivalente cripto</p>
            <h2 className="text-3xl font-black text-text-primary">{fmtShort(netWorthARS)}</h2>
            <p className="text-sm text-text-secondary mt-1 font-mono">{fmt(netWorthARS, 'ARS')}</p>
            <div className="mt-3 pt-3 border-t border-white/5 text-xs text-text-secondary">
              @${rateCripto.toLocaleString('es-AR')} ARS/USD
            </div>
          </div>

          {/* EUR */}
          <div className="relative bg-bg-card border border-white/10 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-3 right-3 opacity-5 text-white"><Euro size={60} /></div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">EUR · equivalente</p>
            <h2 className="text-3xl font-black text-text-primary">{fmtShort(netWorthEUR)}</h2>
            <p className="text-sm text-text-secondary mt-1 font-mono">{fmt(netWorthEUR, 'EUR')}</p>
            <div className="mt-3 pt-3 border-t border-white/5 text-xs text-text-secondary">
              @{rateEur.toFixed(4)} USD/EUR
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs del mes ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <p className="text-text-secondary text-sm">Ingresos (mes)</p>
          <h2 className="text-xl font-bold my-1">{fmt(incomeUSD, 'USD')}</h2>
          <p className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp size={12} /> en USD equiv.</p>
        </Card>
        <Card>
          <p className="text-text-secondary text-sm">Egresos (mes)</p>
          <h2 className="text-xl font-bold my-1">{fmt(expenseUSD, 'USD')}</h2>
          <p className="text-xs text-text-secondary">en USD equiv.</p>
        </Card>
        <Card>
          <p className="text-text-secondary text-sm">Savings Rate</p>
          <h2 className="text-xl font-bold my-1">{savingsRate}%</h2>
          <div className="mt-1"><ProgressBar progress={savingsRate} status={savingsRate >= 20 ? 'good' : 'neutral'} /></div>
        </Card>
        <Card>
          <p className="text-text-secondary text-sm">Mayor Gasto</p>
          <h2 className="text-xl font-bold my-1 truncate" title={topCategory.name}>{topCategory.name}</h2>
          <p className="text-xs text-rose-400">{fmt(topCategory.value, 'USD')}</p>
        </Card>
        <Card>
          <p className="text-text-secondary text-sm">Inversiones</p>
          <h2 className="text-xl font-bold my-1">{fmt(invTotalUSD, 'USD')}</h2>
          <p className="text-xs text-indigo-400">{investments.length} activos</p>
        </Card>
      </div>

      {/* ── Análisis de Egresos ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        <Card className="lg:col-span-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/3 h-[250px] relative flex flex-col items-center justify-center">
               <h3 className="font-bold text-text-primary mb-2 text-sm absolute top-0 left-0">Distribución de Gastos</h3>
               <div className="w-full h-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {expenseByCategory.map((_entry, index) => (
                          <Cell key={`expense-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => fmt(value, 'USD')}
                        contentStyle={{ backgroundColor: 'rgba(3,3,3,0.8)', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="absolute pointer-events-none flex flex-col items-center justify-center pt-4">
                  <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Total Gastos</span>
                  <span className="text-lg font-bold text-text-primary">{fmt(expenseUSD, 'USD')}</span>
               </div>
            </div>
            
            <div className="w-full md:w-2/3">
              <h3 className="font-bold text-text-primary mb-4 text-sm flex justify-between">
                Detalle por Categoría
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="text-[10px] text-accent-red hover:underline"
                  >
                    Cerrar detalle
                  </button>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {expenseByCategory.map((cat, idx) => {
                  const pct = expenseUSD > 0 ? (cat.value / expenseUSD) * 100 : 0;
                  const isSelected = selectedCategory === cat.name;
                  const profile = txIcons[cat.name] || txIcons['default'];
                  return (
                    <button 
                      key={cat.name} 
                      onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                      className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all text-left ${
                        isSelected 
                          ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]' 
                          : 'bg-white/3 border-white/5 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${profile.bg} flex items-center justify-center text-text-primary`}>
                            {profile.icon}
                          </div>
                          <div>
                            <span className="font-medium text-text-primary block leading-none">{cat.name}</span>
                            <span className="text-[10px] text-text-secondary">{pct.toFixed(0)}% del total</span>
                          </div>
                        </div>
                        <span className="font-mono text-text-secondary">{fmt(cat.value, 'USD')}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000" 
                            style={{ 
                              width: `${pct}%`, 
                              backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                              boxShadow: `0 0 10px ${CHART_COLORS[idx % CHART_COLORS.length]}44`
                            }} 
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
                {expenseByCategory.length === 0 && (
                  <div className="col-span-2 py-8 text-center text-text-secondary italic text-sm">
                    No hay egresos registrados este mes.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drill-down de Transacciones */}
          {selectedCategory && (
            <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  Movimientos de {selectedCategory} (Mes actual)
                </h4>
                <div className="text-xs text-text-secondary">
                  Total: <span className="text-text-primary font-bold">{fmt(expenseByCategory.find(c => c.name === selectedCategory)?.value || 0, 'USD')}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {thisMthTx
                  .filter(t => t.type === 'expense' && t.category === selectedCategory)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(tx => {
                    const isInlineEditing = editingTxId === tx.id;
                    return (
                      <div key={tx.id} className={`p-3 border rounded-xl transition-all ${isInlineEditing ? 'bg-amber-500/10 border-amber-500/40' : 'bg-white/3 border-white/5 hover:border-white/10 dark:hover:bg-white/5'}`}>
                        {isInlineEditing ? (
                          <div className="space-y-3">
                            <input 
                              type="text" 
                              value={desc} 
                              onChange={e => setDesc(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm focus:border-amber-500/50 outline-none"
                              placeholder="Descripción..."
                            />
                            <div className="flex gap-2">
                              <select 
                                value={category} 
                                onChange={e => setCategory(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none"
                              >
                                {CATEGORIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <button 
                                onClick={() => {
                                  updateTransaction(tx.id, { description: desc, category });
                                  setEditingTxId(null);
                                }}
                                className="p-1.5 bg-amber-500 rounded-lg text-black hover:bg-amber-400 transition-colors"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => setEditingTxId(null)}
                                className="p-1.5 bg-white/10 rounded-lg text-text-secondary hover:bg-white/20 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center text-sm group/tx">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-text-primary truncate max-w-[120px]" title={tx.description}>{tx.description}</p>
                                <button 
                                  onClick={() => {
                                    setEditingTxId(tx.id);
                                    setDesc(tx.description);
                                    setCategory(tx.category);
                                  }}
                                  className="opacity-0 group-hover/tx:opacity-100 p-1 hover:bg-white/10 rounded text-text-secondary transition-all"
                                >
                                  <Plus size={12} className="rotate-45" />
                                </button>
                              </div>
                              <p className="text-[10px] text-text-secondary">{new Date(tx.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-bold text-rose-400">-{fmt(tx.amount, tx.currency)}</p>
                              <p className="text-[10px] text-text-secondary/60">≈ {fmt(toUSD(tx.amount, tx.currency), 'USD')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Cotizaciones + Movimientos + Objetivos ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Últimos Movimientos */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Últimos Movimientos</h3>
            </div>
            <div className="flex flex-col gap-3">
              {transactions.slice(0, 6).map(tx => {
                const profile = txIcons[tx.category] || txIcons['default'];
                const isIncome = tx.type === 'income';
                return (
                  <div key={tx.id} className="transaction-item group">
                    <div className="flex items-center gap-4">
                      <div className={`tx-icon ${profile.bg} group-hover:scale-110 transition-transform duration-300`}>
                        {profile.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-text-secondary">{tx.category} · {new Date(tx.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${isIncome ? 'text-accent-green' : 'text-accent-red'}`}>
                        {isIncome ? '+' : '-'}{fmt(tx.amount, tx.currency)}
                      </div>
                      <div className="text-xs text-text-secondary/60">
                        ≈ {fmt(toUSD(tx.amount, tx.currency), 'USD')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Objetivos */}
          <Card>
            <h3 className="text-lg font-bold mb-4">Objetivos Principales</h3>
            <div className="flex flex-col gap-5">
              {goals.slice(0, 3).map(goal => {
                const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{goal.name}</span>
                      <span className="text-sm text-text-secondary">{progress.toFixed(0)}%</span>
                    </div>
                    <ProgressBar progress={progress} status={progress >= 30 ? 'good' : 'neutral'} />
                    <div className="flex justify-between text-xs text-text-secondary mt-1.5">
                      <span>{fmt(goal.currentAmount, goal.currency)}</span>
                      <span>Meta: {fmt(goal.targetAmount, goal.currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Widget cotizaciones */}
        <div>
          <ExchangeRateWidget />
        </div>
      </div>
    </div>
  );
};
