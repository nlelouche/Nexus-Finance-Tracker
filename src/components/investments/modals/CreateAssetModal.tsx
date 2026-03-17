import React, { useState } from 'react';
import { X, Plus, Bitcoin } from 'lucide-react';
import { InvestmentCategory, InvestmentStrategy, Currency } from '../../../types';

interface CreateAssetModalProps {
  onClose: () => void;
  onConfirm: (asset: any) => void;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({ 
  onClose, onConfirm 
}) => {
  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'CEDEARs' as InvestmentCategory,
    strategy: 'Renta Variable Global' as InvestmentStrategy,
    invested: '',
    current: '',
    currency: 'USD' as Currency,
    cryptoSymbol: '',
    cryptoAmount: ''
  });

  const handleConfirm = () => {
    if (!newAsset.name || !newAsset.invested) return;
    
    onConfirm({
      ...newAsset,
      invested: parseFloat(newAsset.invested as string) || 0,
      current: parseFloat(newAsset.current as string) || (parseFloat(newAsset.invested as string) || 0),
      cryptoAmount: parseFloat(newAsset.cryptoAmount as string) || 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-bg-surface border border-indigo-500/30 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative">
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
              <Plus size={22}/>
            </div>
            <h3 className="text-xl font-black text-text-primary tracking-tighter">Nuevo Activo</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-text-secondary transition-all"><X size={24} /></button>
        </div>
        <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Nombre del Activo</label>
            <input 
              type="text" 
              className="form-control h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl" 
              placeholder="Ej: SPY, Bitcoin, Galicia..."
              value={newAsset.name}
              onChange={e => setNewAsset({...newAsset, name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Categoría</label>
              <select 
                className="form-control h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl"
                value={newAsset.category}
                onChange={e => setNewAsset({...newAsset, category: e.target.value as InvestmentCategory})}
              >
                <option value="CEDEARs">CEDEARs</option>
                <option value="FCI">FCI</option>
                <option value="Acciones Arg">Acciones Arg</option>
                <option value="ONs Dólar">ONs Dólar</option>
                <option value="Cripto">Cripto</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Estrategia</label>
              <select 
                className="form-control h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl"
                value={newAsset.strategy}
                onChange={e => setNewAsset({...newAsset, strategy: e.target.value as InvestmentStrategy})}
              >
                <option value="Renta Variable Global">Renta Variable Global</option>
                <option value="Renta Variable AR">Renta Variable AR</option>
                <option value="Renta Fija USD">Renta Fija USD</option>
                <option value="Renta Fija Pesos">Renta Fija Pesos</option>
                <option value="Renta Mixta">Renta Mixta</option>
                <option value="Cripto">Cripto</option>
                <option value="Otro / No Asignada">Otro / No Asignada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Costo Total Invertido</label>
              <input 
                type="number" 
                className="form-control h-14 px-6 font-black text-xl bg-white/5 border-white/10 rounded-2xl" 
                placeholder="0.00"
                value={newAsset.invested}
                onChange={e => setNewAsset({...newAsset, invested: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Moneda</label>
              <select 
                className="form-control h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl"
                value={newAsset.currency}
                onChange={e => setNewAsset({...newAsset, currency: e.target.value as Currency})}
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Valor Actual (Opcional)</label>
            <input 
              type="number" 
              className="form-control h-14 px-6 font-bold bg-white/5 border-white/10 rounded-2xl" 
              placeholder="Si está vacío, se usa el de costo"
              value={newAsset.current}
              onChange={e => setNewAsset({...newAsset, current: e.target.value})}
            />
          </div>

          {newAsset.category === 'Cripto' && (
            <div className="grid grid-cols-2 gap-6 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/20 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">Ticker (BTC)</label>
                <input 
                  type="text" 
                  className="form-control h-12 px-4 font-black bg-white/5 border-white/10 rounded-xl" 
                  placeholder="BTC"
                  value={newAsset.cryptoSymbol}
                  onChange={e => setNewAsset({...newAsset, cryptoSymbol: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">Cantidad</label>
                <input 
                  type="number" 
                  className="form-control h-12 px-4 font-black bg-white/5 border-white/10 rounded-xl" 
                  placeholder="0.000000"
                  value={newAsset.cryptoAmount}
                  onChange={e => setNewAsset({...newAsset, cryptoAmount: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>
        <div className="p-10 border-t border-white/5 bg-white/[0.01] flex gap-4 justify-end">
            <button onClick={onClose} className="px-8 py-4 rounded-2xl font-black text-sm bg-white/5 text-text-primary hover:bg-white/10 border border-white/5 transition-all">Cancelar</button>
            <button 
              onClick={handleConfirm} 
              disabled={!newAsset.name || !newAsset.invested}
              className="px-10 py-4 rounded-2xl font-black text-sm btn-primary shadow-xl shadow-indigo-600/20 disabled:opacity-20 active:scale-95 transition-all text-white"
            >
              Crear Activo
            </button>
        </div>
      </div>
    </div>
  );
};
