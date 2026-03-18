import { Calendar, Zap, Edit3, Trash2, DollarSign, ChevronRight, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatMoney, convertCurrency } from '../../../utils/finance';
import { getDaysRemaining, getMonthsRemaining, getTrackingStatus, getProjection } from '../../../utils/goals';
import { Goal, Currency, ExchangeRates } from '../../../types';

interface GoalCardProps {
  goal: Goal;
  exchangeRates: ExchangeRates;
  handleEdit: (goal: Goal) => void;
  setDeleteConfirm: (id: string) => void;
  openModal: (goal: { id: string; name: string; currency: string }, mode: 'add' | 'withdraw') => void;
  expandedHistory: string | null;
  setExpandedHistory: (id: string | null) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  exchangeRates,
  handleEdit,
  setDeleteConfirm,
  openModal,
  expandedHistory,
  setExpandedHistory,
}) => {
  const { t } = useTranslation();
  const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const months = getMonthsRemaining(goal.targetDate);
  const days = getDaysRemaining(goal.targetDate);
  const monthlyNeeded = months > 0 ? remaining / months : remaining;
  const isComplete = progress >= 100;
  const tracking = getTrackingStatus(goal.startDate, goal.targetDate, goal.currentAmount, goal.targetAmount);
  const projection = getProjection(goal.startDate, goal.targetDate, goal.currentAmount, goal.targetAmount);

  const accent = isComplete
    ? { ring: 'border-emerald-500/50', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]', bar: 'bg-emerald-400', text: 'text-emerald-400' }
    : progress > 50
    ? { ring: 'border-amber-500/30', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]', bar: 'bg-amber-400', text: 'text-amber-400' }
    : { ring: 'border-white/10', glow: '', bar: 'bg-indigo-400', text: 'text-indigo-400' };

  return (
    <div
      className={`relative bg-bg-card rounded-2xl border p-6 flex flex-col gap-4 transition-all hover:scale-[1.01] ${accent.ring} ${accent.glow}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-text-primary leading-tight">{goal.name}</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><Calendar size={12} /> {goal.targetDate}</span>
            {!isComplete && (
              <span className={`flex items-center gap-1 font-bold ${days < 60 ? 'text-rose-400' : 'text-text-secondary'}`}>
                <Zap size={12} /> {days} {t('goals.card.daysTo')}
              </span>
            )}
            {isComplete && <span className="text-emerald-400 font-bold">✅ {t('common.complete')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(goal)}
            className="p-2 rounded-lg hover:bg-white/10 text-text-secondary/60 hover:text-white transition-colors"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirm(goal.id)}
            className="p-2 rounded-lg hover:bg-rose-500/10 text-text-secondary/60 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Progress body */}
      <div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-3xl font-black text-text-primary">
              {formatMoney(goal.currentAmount, goal.currency)}
            </span>
            <span className="text-text-secondary text-sm ml-2">{t('goals.card.reached')}</span>
          </div>
          <span className="text-text-secondary text-sm font-medium">
            {t('goals.card.target')}: <strong className="text-text-primary">{formatMoney(goal.targetAmount, goal.currency)}</strong>
          </span>
        </div>

        {/* Tracking badge */}
        {tracking && !isComplete && (
          <div className={`flex flex-col gap-1 mb-3 px-3 py-2 rounded-lg border text-xs ${tracking.bg}`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold ${tracking.color}`}>{t(`goals.status.${tracking.status}`)}</span>
              <span className="text-text-secondary">
                {t(`goals.status.${tracking.status}Sub`, { pct: Math.abs(tracking.diffPct).toFixed(0) })}
              </span>
            </div>
            {projection && (
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-text-secondary">{t('goals.projection.label')}</span>
                <span className={`font-bold ${
                  projection.diffMonths > 0
                    ? 'text-emerald-400'
                    : projection.diffMonths < 0
                    ? 'text-rose-400'
                    : 'text-blue-400'
                }`}>
                  {projection.projectedDate}
                  {' '}
                  {projection.diffMonths > 0 && t('goals.projection.early', { 
                    months: projection.diffMonths, 
                    suffix: Math.abs(projection.diffMonths) > 1 ? (t('common.language') === 'es' ? 'es' : 's') : '' 
                  })}
                  {projection.diffMonths < 0 && t('goals.projection.late', { 
                    months: Math.abs(projection.diffMonths), 
                    suffix: Math.abs(projection.diffMonths) > 1 ? (t('common.language') === 'es' ? 'es' : 's') : '' 
                  })}
                  {projection.diffMonths === 0 && t('goals.projection.onTime')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="relative w-full h-3 bg-white/5 rounded-full overflow-visible mb-1">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${accent.bar}`}
            style={{ width: `${progress}%` }}
          />
          {tracking && !isComplete && (
            <div
              className="absolute top-[-3px] w-0.5 h-[18px] bg-white/40 rounded-full"
              style={{ left: `${Math.min(99, (tracking.expectedAmount / goal.targetAmount) * 100)}%` }}
              title={`Esperado: ${formatMoney(tracking.expectedAmount, goal.currency)}`}
            />
          )}
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-sm font-bold ${accent.text}`}>{progress.toFixed(1)}%</span>
          {tracking && !isComplete && (
            <span className="text-xs text-text-secondary/60">
              {t('investments.recalc.expected')}: <strong className="text-text-secondary">{formatMoney(tracking.expectedAmount, goal.currency)}</strong>
            </span>
          )}
          {!tracking && !isComplete && (
            <span className="text-text-secondary text-xs">{t('goals.card.remaining')} {formatMoney(remaining, goal.currency)}</span>
          )}
        </div>
      </div>

      {/* Stats row */}
      {!isComplete && months > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-xs text-text-secondary mb-1 flex items-center justify-center gap-1">
              <TrendingUp size={11} /> {t('goals.form.targetAmount')} {t('common.monthly')}
            </div>
            <div className={`text-base font-black ${accent.text}`}>
              {formatMoney(monthlyNeeded, goal.currency)}
              {goal.currency !== 'ARS' && (
                <span className="block text-[10px] text-text-secondary/60 font-normal">
                  ≈ {formatMoney(convertCurrency(monthlyNeeded, goal.currency, 'ARS', exchangeRates), 'ARS')}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-xs text-text-secondary mb-1 flex items-center justify-center gap-1">
              <Calendar size={11} /> {t('goals.card.monthsRemaining')}
            </div>
            <div className="text-base font-black text-text-primary">
              {months}
            </div>
          </div>
        </div>
      )}

      {/* Currency Breakdown */}
      {goal.history && goal.history.length > 0 && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-2 font-bold">{t('goals.card.fundSummary')}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {['USD', 'ARS', 'EUR'].map(cur => {
              const total = goal.history?.filter(h => h.currency === cur).reduce((sum, entry) => sum + entry.amount, 0) || 0;
              if (total === 0) return null;
              return (
                <span key={cur} className="text-xs font-mono font-bold text-text-primary">
                  {formatMoney(total, cur as Currency)} <span className="text-text-secondary font-normal opacity-60">{t('common.in')} {cur}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* History Toggle */}
      <div>
        <button
          onClick={() => setExpandedHistory(expandedHistory === goal.id ? null : goal.id)}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          {expandedHistory === goal.id ? t('common.hideHistory') : t('goals.card.history')}
          <ChevronRight size={12} className={`transition-transform ${expandedHistory === goal.id ? 'rotate-90' : ''}`} />
        </button>

        {expandedHistory === goal.id && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in slide-in-from-top-2">
            {goal.history?.slice().reverse().map(entry => (
              <div key={entry.id} className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-text-primary truncate">{entry.note || t('common.noNote')}</p>
                  <p className="text-[10px] text-text-secondary">{new Date(entry.date).toLocaleDateString(t('common.locale'))}</p>
                </div>
                <span className={`text-xs font-mono font-bold ${entry.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {entry.amount > 0 ? '+' : ''}{formatMoney(entry.amount, entry.currency)}
                </span>
              </div>
            ))}
            {(!goal.history || goal.history.length === 0) && (
              <p className="text-xs text-text-secondary text-center py-4 italic">{t('goals.card.noHistory')}</p>
            )}
          </div>
        )}
      </div>

      {/* CTA buttons */}
      {!isComplete && (
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => openModal({ id: goal.id, name: goal.name, currency: goal.currency }, 'add')}
            className="btn bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary flex items-center justify-center gap-2 flex-1"
          >
            <DollarSign size={16} className={accent.text} /> {t('goals.card.addProgress')}
            <ChevronRight size={14} className="ml-auto text-text-secondary" />
          </button>
          <button
            onClick={() => openModal({ id: goal.id, name: goal.name, currency: goal.currency }, 'withdraw')}
            className="btn bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center gap-2 px-4"
            title={t('goals.card.withdrawTitle')}
          >
            <TrendingUp size={16} className="rotate-180" /> {t('goals.card.withdraw')}
          </button>
        </div>
      )}
    </div>
  );
};
