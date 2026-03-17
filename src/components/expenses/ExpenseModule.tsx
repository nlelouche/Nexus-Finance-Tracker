import React, { useState } from 'react';
import { Card, DatePicker } from '../ui';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Currency } from '../../types';
import { Plus, Trash2, X, Check, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = ['Alquiler', 'Comida', 'Servicios', 'Impuestos', 'Tarjetas de Credito', 'Transporte', 'Entretenimiento', 'Suscripciones', 'Salud', 'Otros'];
const NOW_MONTH = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

const formatMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
};

export const ExpenseModule = () => {
  const { 
    transactions, addTransaction, updateTransaction,
    recurringExpenses, addRecurringExpense, deleteRecurringExpense, 
    markRecurringPaid, unmarkRecurringPaid 
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'gastos' | 'fijos'>('gastos');
  const [viewMonth, setViewMonth] = useState(NOW_MONTH);
  const [showForm, setShowForm] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

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

  const egresos = transactions.filter(t => t.type === 'expense');

  const formatMoney = (val: number, cur: string) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);

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
    if (!rForm.name || !rForm.amount) return;
    addRecurringExpense({
      name: rForm.name,
      amount: Number(rForm.amount),
      currency: rForm.currency,
      category: rForm.category,
      dayOfMonth: Number(rForm.dayOfMonth) || 1,
    });
    setRForm(emptyRecurring);
    setShowForm(false);
  };

  const navigateMonth = (dir: -1 | 1) => {
    const [y, m] = viewMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setViewMonth(d.toISOString().slice(0, 7));
  };

  // Stats del mes
  const totalFixed = recurringExpenses.reduce((acc, r) => acc + (r.paidMonths.some(p => p.month === viewMonth) ? r.amount : 0), 0);
  const pendingCount = recurringExpenses.filter(r => !r.paidMonths.some(p => p.month === viewMonth)).length;

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-600">
            Egresos
          </h1>
          <p className="text-text-secondary mt-2 text-lg">Control de gastos y costos fijos mensuales.</p>
        </div>
        {activeTab === 'fijos' && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="btn bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 flex items-center gap-2"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancelar' : 'Nuevo Costo Fijo'}
          </button>
        )}
      </header>

      {/* TABS */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit border border-white/10">
        <button
          onClick={() => setActiveTab('gastos')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'gastos' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Registro de Gastos
        </button>
        <button
          onClick={() => setActiveTab('fijos')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'fijos' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Costos Fijos
          {pendingCount > 0 && (
            <span className="ml-2 bg-amber-500 text-black text-xs font-black px-1.5 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </button>
      </div>

      {/* ──────────────── TAB: REGISTRO GASTOS ──────────────── */}
      {activeTab === 'gastos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-bold mb-6">{editingTxId ? 'Editar Gasto' : 'Registrar Gasto'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input type="text" className="form-control" placeholder="Ej: Compra supermercado" value={desc} onChange={e => setDesc(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Monto</label>
                  <input type="number" step="0.01" className="form-control" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Moneda</label>
                  <select className="form-control" value={currency} onChange={e => setCurrency(e.target.value as Currency)}>
                    <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <DatePicker value={date} onChange={setDate} />
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all" onClick={() => setIsNecessary(!isNecessary)}>
                <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${isNecessary ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isNecessary ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Inversión Necesaria / Planificada</p>
                  <p className="text-[10px] text-text-secondary">Evita que Nexus te recrimine por este gasto.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className={`btn ${editingTxId ? 'btn-primary bg-amber-500 hover:bg-amber-600 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'btn-primary'} flex-1 mt-2`}>
                  {editingTxId ? 'Actualizar Gasto' : 'Registrar Gasto'}
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
            <h3 className="text-lg font-bold mb-4">Últimos movimientos</h3>
            {egresos.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-8">Sin egresos registrados.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {egresos.slice(0, 30).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary text-sm">{t.description}</p>
                        <button 
                          onClick={() => handleEdit(t)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-text-secondary transition-all"
                          title="Editar"
                        >
                          <Plus size={12} className="rotate-45" /> {/* Use a small icon for edit or pen */}
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {t.category} · {t.date}
                        {t.isNecessary && <span className="ml-2 text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Necesario</span>}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-rose-400">{formatMoney(t.amount, t.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ──────────────── TAB: COSTOS FIJOS ──────────────── */}
      {activeTab === 'fijos' && (
        <div className="space-y-6">

          {/* Form nuevo costo fijo */}
          {showForm && (
            <Card className="border-rose-500/30 bg-rose-500/5 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-text-primary">
                <Plus size={18} className="text-rose-400" /> Agregar Costo Fijo
              </h3>
              <form onSubmit={handleAddRecurring} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="form-label">Nombre</label>
                  <input required type="text" className="form-control" placeholder="Ej: Netflix, Internet..." value={rForm.name} onChange={e => setRForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Monto</label>
                  <input required type="number" className="form-control" placeholder="0" value={rForm.amount} onChange={e => setRForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Moneda</label>
                  <select className="form-control" value={rForm.currency} onChange={e => setRForm(f => ({ ...f, currency: e.target.value as Currency }))}>
                    <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">Categoría</label>
                  <select className="form-control" value={rForm.category} onChange={e => setRForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Vence día</label>
                  <input type="number" min="1" max="31" className="form-control" value={rForm.dayOfMonth} onChange={e => setRForm(f => ({ ...f, dayOfMonth: e.target.value }))} />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn btn-primary w-full">Guardar</button>
                </div>
              </form>
            </Card>
          )}

          {/* Header mes + navegación */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary">
                <ChevronLeft size={18} />
              </button>
              <span className="font-bold text-text-primary capitalize text-lg">{formatMonth(viewMonth)}</span>
              <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary">
                <ChevronRight size={18} />
              </button>
              {viewMonth !== NOW_MONTH && (
                <button onClick={() => setViewMonth(NOW_MONTH)} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  <RotateCcw size={12} /> Volver a hoy
                </button>
              )}
            </div>
            {/* Summary pills */}
            <div className="flex gap-3 text-sm">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                ✓ {formatMoney(totalFixed, 'ARS')} pagado
              </div>
              {pendingCount > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                  ⏳ {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Lista de costos fijos */}
          {recurringExpenses.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <div className="text-5xl mb-3">📋</div>
              <h3 className="text-lg font-bold text-text-primary mb-1">No hay costos fijos configurados</h3>
              <p className="text-text-secondary text-sm mb-4">Agregá tus suscripciones, servicios y gastos mensuales recurrentes.</p>
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                <Plus size={16} className="mr-2 inline" /> Agregar primero
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recurringExpenses.map(exp => {
                const isPaid = exp.paidMonths.some(p => p.month === viewMonth);
                return (
                  <div
                    key={exp.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isPaid
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-bg-card border-white/8 hover:border-white/20'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => isPaid
                        ? unmarkRecurringPaid(exp.id, viewMonth)
                        : markRecurringPaid(exp.id, viewMonth)
                      }
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        isPaid
                          ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                          : 'border-white/20 hover:border-emerald-400'
                      }`}
                    >
                      {isPaid && <Check size={16} className="text-white" strokeWidth={3} />}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isPaid ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                          {exp.name}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-text-secondary">{exp.category}</span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {isPaid ? '✓ Pagado este mes' : `Vence día ${exp.dayOfMonth}`}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <div className={`font-mono font-bold ${isPaid ? 'text-emerald-400' : 'text-text-primary'}`}>
                        {formatMoney(exp.amount, exp.currency)}
                      </div>
                      <div className="text-xs text-text-secondary">{exp.currency}</div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteRecurringExpense(exp.id)}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-rose-500/10 text-text-secondary/40 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer: total del mes */}
          {recurringExpenses.length > 0 && (
            <Card className="bg-white/3 border-white/8">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary font-medium">Total costos fijos del mes</span>
                <span className="text-2xl font-black text-text-primary">
                  {formatMoney(recurringExpenses.reduce((acc, r) => acc + r.amount, 0), 'ARS')}
                </span>
              </div>
              <div className="mt-3 w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${recurringExpenses.length > 0 ? ((recurringExpenses.filter(r => r.paidMonths.some(p => p.month === viewMonth)).length / recurringExpenses.length) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {recurringExpenses.filter(r => r.paidMonths.some(p => p.month === viewMonth)).length} de {recurringExpenses.length} pagados
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
