import React from 'react';
import { X } from 'lucide-react';
import { Currency } from '../../../types';

interface GoalProgressModalProps {
  progressModal: { id: string; name: string; currency: string } | null;
  setProgressModal: (val: any) => void;
  modalMode: 'add' | 'withdraw';
  setModalMode: (mode: 'add' | 'withdraw') => void;
  progressAmount: string;
  setProgressAmount: (val: string) => void;
  modalCurrency: Currency;
  setModalCurrency: (cur: Currency) => void;
  progressNote: string;
  setProgressNote: (val: string) => void;
  handleProgress: () => void;
}

export const GoalProgressModal: React.FC<GoalProgressModalProps> = ({
  progressModal,
  setProgressModal,
  modalMode,
  setModalMode,
  progressAmount,
  setProgressAmount,
  modalCurrency,
  setModalCurrency,
  progressNote,
  setProgressNote,
  handleProgress,
}) => {
  if (!progressModal) return null;

  return (
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
  );
};
