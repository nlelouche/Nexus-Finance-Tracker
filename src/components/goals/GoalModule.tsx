import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFinanceStore } from '../../store/useFinanceStore';
import type { Currency, Goal } from '../../types';
import { GOAL_EMOJIS } from '../../utils/goals';
import { GoalCard } from './sections/GoalCard';
import { GoalForm } from './sections/GoalForm';
import { GoalProgressModal } from './sections/GoalProgressModal';
import { GoalDeleteModal } from './sections/GoalDeleteModal';

export const GoalModule = () => {
  const { t } = useTranslation();
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

  const handleEdit = (goal: Goal) => {
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
            {t('goals.title')}
          </h1>
          <p className="text-text-secondary mt-2 text-lg">{t('goals.subtitle')}</p>
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
          {showForm ? t('common.cancel') : t('goals.newGoal')}
        </button>
      </header>

      {showForm && (
        <GoalForm 
          editingId={editingId} 
          form={form} 
          setForm={setForm} 
          handleSubmit={handleSubmit} 
        />
      )}

      {goals.length === 0 && !showForm && (
        <div className="text-center py-24 bg-white/3 rounded-2xl border border-dashed border-white/10">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">{t('goals.empty.title')}</h3>
          <p className="text-text-secondary mb-6">{t('goals.empty.subtitle')}</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={18} className="mr-2 inline" /> {t('goals.empty.button')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map(goal => (
          <GoalCard 
            key={goal.id}
            goal={goal}
            exchangeRates={exchangeRates}
            handleEdit={handleEdit}
            setDeleteConfirm={setDeleteConfirm}
            openModal={openModal}
            expandedHistory={expandedHistory}
            setExpandedHistory={setExpandedHistory}
          />
        ))}
      </div>

      <GoalProgressModal 
        progressModal={progressModal}
        setProgressModal={setProgressModal}
        modalMode={modalMode}
        setModalMode={setModalMode}
        progressAmount={progressAmount}
        setProgressAmount={setProgressAmount}
        modalCurrency={modalCurrency}
        setModalCurrency={setModalCurrency}
        progressNote={progressNote}
        setProgressNote={setProgressNote}
        handleProgress={handleProgress}
      />

      <GoalDeleteModal 
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        handleDelete={handleDelete}
      />
    </div>
  );
};
