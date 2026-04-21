import React from 'react';
import { Card } from '../ui';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Zap, Receipt, CreditCard, Utensils, Car, Film, Heart, Repeat, Gift } from 'lucide-react';
import { formatMoney, convertCurrency } from '../../utils/finance';
import { Transaction, ExchangeRates, Currency } from '../../types';

interface ExpenseStatsProps {
  transactions: Transaction[];
  exchangeRates: ExchangeRates;
  baseCurrency: Currency;
  viewMonth: string;
}

const CHART_COLORS = [
  '#f43f5e', // Rose 500
  '#fb7185', // Rose 400
  '#e11d48', // Rose 600
  '#fda4af', // Rose 300
  '#a855f7', // Purple 500
  '#c084fc', // Purple 400
  '#8b5cf6', // Violet 500
  '#6366f1', // Indigo 500
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Comida': <Utensils size={14} />,
  'Alquiler': <Zap size={14} />,
  'Servicios': <Zap size={14} />,
  'Impuestos': <Receipt size={14} />,
  'Tarjetas de Credito': <CreditCard size={14} />,
  'Transporte': <Car size={14} />,
  'Entretenimiento': <Film size={14} />,
  'Suscripciones': <Repeat size={14} />,
  'Salud': <Heart size={14} />,
  'Otros': <Gift size={14} />,
  'default': <ShoppingCart size={14} />
};

