import React, { useState } from 'react';
import { Card, DatePicker } from '../ui';
import { useTranslation } from 'react-i18next';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Currency } from '../../types';
import { Plus, Trash2, X, Check, RotateCcw, ChevronLeft, ChevronRight, BarChart3, Pencil } from 'lucide-react';
import { formatMoney, convertCurrency } from '../../utils/finance';
import { ExpenseStats } from './ExpenseStats';

const CATEGORIES = ['Alquiler', 'Comida', 'Servicios', 'Impuestos', 'Tarjetas de Credito', 'Transporte', 'Entretenimiento', 'Suscripciones', 'Salud', 'Otros'];
const NOW_MONTH = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

const formatMonth = (ym: string, locale: string) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
};

export const ExpenseModule = () => {
  const { t } = useTranslation();
  const { 
    transactions, addTransaction, updateTransaction,
    recurringExpenses, addRecurringExpense, deleteRecurringExpense, updateRecurringExpense,
    markRecurringPaid, unmarkRecurringPaid, exchangeRates, baseCurrency, setBaseCurrency
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'gastos' | 'fijos'>('gastos');
  const [viewMonth, setViewMonth] = useState(NOW_MONTH);
  const [showForm, setShowForm] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);

  // ── Gasto rápido form ──────────────────────────────────────
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [category, setCategory] = useState('Comida');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isNecessary, setIsNecessary] = useState(false);

  // ── Recurring form ─────────────────────────────────────────
  const emptyRecurring = { name: '', amount: '', currency: 'ARS' as Currency, category: 'Servicios', dayOfMonth: '1' };
  const [rForm, setRForm] = useState(emptyRecurring);

  const egresos = transactions.filter(t => t.type === 'expense' && t.date.startsWith(viewMonth));

  // formatMoney local logic removed as we use the util version now

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    
    const txData = { description: desc, amount: Number(amount), currency, date, type: 'expense' as const, category, isNecessary };
    
    if (editingTxId) {
      updateTransaction(editingTxId, txData);
      setEditingTxId(null);
    } else {
      addTransaction(txData);
    }
    
    setDesc(''); setAmount(''); setIsNecessary(false);
  };

  const handleEdit = (t: any) => {
    setEditingTxId(t.id);
    setDesc(t.description);
    setAmount(t.amount.toString());
    setCurrency(t.currency);
    setCategory(t.category);
    setDate(t.date);
    setIsNecessary(t.isNecessary || false);
    setActiveTab('gastos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecurringId) {
      updateRecurringExpense(editingRecurringId, {
        name: rForm.name,
        amount: Number(rForm.amount),
        currency: rForm.currency,
        category: rForm.category,
        dayOfMonth: Number(rForm.dayOfMonth) || 1,
      });
      setEditingRecurringId(null);
    } else {
      addRecurringExpense({
        name: rForm.name,
        amount: Number(rForm.amount),
        currency: rForm.currency,
        category: rForm.category,
        dayOfMonth: Number(rForm.dayOfMonth) || 1,
      });
    }
    setRForm(emptyRecurring);
    setShowForm(false);
  };

  const handleEditRecurring = (exp: any) => {
    setRForm({
      name: exp.name,
      amount: exp.amount.toString(),
      currency: exp.currency,
      category: exp.category,
      dayOfMonth: exp.dayOfMonth.toString(),
    });
    setEditingRecurringId(exp.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateMonth = (dir: -1 | 1) => {
    const [y, m] = viewMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setViewMonth(d.toISOString().slice(0, 7));
  };

  // Stats del mes
  const totalFixed = recurringExpenses.reduce((acc, r) => acc + (r.paidMonths.some(p => p.month === viewMonth) ? convertCurrency(r.amount, r.currency, baseCurrency, exchangeRates) : 0), 0);
  const pendingCount = recurringExpenses.filter(r => !r.paidMonths.some(p => p.month === viewMonth)).length;

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-600">
            {t('expenses.title')}
          </h1>
          <p className="text-text-secondary mt-2 text-lg">{t('expenses.subtitle')}</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Currency Toggle */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            {(['ARS', 'USD', 'EUR'] as Currency[]).map((cur) => (
              <button
                key={cur}
                onClick={() => setBaseCurrency(cur)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${
                  baseCurrency === cur 
                    ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-105' 
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>

          {activeTab === 'fijos' && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="btn bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 flex items-center gap-2"
            >
              {showForm ? <X size={18} /> : (editingRecurringId ? <Pencil size={18} /> : <Plus size={18} />)}
              {showForm ? t('common.cancel') : (editingRecurringId ? 'Editando...' : t('expenses.fixed.addTitle'))}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 gap-6 mb-8">
        {/* TABS */}
        <div className="flex gap-1 bg-black/20 rounded-xl p-1 w-fit border border-white/5">
          <button
            onClick={() => setActiveTab('gastos')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'gastos' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <BarChart3 size={16} />
            {t('expenses.tabs.registry')}
          </button>
          <button
            onClick={() => setActiveTab('fijos')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'fijos' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <RotateCcw size={16} />
            {t('expenses.tabs.fixed')}
            {pendingCount > 0 && (
              <span className="ml-1 bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        </div>

        {/* MONTH NAVIGATION */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigateMonth(-1)} className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-white transition-all">
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-[140px] text-center">
               <span className="font-black text-white capitalize text-lg tracking-tight">{formatMonth(viewMonth, t('common.locale'))}</span>
            </div>
            <button onClick={() => navigateMonth(1)} className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-white transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
          {viewMonth !== NOW_MONTH && (
            <button onClick={() => setViewMonth(NOW_MONTH)} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all" title={t('expenses.fixed.backToCurrent')}>
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </div>

      {/* ──────────────── TAB: REGISTRO GASTOS ──────────────── */}
      {activeTab === 'gastos' && (
        <div className="space-y-10 animate-in fade-in duration-700">
          {/* Dashboard de Estadísticas */}
          <section>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <BarChart3 size={20} />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-white">Análisis de Egresos</h2>
                  <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-bold">Inteligencia de Datos · {formatMonth(viewMonth, t('common.locale'))}</p>
               </div>
            </div>
            <ExpenseStats 
              transactions={transactions} 
              exchangeRates={exchangeRates} 
              baseCurrency={baseCurrency} 
              viewMonth={viewMonth} 
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card>
              <h3 className="text-lg font-bold mb-6">{editingTxId ? t('expenses.form.editTitle') : t('expenses.form.addTitle')}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">{t('expenses.form.description')}</label>
                  <input type="text" className="form-control" placeholder={t('expenses.form.descPlaceholder')} value={desc} onChange={e => setDesc(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('expenses.form.amount')}</label>
                    <input type="number" step="0.01" className="form-control" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('expenses.form.currency')}</label>
                    <select className="form-control" value={currency} onChange={e => setCurrency(e.target.value as Currency)}>
                      <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('expenses.form.category')}</label>
                    <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('expenses.form.date')}</label>
                    <DatePicker value={date} onChange={setDate} />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all" onClick={() => setIsNecessary(!isNecessary)}>
                  <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${isNecessary ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isNecessary ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-text-primary uppercase tracking-wider">{t('expenses.form.isNecessary')}</p>
                    <p className="text-[10px] text-text-secondary">{t('expenses.form.necessaryTip')}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className={`btn ${editingTxId ? 'btn-primary bg-amber-500 hover:bg-amber-600 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'btn-primary'} flex-1 mt-2`}>
                    {editingTxId ? t('expenses.form.update') : t('expenses.form.submit')}
                  </button>
                  {editingTxId && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingTxId(null);
                        setDesc(''); setAmount('');
                      }}
                      className="btn bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 mt-2"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </Card>

            <Card>
              <h3 className="text-lg font-bold mb-4">{t('expenses.lastTransactions')}</h3>
              {egresos.length === 0 ? (
                <p className="text-text-secondary text-sm text-center py-8">{t('expenses.empty')}</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                  {egresos.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text-primary text-sm">{tx.description}</p>
                          <button 
                            onClick={() => handleEdit(tx)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-text-secondary transition-all"
                            title={t('common.edit')}
                          >
                            <Plus size={12} className="rotate-45" />
                          </button>
                        </div>
                        <p className="text-xs text-text-secondary">
                          {t(`categories.${tx.category}`, { defaultValue: tx.category })} · {tx.date}
                          {tx.isNecessary && <span className="ml-2 text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">{t('common.necessary')}</span>}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-rose-400">{formatMoney(tx.amount, tx.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────── TAB: COSTOS FIJOS ──────────────── */}
      {activeTab === 'fijos' && (
        <div className="space-y-6 animate-in fade-in duration-700">
          {/* Form nuevo costo fijo */}
          {showForm && (
            <Card className="border-rose-500/30 bg-rose-500/5 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-text-primary">
                {editingRecurringId ? <Pencil size={18} className="text-amber-400" /> : <Plus size={18} className="text-rose-400" />} 
                {editingRecurringId ? t('expenses.fixed.editTitle', { defaultValue: 'Editar Costo Fijo' }) : t('expenses.fixed.addTitle')}
              </h3>
              <form onSubmit={handleAddRecurring} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="form-label">{t('expenses.fixed.name')}</label>
                  <input required type="text" className="form-control" placeholder={t('expenses.fixed.namePlaceholder')} value={rForm.name} onChange={e => setRForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">{t('expenses.form.amount')}</label>
                  <input required type="number" className="form-control" placeholder="0" value={rForm.amount} onChange={e => setRForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Moneda</label>
                  <select className="form-control" value={rForm.currency} onChange={e => setRForm(f => ({ ...f, currency: e.target.value as Currency }))}>
                    <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">{t('expenses.form.category')}</label>
                  <select className="form-control" value={rForm.category} onChange={e => setRForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('expenses.fixed.dayOfMonth')}</label>
                  <input type="number" min="1" max="31" className="form-control" value={rForm.dayOfMonth} onChange={e => setRForm(f => ({ ...f, dayOfMonth: e.target.value }))} />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" className={`btn ${editingRecurringId ? 'bg-amber-500 hover:bg-amber-600' : 'btn-primary'} w-full`}>
                    {editingRecurringId ? t('common.update', { defaultValue: 'Actualizar' }) : t('common.save')}
                  </button>
                  {editingRecurringId && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingRecurringId(null);
                        setRForm(emptyRecurring);
                        setShowForm(false);
                      }}
                      className="btn bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </form>
            </Card>
          )}

          {/* Stats mes aca (el header mes se movio arriba) */}
          <div className="flex justify-end gap-3 text-sm">
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-2">
              <Check size={16} />
              {formatMoney(totalFixed, baseCurrency)} {t('expenses.fixed.paid')}
            </div>
            {pendingCount > 0 && (
              <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center gap-2">
                <RotateCcw size={16} className="animate-spin-slow" />
                {pendingCount} {t('expenses.fixed.pending')}
              </div>
            )}
          </div>

          {/* Lista de costos fijos */}
          {recurringExpenses.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.01]">
              <div className="text-5xl mb-3 opacity-20">📋</div>
              <h3 className="text-lg font-bold text-text-primary mb-1">{t('expenses.fixed.noConfig')}</h3>
              <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto">{t('expenses.fixed.noConfigSub')}</p>
              <button onClick={() => setShowForm(true)} className="btn btn-primary px-8">
                <Plus size={16} className="mr-2 inline" /> {t('expenses.fixed.addFirst')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recurringExpenses.map(exp => {
                const isPaid = exp.paidMonths.some(p => p.month === viewMonth);
                return (
                  <div
                    key={exp.id}
                    className={`flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all duration-300 ${
                      isPaid
                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                    }`}
                  >
                    <button
                      onClick={() => isPaid
                        ? unmarkRecurringPaid(exp.id, viewMonth)
                        : markRecurringPaid(exp.id, viewMonth)
                      }
                      className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                        isPaid
                          ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                          : 'border-white/10 hover:border-emerald-400'
                      }`}
                    >
                      {isPaid && <Check size={18} className="text-white" strokeWidth={4} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm truncate ${isPaid ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                          {exp.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-text-secondary font-black uppercase tracking-tighter">
                          {t(`categories.${exp.category}`, { defaultValue: exp.category })}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-secondary mt-0.5 font-medium">
                        {isPaid ? t('expenses.fixed.isPaid') : t('expenses.fixed.dueDay', { day: exp.dayOfMonth })}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className={`font-mono font-bold text-lg ${isPaid ? 'text-emerald-400' : 'text-text-primary'}`}>
                        {formatMoney(exp.amount, exp.currency)}
                      </div>
                      <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{exp.currency}</div>
                    </div>

                    <button
                      onClick={() => deleteRecurringExpense(exp.id)}
                      className="flex-shrink-0 p-2 rounded-xl hover:bg-rose-500/10 text-white/10 hover:text-rose-400 transition-all ml-2"
                      title={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      onClick={() => handleEditRecurring(exp)}
                      className="flex-shrink-0 p-2 rounded-xl hover:bg-amber-500/10 text-white/10 hover:text-amber-400 transition-all ml-1"
                      title={t('common.edit')}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer: total del mes */}
          {recurringExpenses.length > 0 && (
            <Card className="bg-white/5 border-white/10 p-8 rounded-[2rem]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[10px] text-text-secondary font-black uppercase tracking-[0.35em] block mb-2">{t('expenses.fixed.totalMonth')}</span>
                  <span className="text-4xl font-black text-white tracking-tighter">
                    {formatMoney(recurringExpenses.reduce((acc, r) => acc + convertCurrency(r.amount, r.currency, baseCurrency, exchangeRates), 0), baseCurrency)}
                  </span>
                </div>
                <div className="w-full md:w-1/2">
                   <div className="flex justify-between items-end mb-3">
                     <span className="text-xs font-bold text-text-secondary">Cumplimiento</span>
                     <span className="text-xs font-black text-emerald-400">
                        {Math.round((recurringExpenses.filter(r => r.paidMonths.some(p => p.month === viewMonth)).length / recurringExpenses.length) * 100)}%
                     </span>
                   </div>
                   <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      style={{ width: `${(recurringExpenses.filter(r => r.paidMonths.some(p => p.month === viewMonth)).length / recurringExpenses.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-secondary mt-3 font-bold uppercase tracking-widest">
                    {t('expenses.fixed.paidCount', { 
                      paid: recurringExpenses.filter(r => r.paidMonths.some(p => p.month === viewMonth)).length, 
                      total: recurringExpenses.length 
                    })}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
