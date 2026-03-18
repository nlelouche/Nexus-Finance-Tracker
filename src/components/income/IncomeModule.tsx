import React, { useState } from 'react';
import { Card, DatePicker } from '../ui';
import { useTranslation } from 'react-i18next';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Currency } from '../../types';
import { Trash2 } from 'lucide-react';

export const IncomeModule = () => {
  const { t } = useTranslation();
  const { transactions, addTransaction, deleteTransaction } = useFinanceStore();
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  const ingresos = transactions.filter(t => t.type === 'income');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    
    addTransaction({
      description: desc,
      amount: Number(amount),
      currency,
      date,
      type: 'income',
      category: 'Ingreso',
      source: desc,
      isRecurring
    });
    
    setDesc('');
    setAmount('');
  };

  const formatMoney = (val: number, cur: string) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500 drop-shadow-sm">
          {t('income.title')}
        </h1>
        <p className="text-text-secondary mt-2 text-lg">{t('income.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold mb-6">{t('income.form.addTitle')}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <label className="form-label">{t('income.form.source')}</label>
              <input type="text" className="form-control" placeholder={t('income.form.sourcePlaceholder')} value={desc} onChange={e => setDesc(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">{t('income.form.amount')}</label>
                <input type="number" step="0.01" className="form-control" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('income.form.currency')}</label>
                <select className="form-control" value={currency} onChange={e => setCurrency(e.target.value as Currency)}>
                  <option value="ARS">ARS - Pesos</option>
                  <option value="USD">USD - Dólares</option>
                  <option value="EUR">EUR - Euros</option>
                </select>
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">{t('income.form.date')}</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className="form-group flex items-center gap-2 mt-2">
              <input type="checkbox" id="recurrente" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="cursor-pointer" />
              <label htmlFor="recurrente" className="text-sm cursor-pointer select-none">{t('income.form.isRecurring')}</label>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-4">{t('income.form.submit')}</button>
          </form>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <h3 className="text-lg font-bold mb-4">{t('income.totals')}</h3>
            {['USD', 'EUR', 'ARS'].map(cur => {
              const total = ingresos.filter(i => i.currency === cur).reduce((acc, curr) => acc + curr.amount, 0);
              return (
                <div key={cur} className="flex justify-between items-center border-b border-border-light pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                  <span className="text-text-secondary">{t('income.totalLabel', { cur })}</span>
                  <span className="text-lg text-accent-green font-medium">+{formatMoney(total, cur)}</span>
                </div>
              );
            })}
          </Card>

          <Card className="flex-1">
            <h3 className="text-lg font-bold mb-4">{t('income.history')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-light text-text-secondary text-sm">
                    <th className="py-3 px-2 font-medium">{t('income.table.description')}</th>
                    <th className="py-3 px-2 font-medium">{t('income.table.date')}</th>
                    <th className="py-3 px-2 font-medium">{t('income.table.amount')}</th>
                    <th className="py-3 px-2 font-medium text-right">{t('income.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {ingresos.slice(0, 10).map(tx => (
                    <tr key={tx.id} className="border-b border-border-light last:border-0 hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-2 truncate max-w-[150px]" title={tx.description}>{tx.description}</td>
                      <td className="py-3 px-2 text-text-secondary">{new Date(tx.date).toLocaleDateString(t('common.locale'), { day: '2-digit', month: 'short' })}</td>
                      <td className="py-3 px-2 text-accent-green font-medium">+{formatMoney(tx.amount, tx.currency)}</td>
                      <td className="py-3 px-2 text-right">
                        <button 
                          onClick={() => {
                            if (window.confirm(t('income.delete.confirm'))) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 text-text-secondary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title={t('income.delete.button')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