export const ExpenseStats = ({ transactions, exchangeRates, baseCurrency, viewMonth }: ExpenseStatsProps) => {
  const { t } = useTranslation();
  const [expandedVendor, setExpandedVendor] = React.useState<string | null>(null);

  // Filtrar movimientos por mes y tipo expense
  const monthTx = React.useMemo(() => 
    transactions.filter(t => t.type === 'expense' && t.date.startsWith(viewMonth)),
    [transactions, viewMonth]
  );
  
  // Totales
  const totalBase = React.useMemo(() => 
    monthTx.reduce((acc, t) => acc + convertCurrency(t.amount, t.currency, baseCurrency, exchangeRates), 0),
    [monthTx, baseCurrency, exchangeRates]
  );
  
  // Desglose por Categoría
  const categoryData = React.useMemo(() => {
    const dict: Record<string, number> = {};
    monthTx.forEach(tx => {
      const amountBase = convertCurrency(tx.amount, tx.currency, baseCurrency, exchangeRates);
      dict[tx.category] = (dict[tx.category] || 0) + amountBase;
    });

    return Object.entries(dict)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx, baseCurrency, exchangeRates]);

  // Ranking por Proveedor / Comercio
  const vendorData = React.useMemo(() => {
    const dict: Record<string, { total: number; count: number; items: Transaction[] }> = {};
    monthTx.forEach(tx => {
      const amountBase = convertCurrency(tx.amount, tx.currency, baseCurrency, exchangeRates);
      const desc = tx.description.trim();
      if (!dict[desc]) {
        dict[desc] = { total: 0, count: 0, items: [] };
      }
      dict[desc].total += amountBase;
      dict[desc].count += 1;
      dict[desc].items.push(tx);
    });

    return Object.entries(dict)
      .map(([name, data]) => ({ 
        name, 
        value: data.total, 
        count: data.count,
        avg: data.total / data.count,
        items: data.items.sort((a, b) => b.date.localeCompare(a.date))
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx, baseCurrency, exchangeRates]);

  if (monthTx.length === 0) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center text-center bg-white/[0.02] border-dashed border-white/10">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Receipt className="text-text-secondary opacity-20" size={32} />
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-1">{t('expenses.stats.noData')}</h3>
        <p className="text-sm text-text-secondary max-w-xs">{t('expenses.stats.noDataSub')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Gasto Total */}
        <div className="relative p-5 rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
          <div className="relative z-10">
            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-[0.2em] mb-2">{t('expenses.stats.totalExpense')} ({baseCurrency})</p>
            <p className="text-3xl font-black text-white tracking-tighter">{formatMoney(totalBase, baseCurrency)}</p>
            <div className="mt-3 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
               <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest opacity-60">{t('expenses.stats.activeMonitoring')}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Promedio */}
        <div className="relative p-5 rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
          <div className="relative z-10">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-2">{t('expenses.stats.average')}</p>
            <p className="text-3xl font-black text-white tracking-tighter">{formatMoney(totalBase / monthTx.length, baseCurrency)}</p>
            <p className="text-[10px] text-text-secondary mt-3 font-medium opacity-60 flex items-center gap-2">
               <Zap size={10} className="text-indigo-400" />
               {monthTx.length} {t('expenses.stats.processed')}
            </p>
          </div>
        </div>

        {/* KPI 3: Concentración */}
        <div className="relative p-5 rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
          <div className="relative z-10">
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mb-2">{t('expenses.stats.maxConcentration')}</p>
            <p className="text-3xl font-black text-white tracking-tighter truncate">{t(`nav.categories.${categoryData[0]?.name}`, { defaultValue: categoryData[0]?.name })}</p>
            <p className="text-[10px] text-text-secondary mt-3 font-medium opacity-60">
              Representa el <span className="text-emerald-400 font-bold">{totalBase > 0 ? ((categoryData[0]?.value / totalBase) * 100).toFixed(0) : 0}%</span> de tu salida
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <Card className="overflow-hidden border-white/10 bg-white/[0.02]">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
               <div className="p-1 px-2 rounded bg-rose-500/20 text-rose-400 text-[10px]">COMO</div>
               {t('expenses.stats.distribution')}
            </h3>
          </div>
          <div className="p-6">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [formatMoney(value, baseCurrency), t(`nav.categories.${name}`, { defaultValue: name })]}
                    contentStyle={{ 
                      backgroundColor: '#111', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', 
                      padding: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                    itemStyle={{ color: '#fff', padding: 0 }}
                    labelStyle={{ display: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
              {categoryData.map((cat, idx) => (
                <div key={cat.name} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                       <span className="p-1 rounded bg-white/5 text-text-secondary">
                          {CATEGORY_ICONS[cat.name] || CATEGORY_ICONS.default}
                       </span>
                       <span className="text-[11px] font-medium text-text-primary truncate">{t(`nav.categories.${cat.name}`, { defaultValue: cat.name })}</span>
                    </div>
                    <span className="text-[10px] font-mono text-text-secondary">{((cat.value / totalBase) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(cat.value / totalBase) * 100}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Merchant Summary (Brief) */}
        <Card className="overflow-hidden border-white/10 bg-white/[0.02]">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
               <div className="p-1 px-2 rounded bg-orange-500/20 text-orange-400 text-[10px]">DONDE</div>
               {t('expenses.stats.merchants')}
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {vendorData.slice(0, 6).map((item, idx) => {
              const pct = (item.value / totalBase) * 100;
              return (
                <div key={item.name} className="group cursor-default">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-white/20 w-4">{idx + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-text-primary group-hover:text-white transition-colors capitalize">{item.name.toLowerCase()}</span>
                        <span className="text-[9px] text-text-secondary uppercase">{item.count} compras</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-rose-400">{formatMoney(item.value, baseCurrency)}</span>
                    </div>
                  </div>
                  <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Detailed Vendor Analysis (Full Width) */}
      <Card className="p-6 bg-white/[0.02] border-white/5">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                 <ShoppingCart size={20} />
              </div>
              <div>
                 <h3 className="text-base font-bold text-white">{t('expenses.stats.detailedAnalysis')}</h3>
                 <p className="text-[10px] text-text-secondary uppercase tracking-widest font-medium">{t('expenses.stats.merchantSub')}</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {vendorData.slice(0, 9).map((v, i) => {
             const isExpanded = expandedVendor === v.name;
             return (
               <div 
                 key={v.name} 
                 onClick={() => setExpandedVendor(isExpanded ? null : v.name)}
                 className={`p-4 rounded-2xl bg-white/[0.02] border transition-all duration-500 overflow-hidden cursor-pointer group ${
                   isExpanded ? 'border-orange-500 ring-1 ring-orange-500/20 bg-white/[0.04] col-span-1 md:col-span-2 lg:col-span-1' : 'border-white/5 hover:border-orange-500/30'
                 }`}
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-colors ${
                          isExpanded ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-500/5 text-orange-400 border-orange-500/10'
                        }`}>
                           #{i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white capitalize">{v.name.toLowerCase()}</p>
                          <p className="text-[9px] text-text-secondary uppercase tracking-tighter">{v.count} movimientos este mes</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-black text-rose-400">{formatMoney(v.value, baseCurrency)}</p>
                        <p className="text-[9px] text-text-secondary">Avg: {formatMoney(v.avg, baseCurrency)}</p>
                     </div>
                  </div>

                  {!isExpanded && (
                    <>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                           style={{ width: `${(v.value / totalBase) * 100}%` }}
                         />
                      </div>
                      <div className="flex justify-between mt-2">
                         <span className="text-[9px] text-text-secondary font-bold uppercase">{t('expenses.stats.impact')}</span>
                         <span className="text-[9px] font-black text-orange-400">{((v.value / totalBase) * 100).toFixed(1)}%</span>
                      </div>
                    </>
                  )}

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3">{t('expenses.stats.history')}</p>
                      {v.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-1 rounded transition-colors group/item">
                          <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40 group-hover/item:bg-orange-500 transition-colors" />
                             <span className="text-[11px] text-text-secondary font-medium">{item.date}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-white">{formatMoney(item.amount, item.currency)}</span>
                        </div>
                      ))}
                      <div className="mt-4 p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                         <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">{t('expenses.stats.endHistory')}</p>
                      </div>
                    </div>
                  )}
               </div>
             );
           })}
        </div>
      </Card>

      {/* Capital Output Audit Bar */}
      <Card className="p-6 bg-white/[0.02] border-white/5 border-t-2 border-t-rose-500/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-1">{t('expenses.stats.wealthOutput')}</h4>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xl font-black text-text-primary">{t('expenses.stats.totalExpense')}: {formatMoney(totalBase, baseCurrency)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-widest border border-rose-500/20">
              {t('expenses.stats.auditInProgress')}
            </span>
          </div>
        </div>
        
        <div className="relative w-full h-4 bg-white/5 rounded-full p-0.5 border border-white/10">
          <div 
            className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all duration-1000 ease-out" 
            style={{ width: '100%', maxWidth: '100%' }} 
          />
        </div>
        
        <div className="flex justify-between mt-3 px-1">
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
            {monthTx.length} {t('expenses.stats.processed')} {viewMonth}
          </p>
          <p className="text-[10px] text-text-secondary font-medium">
            {t('expenses.stats.calculationBase')} {baseCurrency}
          </p>
        </div>
      </Card>
    </div>
  );
};

