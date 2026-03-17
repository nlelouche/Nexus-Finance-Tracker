import React from 'react';
import { ProgressBar } from '../ui';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Target, PieChart, Brain } from 'lucide-react';
import { formatMoney } from '../../utils/finance';
import { PieChart as ReChartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- KPI Widgets ---

export const KpiIncomeWidget: React.FC<{ amount: number }> = ({ amount }) => (
  <div className="p-6 flex flex-col justify-center h-full">
    <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">
      <ArrowUpRight size={14} className="text-emerald-400" />
      Ingresos (mes)
    </div>
    <h2 className="text-2xl font-black">{formatMoney(amount, 'USD')}</h2>
    <p className="text-[10px] text-emerald-400/60 font-medium">en USD equivalentes</p>
  </div>
);

export const KpiExpenseWidget: React.FC<{ amount: number }> = ({ amount }) => (
  <div className="p-6 flex flex-col justify-center h-full">
    <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">
      <ArrowDownRight size={14} className="text-rose-400" />
      Egresos (mes)
    </div>
    <h2 className="text-2xl font-black">{formatMoney(amount, 'USD')}</h2>
    <p className="text-[10px] text-text-secondary opacity-40 font-medium">en USD equivalentes</p>
  </div>
);

export const KpiSavingsWidget: React.FC<{ rate: number }> = ({ rate }) => (
  <div className="p-6 flex flex-col justify-center h-full">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-wider">
        <Target size={14} className="text-indigo-400" />
        Savings Rate
      </div>
      <span className="text-xs font-black text-indigo-400">{rate}%</span>
    </div>
    <div className="mt-2 text-2xl font-black">{rate}%</div>
    <div className="mt-2">
      <ProgressBar progress={rate} status={rate >= 20 ? 'good' : 'neutral'} />
    </div>
  </div>
);

export const KpiTopExpenseWidget: React.FC<{ name: string; value: number }> = ({ name, value }) => (
  <div className="p-6 flex flex-col justify-center h-full">
    <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">
      <TrendingUp size={14} className="text-rose-400" />
      Mayor Gasto
    </div>
    <h2 className="text-xl font-black truncate" title={name}>{name}</h2>
    <p className="text-rose-400 text-sm font-bold">{formatMoney(value, 'USD')}</p>
  </div>
);

export const KpiInvestmentsWidget: React.FC<{ total: number; count: number }> = ({ total, count }) => (
  <div className="p-6 flex flex-col justify-center h-full">
    <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">
      <Wallet size={14} className="text-blue-400" />
      Inversiones
    </div>
    <h2 className="text-2xl font-black">{formatMoney(total, 'USD')}</h2>
    <p className="text-blue-400/60 text-[10px] font-bold uppercase tracking-widest">{count} Activos</p>
  </div>
);

// --- Chart Widgets ---

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

export const ExpenseDistChartWidget: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="p-6 flex flex-col h-full overflow-hidden">
    <div className="flex items-center gap-2 text-text-secondary text-xs font-bold uppercase tracking-wider mb-4">
      <PieChart size={14} className="text-pink-400" />
      Distribución de Gastos
    </div>
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <ReChartsPie>
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => formatMoney(Number(value || 0), 'USD', 2)}
            contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(0,0,0,0.8)', color: '#fff' }}
          />
        </ReChartsPie>
      </ResponsiveContainer>
    </div>
  </div>
);

// --- Content / Intelligence Widgets ---

export const IntelligenceBriefingWidget: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 h-full flex flex-col">
    <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4">
      <Brain size={16} />
      Análisis de Inteligencia
    </div>
    <div className="flex-1 overflow-auto custom-scrollbar">
      {children}
    </div>
  </div>
);
