import React from 'react';
import { X, Settings, Trash2 } from 'lucide-react';
import { Investment, InvestmentCategory } from '../../../types';

interface SettingsModalProps {
  asset: Investment;
  onClose: () => void;
  onDelete: (id: string) => void;
  categoryIcons: Record<InvestmentCategory, React.ReactNode>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  asset, onClose, onDelete, categoryIcons 
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-bg-surface border border-white/10 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative">
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-2xl text-text-secondary">
              <Settings size={22}/>
            </div>
            <h3 className="text-xl font-black text-text-primary tracking-tighter">Ajustes de Activo</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-text-secondary transition-all"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
               {categoryIcons[asset.category] || categoryIcons['Otro']}
            </div>
            <div>
              <h4 className="text-2xl font-black text-text-primary tracking-tighter">{asset.name}</h4>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">{asset.category} • {asset.strategy}</p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-6">Zona de Peligro</h5>
            <button 
              onClick={() => {
                if (window.confirm(`¿Estás seguro de que querés eliminar ${asset.name}?`)) {
                  onDelete(asset.id);
                  onClose();
                }
              }}
              className="w-full py-5 rounded-[24px] bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-black text-sm flex items-center justify-center gap-3"
            >
              <Trash2 size={20} /> Eliminar Permanentemente
            </button>
            <p className="text-[10px] text-text-secondary mt-4 text-center font-bold opacity-40">
               Se borrará todo el historial de este activo y sus rendimientos asociados.
            </p>
          </div>
        </div>
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end">
           <button onClick={onClose} className="px-8 py-3 rounded-2xl font-black text-sm bg-white/5 text-text-primary hover:bg-white/10 border border-white/5 transition-all">Cerrar</button>
        </div>
      </div>
    </div>
  );
};
