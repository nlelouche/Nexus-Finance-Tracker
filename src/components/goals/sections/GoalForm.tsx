import React from 'react';
import { Card, DatePicker } from '../../ui';
import { Target, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GOAL_EMOJIS } from '../../../utils/goals';
import { Currency } from '../../../types';

interface GoalFormProps {
  editingId: string | null;
  form: {
    name: string;
    emoji: string;
    targetAmount: string;
    currency: Currency;
    targetDate: string;
    currentAmount: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleSubmit: (e: React.FormEvent) => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({
  editingId,
  form,
  setForm,
  handleSubmit,
}) => {
  const { t } = useTranslation();
  return (
    <Card className="mb-8 border-amber-500/30 bg-amber-500/5 animate-in slide-in-from-top-4 duration-300">
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
        {editingId ? <Edit3 size={20} className="text-amber-400" /> : <Target size={20} className="text-amber-400" />}
        {editingId ? t('goals.form.editTitle') : t('goals.form.addTitle')}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Emoji picker */}
        <div>
          <label className="form-label text-xs uppercase tracking-wider opacity-60">{t('goals.form.emoji')}</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {GOAL_EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setForm((f: any) => ({ ...f, emoji: e }))}
                className={`text-2xl p-2 rounded-lg border transition-all ${
                  form.emoji === e
                    ? 'border-amber-400 bg-amber-400/20 scale-110'
                    : 'border-white/10 hover:border-white/30 bg-white/5'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label text-xs uppercase tracking-wider opacity-60">{t('goals.form.name')}</label>
          <input
            required
            type="text"
            className="form-control"
            placeholder="Ej: Auto nuevo, Viaje a Japón..."
            value={form.name}
            onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label text-xs uppercase tracking-wider opacity-60">{t('goals.form.targetAmount')}</label>
            <input
              required
              type="number"
              className="form-control"
              placeholder="0"
              value={form.targetAmount}
              onChange={e => setForm((f: any) => ({ ...f, targetAmount: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label text-xs uppercase tracking-wider opacity-60">{t('investments.create.currency')}</label>
            <select
              className="form-control"
              value={form.currency}
              onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value as Currency }))}
            >
              <option value="USD">USD — Dólar</option>
              <option value="ARS">ARS — Peso</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label text-xs uppercase tracking-wider opacity-60">{t('goals.form.currentAmount')}</label>
            <input
              type="number"
              className="form-control"
              placeholder="0"
              value={form.currentAmount}
              onChange={e => setForm((f: any) => ({ ...f, currentAmount: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label text-xs uppercase tracking-wider opacity-60">{t('goals.form.targetDate')}</label>
            <DatePicker value={form.targetDate} onChange={v => setForm((f: any) => ({ ...f, targetDate: v }))} showMonthYearPicker />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full mt-2 py-3 font-bold text-lg">
          {editingId ? t('goals.form.save') : t('goals.form.addTitle')}
        </button>
      </form>
    </Card>
  );
};
