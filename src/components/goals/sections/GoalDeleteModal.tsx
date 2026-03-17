import React from 'react';
import { Trash2 } from 'lucide-react';

interface GoalDeleteModalProps {
  deleteConfirm: string | null;
  setDeleteConfirm: (id: string | null) => void;
  handleDelete: (id: string) => void;
}

export const GoalDeleteModal: React.FC<GoalDeleteModalProps> = ({
  deleteConfirm,
  setDeleteConfirm,
  handleDelete,
}) => {
  if (!deleteConfirm) return null;

  return (
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
  );
};
