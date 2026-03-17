import React, { useState } from 'react';
import { Card, DatePicker } from '../ui';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Target, Plus, Trash2, Zap, Calendar, TrendingUp, ChevronRight, X, DollarSign, Edit3 } from 'lucide-react';
import type { Currency } from '../../types';

const GOAL_EMOJIS = ['🎯', '🏠', '🚗', '✈️', '💍', '🎓', '💻', '⛵', '🏔️', '🎸'];

const getDaysRemaining = (targetDate: string) => {
  const [year, month] = targetDate.split('-').map(Number);
  const target = new Date(year, month - 1, 1);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getMonthsRemaining = (targetDate: string) => {
  const [year, month] = targetDate.split('-').map(Number);
  const now = new Date();
  return Math.max(0, (year - now.getFullYear()) * 12 + (month - (now.getMonth() + 1)));
};

const getTrackingStatus = (startDate: string, targetDate: string, currentAmount: number, targetAmount: number) => {
  const [sy, sm] = startDate.split('-').map(Number);
  const [ty, tm] = targetDate.split('-').map(Number);
  const now = new Date();

  const start = new Date(sy, sm - 1, 1);
  const end = new Date(ty, tm - 1, 1);

  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();

  if (totalMs <= 0 || elapsedMs <= 0) return null;

  const timeProgress = Math.min(1, elapsedMs / totalMs);
  const expectedAmount = targetAmount * timeProgress;
  const diff = currentAmount - expectedAmount;
  const diffPct = expectedAmount > 0 ? (diff / expectedAmount) * 100 : 0;

  if (currentAmount >= targetAmount) {
    return { status: 'complete', label: '✅ Meta alcanzada', sub: '', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', expectedAmount, diffPct };
  }
  if (diffPct >= 10) {
    return { status: 'ahead', label: '🚀 Adelantado', sub: `+${diffPct.toFixed(0)}% sobre lo esperado`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', expectedAmount, diffPct };
  }
  if (diffPct >= -10) {
    return { status: 'on-track', label: '✅ En tiempo', sub: 'Vas perfecto, seguí así', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', expectedAmount, diffPct };
  }
  if (diffPct >= -30) {
    return { status: 'behind', label: '⚠️ Atrasado', sub: `${Math.abs(diffPct).toFixed(0)}% por debajo de lo esperado`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', expectedAmount, diffPct };
  }
  return { status: 'critical', label: '🔴 Muy atrasado', sub: `${Math.abs(diffPct).toFixed(0)}% por debajo — revisá tu plan`, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', expectedAmount, diffPct };
};

// Proyecta cuándo terminarás al ritmo mensual actual
const getProjection = (startDate: string, targetDate: string, currentAmount: number, targetAmount: number) => {
  const [sy, sm] = startDate.split('-').map(Number);
  const now = new Date();
  const start = new Date(sy, sm - 1, 1);
  const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

  if (monthsElapsed <= 0 || currentAmount <= 0) return null;

  const monthlyRate = currentAmount / monthsElapsed;
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return null;

  const monthsToFinish = Math.ceil(remaining / monthlyRate);
  const projectedDate = new Date(now.getFullYear(), now.getMonth() + monthsToFinish, 1);
  const projectedStr = projectedDate.toISOString().slice(0, 7);

  // Comparar con targetDate
  const [ty, tm] = targetDate.split('-').map(Number);
  const targetDateObj = new Date(ty, tm - 1, 1);
  const diffMs = targetDateObj.getTime() - projectedDate.getTime();
  const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));

  return {
    projectedDate: projectedStr,
    monthsToFinish,
    diffMonths, // positivo = terminás antes, negativo = terminás después
    monthlyRate,
  };
};

export const GoalModule = () => {
  const { goals, addGoal, updateGoal, updateGoalProgress, deleteGoal, exchangeRates } = useFinanceStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    emoji: '🎯',
    targetAmount: '',
    currency: 'USD' as Currency,
    targetDate: '',
    currentAmount: '',
  });
  const [progressModal, setProgressModal] = useState<{ id: string; name: string; currency: string } | null>(null);
  const [progressAmount, setProgressAmount] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'withdraw'>('add');
  const [modalCurrency, setModalCurrency] = useState<Currency>('USD');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const formatMoney = (val: number, cur: string) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.targetAmount || !form.targetDate) return;
    
    if (editingId) {
      updateGoal(editingId, {
        name: `${form.emoji} ${form.name}`,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount) || 0,
        currency: form.currency,
        targetDate: form.targetDate,
      });
    } else {
      addGoal({
        name: `${form.emoji} ${form.name}`,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount) || 0,
        currency: form.currency,
        targetDate: form.targetDate,
        startDate: new Date().toISOString().slice(0, 7),
      });
    }
    setForm({ name: '', emoji: '🎯', targetAmount: '', currency: 'USD', targetDate: '', currentAmount: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (goal: any) => {
    const parts = goal.name.split(' ');
    const emoji = GOAL_EMOJIS.includes(parts[0]) ? parts[0] : '🎯';
    const name = GOAL_EMOJIS.includes(parts[0]) ? parts.slice(1).join(' ') : goal.name;
    
    setForm({
      name,
      emoji,
      targetAmount: String(goal.targetAmount),
      currency: goal.currency as Currency,
      targetDate: goal.targetDate,
      currentAmount: String(goal.currentAmount),
    });
    setEditingId(goal.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProgress = () => {
    if (!progressModal || !progressAmount || Number(progressAmount) <= 0) return;
    const amount = modalMode === 'withdraw' ? -Number(progressAmount) : Number(progressAmount);
    updateGoalProgress(progressModal.id, amount, modalCurrency, progressNote);
    setProgressModal(null);
    setProgressAmount('');
    setProgressNote('');
  };

  const openModal = (goal: { id: string; name: string; currency: string }, mode: 'add' | 'withdraw') => {
    setProgressModal(goal);
    setModalMode(mode);
    setProgressAmount('');
    setProgressNote('');
    setModalCurrency(goal.currency as Currency);
  };

  const handleDelete = (id: string) => {
    deleteGoal(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
            Objetivos de Ahorro
          </h1>
          <p className="text-text-secondary mt-2 text-lg">Tus sueños con fecha y número. Sin excusas.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(v => !v);
            if (showForm) setEditingId(null);
            if (!showForm && !editingId) setForm({ name: '', emoji: '🎯', targetAmount: '', currency: 'USD', targetDate: '', currentAmount: '' });
          }}
          className="btn btn-primary shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancelar' : 'Nuevo Objetivo'}
        </button>
      </header>

      {/* FORM */}
      {showForm && (
        <Card className="mb-8 border-amber-500/30 bg-amber-500/5 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            {editingId ? <Edit3 size={20} className="text-amber-400" /> : <Target size={20} className="text-amber-400" />}
            {editingId ? 'Editar objetivo' : 'Crear nuevo objetivo'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Emoji picker */}
            <div>
              <label className="form-label">Ícono</label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, emoji: e }))}
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
              <label className="form-label">Nombre del Objetivo</label>
              <input
                required
                type="text"
                className="form-control"
                placeholder="Ej: Auto nuevo, Viaje a Japón..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Monto Meta</label>
                <input
                  required
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={form.targetAmount}
                  onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select
                  className="form-control"
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                >
                  <option value="USD">USD — Dólar</option>
                  <option value="ARS">ARS — Peso Arg.</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Ya ahorré</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={form.currentAmount}
                  onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Objetivo</label>
                <DatePicker value={form.targetDate} onChange={v => setForm(f => ({ ...f, targetDate: v }))} showMonthYearPicker />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2">
              {editingId ? 'Guardar Cambios' : 'Crear Objetivo'}
            </button>
          </form>
        </Card>
      )}

      {goals.length === 0 && !showForm && (
        <div className="text-center py-24 bg-white/3 rounded-2xl border border-dashed border-white/10">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Todavía no tenés objetivos</h3>
          <p className="text-text-secondary mb-6">Ponele fecha a tus sueños. El primer paso es escribirlos.</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={18} className="mr-2 inline" /> Crear mi primer objetivo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map(goal => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const remaining = goal.targetAmount - goal.currentAmount;
          const months = getMonthsRemaining(goal.targetDate);
          const days = getDaysRemaining(goal.targetDate);
          const monthlyNeeded = months > 0 ? remaining / months : remaining;
          const isComplete = progress >= 100;
          const tracking = getTrackingStatus(goal.startDate, goal.targetDate, goal.currentAmount, goal.targetAmount);
          const projection = getProjection(goal.startDate, goal.targetDate, goal.currentAmount, goal.targetAmount);

          // Color accent driven by progress
          const accent = isComplete
            ? { ring: 'border-emerald-500/50', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]', bar: 'bg-emerald-400', text: 'text-emerald-400' }
            : progress > 50
            ? { ring: 'border-amber-500/30', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]', bar: 'bg-amber-400', text: 'text-amber-400' }
            : { ring: 'border-white/10', glow: '', bar: 'bg-indigo-400', text: 'text-indigo-400' };

          return (
            <div
              key={goal.id}
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
                        <Zap size={12} /> {days} días
                      </span>
                    )}
                    {isComplete && <span className="text-emerald-400 font-bold">✅ Completado</span>}
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

                {/* Progress bar + Tracking */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-3xl font-black text-text-primary">
                        {formatMoney(goal.currentAmount, goal.currency)}
                      </span>
                      <span className="text-text-secondary text-sm ml-2">ahorrados</span>
                    </div>
                    <span className="text-text-secondary text-sm font-medium">
                      Meta: <strong className="text-text-primary">{formatMoney(goal.targetAmount, goal.currency)}</strong>
                    </span>
                  </div>

                  {/* Tracking badge */}
                  {tracking && !isComplete && (
                    <div className={`flex flex-col gap-1 mb-3 px-3 py-2 rounded-lg border text-xs ${tracking.bg}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${tracking.color}`}>{tracking.label}</span>
                        <span className="text-text-secondary">{tracking.sub}</span>
                      </div>
                      {projection && (
                        <div className="flex items-center justify-between pt-1 border-t border-white/10">
                          <span className="text-text-secondary">A este ritmo terminarás:</span>
                          <span className={`font-bold ${
                            projection.diffMonths > 0
                              ? 'text-emerald-400'
                              : projection.diffMonths < 0
                              ? 'text-rose-400'
                              : 'text-blue-400'
                          }`}>
                            {projection.projectedDate}
                            {projection.diffMonths > 0 && ` (${projection.diffMonths} mes${projection.diffMonths > 1 ? 'es' : ''} antes 🎉)`}
                            {projection.diffMonths < 0 && ` (${Math.abs(projection.diffMonths)} mes${Math.abs(projection.diffMonths) > 1 ? 'es' : ''} después ⚠️)`}
                            {projection.diffMonths === 0 && ' (justo a tiempo ✅)'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dual progress bar: real (solid) + expected (ghost marker) */}
                  <div className="relative w-full h-3 bg-white/5 rounded-full overflow-visible mb-1">
                    {/* Real progress */}
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${accent.bar}`}
                      style={{ width: `${progress}%` }}
                    />
                    {/* Expected progress marker */}
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
                        Esperado hoy: <strong className="text-text-secondary">{formatMoney(tracking.expectedAmount, goal.currency)}</strong>
                      </span>
                    )}
                    {!tracking && !isComplete && (
                      <span className="text-text-secondary text-xs">Faltan {formatMoney(remaining, goal.currency)}</span>
                    )}
                  </div>
                </div>

              {/* Stats row */}
              {!isComplete && months > 0 && (
                <div className="flex gap-3">
                  <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                    <div className="text-xs text-text-secondary mb-1 flex items-center justify-center gap-1">
                      <TrendingUp size={11} /> Mensual necesario
                    </div>
                    <div className={`text-base font-black ${accent.text}`}>
                      {formatMoney(monthlyNeeded, goal.currency)}
                      {goal.currency !== 'ARS' && (
                        <span className="block text-[10px] text-text-secondary/60 font-normal">
                          ≈ {formatMoney(goal.currency === 'USD' ? monthlyNeeded * exchangeRates.usdToCripto : (monthlyNeeded * exchangeRates.eurToUsd) * exchangeRates.usdToCripto, 'ARS')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                    <div className="text-xs text-text-secondary mb-1 flex items-center justify-center gap-1">
                      <Calendar size={11} /> Meses restantes
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
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-2 font-bold">Resumen de fondos</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {['USD', 'ARS', 'EUR'].map(cur => {
                      const total = goal.history?.filter(h => h.currency === cur).reduce((sum, entry) => sum + entry.amount, 0) || 0;
                      
                      if (total === 0) return null;
                      return (
                        <span key={cur} className="text-xs font-mono font-bold text-text-primary">
                          {formatMoney(total, cur)} <span className="text-text-secondary font-normal opacity-60">en {cur}</span>
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
                  {expandedHistory === goal.id ? 'Ocultar historial' : 'Ver historial de aportes'}
                  <ChevronRight size={12} className={`transition-transform ${expandedHistory === goal.id ? 'rotate-90' : ''}`} />
                </button>

                {expandedHistory === goal.id && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in slide-in-from-top-2">
                    {goal.history?.slice().reverse().map(entry => (
                      <div key={entry.id} className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-text-primary truncate">{entry.note || 'Sin nota'}</p>
                          <p className="text-[10px] text-text-secondary">{new Date(entry.date).toLocaleDateString('es-AR')}</p>
                        </div>
                        <span className={`text-xs font-mono font-bold ${entry.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {entry.amount > 0 ? '+' : ''}{formatMoney(entry.amount, entry.currency)}
                        </span>
                      </div>
                    ))}
                    {(!goal.history || goal.history.length === 0) && (
                      <p className="text-xs text-text-secondary text-center py-4 italic">No hay movimientos registrados</p>
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
                    <DollarSign size={16} className={accent.text} /> Aporte
                    <ChevronRight size={14} className="ml-auto text-text-secondary" />
                  </button>
                  <button
                    onClick={() => openModal({ id: goal.id, name: goal.name, currency: goal.currency }, 'withdraw')}
                    className="btn bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center gap-2 px-4"
                    title="Retirar fondos de emergencia"
                  >
                    <TrendingUp size={16} className="rotate-180" /> Retirar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Aporte / Retiro Modal */}
      {progressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className={`bg-bg-card border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ${
            modalMode === 'add' ? 'border-amber-500/40' : 'border-rose-500/40'
          }`}>
            {/* Header */}
            <div className={`p-4 border-b flex justify-between items-center ${
              modalMode === 'add' ? 'border-amber-500/20 bg-amber-500/5' : 'border-rose-500/20 bg-rose-500/5'
            }`}>
              <div>
                <h3 className="font-bold text-text-primary text-sm">{progressModal.name}</h3>
                {/* mode tabs */}
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => setModalMode('add')}
                    className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                      modalMode === 'add' ? 'bg-amber-500 text-black' : 'text-text-secondary hover:bg-white/10'
                    }`}
                  >
                    + Aporte
                  </button>
                  <button
                    onClick={() => setModalMode('withdraw')}
                    className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                      modalMode === 'withdraw' ? 'bg-rose-500 text-white' : 'text-text-secondary hover:bg-white/10'
                    }`}
                  >
                    - Retiro
                  </button>
                </div>
              </div>
              <button onClick={() => setProgressModal(null)} className="p-1 hover:bg-white/10 rounded-lg text-text-secondary">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-text-secondary mb-4">
                {modalMode === 'add'
                  ? '¿Cuánto sumás al fondo?'
                  : '⚠️ Retiro de emergencia — ¿cuánto retirás?'
                }
              </p>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-xl">$</span>
                  <input
                    autoFocus
                    type="number"
                    className={`form-control pl-10 text-2xl font-bold h-14 ${
                      modalMode === 'add' ? 'border-amber-500/30 focus:border-amber-400' : 'border-rose-500/30 focus:border-rose-400'
                    }`}
                    placeholder="0"
                    value={progressAmount}
                    onChange={e => setProgressAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleProgress()}
                  />
                </div>
                <select
                  className={`w-24 form-control font-bold ${
                    modalMode === 'add' ? 'border-amber-500/30' : 'border-rose-500/30'
                  }`}
                  value={modalCurrency}
                  onChange={e => setModalCurrency(e.target.value as Currency)}
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div className="form-group mb-6">
                <label className="text-xs text-text-secondary font-bold uppercase mb-2 block">Nota / Aclaración (Opcional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Ahorro de aguinaldo, Bono..."
                  value={progressNote}
                  onChange={e => setProgressNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setProgressModal(null)} className="btn border border-white/10 hover:bg-white/5 flex-1">
                  Cancelar
                </button>
                <button
                  onClick={handleProgress}
                  disabled={!progressAmount || Number(progressAmount) <= 0}
                  className={`btn font-bold flex-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                    modalMode === 'add'
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {modalMode === 'add' ? 'Confirmar aporte' : 'Confirmar retiro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        {/* Modal de confirmación de borrado */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <div className="relative bg-bg-card border border-rose-500/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-text-primary text-center mb-3">¿Borrar objetivo?</h3>
              <p className="text-text-secondary text-center mb-8">
                Esta acción es irreversible y se perderá todo el historial de este objetivo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn border border-white/10 hover:bg-white/5 flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="btn bg-rose-600 hover:bg-rose-500 text-white font-bold flex-1"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
