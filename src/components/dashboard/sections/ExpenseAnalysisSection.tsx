import React from 'react';
import { Card } from '../../ui';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Check, X, Plus } from 'lucide-react';
import { formatMoney, toUSD } from '../../../utils/finance';
import { Transaction, ExchangeRates } from '../../../types';

interface ExpenseAnalysisSectionProps {
  expenseByCategory: { name: string; value: number }[];
  expenseUSD: number;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  thisMthTx: Transaction[];
  exchangeRates: ExchangeRates;
  updateTransaction: (id: string, data: any) => void;
  txIcons: Record<string, { icon: React.ReactNode; bg: string }>;
}

const CHART_COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9'];
const CATEGORIES_LIST = ['Alquiler', 'Comida', 'Servicios', 'Impuestos', 'Tarjetas de Credito', 'Transporte', 'Entretenimiento', 'Suscripciones', 'Salud', 'Otros'];

export const ExpenseAnalysisSection: React.FC<ExpenseAnalysisSectionProps> = ({
  expenseByCategory,
  expenseUSD,
  selectedCategory,
  setSelectedCategory,
  thisMthTx,
  exchangeRates,
  updateTransaction,
  txIcons,
}) => {
  const [editingTxId, setEditingTxId] = React.useState<string | null>(null);
  const [desc, setDesc] = React.useState('');
  const [category, setCategory] = React.useState('');


  return (
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
                  formatter={(value: any) => formatMoney(value, 'USD')}
                  contentStyle={{ backgroundColor: 'rgba(3,3,3,0.8)', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute pointer-events-none flex flex-col items-center justify-center pt-4">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Total Gastos</span>
            <span className="text-lg font-bold text-text-primary">{formatMoney(expenseUSD, 'USD')}</span>
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
                    <span className="font-mono text-text-secondary">{formatMoney(cat.value, 'USD')}</span>
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
              Total: <span className="text-text-primary font-bold">{formatMoney(expenseByCategory.find(c => c.name === selectedCategory)?.value || 0, 'USD')}</span>
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
                          <p className="font-bold text-rose-400">-{formatMoney(tx.amount, tx.currency)}</p>
                          <p className="text-[10px] text-text-secondary/60">≈ {formatMoney(toUSD(tx.amount, tx.currency, exchangeRates), 'USD')}</p>
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
  );
};
