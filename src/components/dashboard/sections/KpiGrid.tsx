import React from 'react';
import { Card, ProgressBar } from '../../ui';
import { TrendingUp } from 'lucide-react';
import { formatMoney } from '../../../utils/finance';

interface KpiGridProps {
  incomeUSD: number;
  expenseUSD: number;
  savingsRate: number;
  topCategoryName: string;
  topCategoryValue: number;
  invTotalUSD: number;
  investmentsCount: number;
}

export const KpiGrid: React.FC<KpiGridProps> = ({
  incomeUSD,
  expenseUSD,
  savingsRate,
  topCategoryName,
  topCategoryValue,
  invTotalUSD,
  investmentsCount,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <Card>
        <p className="text-text-secondary text-sm">Ingresos (mes)</p>
        <h2 className="text-xl font-bold my-1">{formatMoney(incomeUSD, 'USD')}</h2>
        <p className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp size={12} /> en USD equiv.</p>
      </Card>
      <Card>
        <p className="text-text-secondary text-sm">Egresos (mes)</p>
        <h2 className="text-xl font-bold my-1">{formatMoney(expenseUSD, 'USD')}</h2>
        <p className="text-xs text-text-secondary">en USD equiv.</p>
      </Card>
      <Card>
        <p className="text-text-secondary text-sm">Savings Rate</p>
        <h2 className="text-xl font-bold my-1">{savingsRate}%</h2>
        <div className="mt-1"><ProgressBar progress={savingsRate} status={savingsRate >= 20 ? 'good' : 'neutral'} /></div>
      </Card>
      <Card>
        <p className="text-text-secondary text-sm">Mayor Gasto</p>
        <h2 className="text-xl font-bold my-1 truncate" title={topCategoryName}>{topCategoryName}</h2>
        <p className="text-xs text-rose-400">{formatMoney(topCategoryValue, 'USD')}</p>
      </Card>
      <Card>
        <p className="text-text-secondary text-sm">Inversiones</p>
        <h2 className="text-xl font-bold my-1">{formatMoney(invTotalUSD, 'USD')}</h2>
        <p className="text-xs text-indigo-400">{investmentsCount} activos</p>
      </Card>
    </div>
  );
};
