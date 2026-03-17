import React from 'react';
import { Card, ProgressBar } from '../../ui';
import { formatMoney, toUSD } from '../../../utils/finance';
import { Transaction, Goal, ExchangeRates } from '../../../types';

interface RecentActivityProps {
  transactions: Transaction[];
  goals: Goal[];
  exchangeRates: ExchangeRates;
  txIcons: Record<string, { icon: React.ReactNode; bg: string }>;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  transactions,
  goals,
  exchangeRates,
  txIcons,
}) => {
  return (
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
                    <span>{formatMoney(goal.currentAmount, goal.currency)}</span>
                    <span>Meta: {formatMoney(goal.targetAmount, goal.currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
