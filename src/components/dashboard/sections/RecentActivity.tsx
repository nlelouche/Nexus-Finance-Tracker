import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, ProgressBar } from '../../ui';
import { formatMoney, toUSD } from '../../../utils/finance';
import { Transaction, Goal, ExchangeRates } from '../../../types';

interface RecentActivityProps {
  transactions: Transaction[];
  goals: Goal[];
  exchangeRates: ExchangeRates;
  txIcons: Record<string, { icon: React.ReactNode; bg: string }>;
}

export const RecentActivityList: React.FC<RecentActivityProps> = ({
  transactions,
  txIcons,
  exchangeRates,
}) => {
  const { t } = useTranslation();
  return (
    <Card className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black tracking-tight">{t('dashboard.recentActivity.title')}</h3>
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
                  <p className="text-xs text-text-secondary">{t(`categories.${tx.category}`, { defaultValue: tx.category })} · {new Date(tx.date + 'T12:00:00').toLocaleDateString(t('common.locale', { defaultValue: 'es-AR' }), { day: '2-digit', month: 'short' })}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${isIncome ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isIncome ? '+' : '-'}{formatMoney(tx.amount, tx.currency)}
                </div>
                <div className="text-xs text-text-secondary/60">
                  ≈ {formatMoney(toUSD(tx.amount, tx.currency, exchangeRates), 'USD')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const MainGoals: React.FC<RecentActivityProps> = ({
  goals,
}) => {
  const { t } = useTranslation();
  return (
    <Card className="h-full border-indigo-500/20 bg-indigo-500/5">
      <h3 className="text-xl font-black tracking-tight mb-6">{t('dashboard.mainGoals.title')}</h3>
      <div className="flex flex-col gap-6">
        {goals.slice(0, 3).map(goal => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          return (
            <div key={goal.id}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm tracking-tight">{goal.name}</span>
                <span className="text-xs font-black text-indigo-400">{progress.toFixed(0)}%</span>
              </div>
              <ProgressBar progress={progress} status={progress >= 70 ? 'good' : 'neutral'} />
              <div className="flex justify-between text-[10px] text-text-secondary font-mono mt-2">
                <span>{formatMoney(goal.currentAmount, goal.currency)}</span>
                <span>{t('dashboard.mainGoals.target')} {formatMoney(goal.targetAmount, goal.currency)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
