import React, { useState } from 'react';
import { X, Upload, Download, TrendingUp, Bitcoin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Investment } from '../../../types';

interface OperationModalProps {
  type: 'inject' | 'withdraw' | 'm2m';
  asset: Investment;
  onClose: () => void;
  onConfirm: (amount: number, cryptoAmount?: number) => void;
}

export const OperationModal: React.FC<OperationModalProps> = ({ 
  type, asset, onClose, onConfirm 
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');

  const isCrypto = asset.category === 'Cripto' && asset.cryptoSymbol;

  const handleConfirm = () => {
    const numAmount = parseFloat(amount) || 0;
    const numCrypto = parseFloat(cryptoAmount) || 0;
    onConfirm(numAmount, numCrypto);
    onClose();
  };

  const colors = {
    inject: 'border-emerald-500/30 border-emerald-500/10 bg-emerald-500/5 text-emerald-400 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20',
    withdraw: 'border-rose-500/30 border-rose-500/10 bg-rose-500/5 text-rose-400 bg-rose-600 hover:bg-rose-500 shadow-rose-500/20',
    m2m: 'border-indigo-500/30 border-indigo-500/10 bg-indigo-500/5 text-indigo-400 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
  };

  const activeColor = colors[type];
  const [borderColor, headerColor, headerIconColor, submitColor] = activeColor.split(' ');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`bg-bg-surface border w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative ${borderColor}`}>
        <div className={`p-8 border-b flex justify-between items-center ${headerColor}`}>
          <h3 className="text-2xl font-black flex items-center gap-3 text-text-primary tracking-tighter">
            {type === 'inject' && <div className={`p-2 rounded-xl bg-emerald-500/20 ${headerIconColor}`}><Upload size={24}/></div>}
            {type === 'withdraw' && <div className={`p-2 rounded-xl bg-rose-500/20 ${headerIconColor}`}><Download size={24}/></div>}
            {type === 'm2m' && <div className={`p-2 rounded-xl bg-indigo-500/20 ${headerIconColor}`}><TrendingUp size={24}/></div>}
            {t(`investments.operation.${type}.title`)}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-text-secondary transition-all"><X size={24} /></button>
        </div>
        <div className="p-10">
          <p className="text-text-secondary font-medium mb-8">
            {t(`investments.operation.${type}.desc`)}{' '}
            <strong className="text-text-primary text-lg font-black">{asset.name}</strong>.
          </p>

          <div className="space-y-8">
            {(type === 'inject' || type === 'withdraw') && isCrypto && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Cantidad — {asset.cryptoSymbol}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="form-control h-16 px-6 text-2xl font-black bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50" 
                    placeholder="0.00"
                    value={cryptoAmount}
                    onChange={e => setCryptoAmount(e.target.value)}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-400 opacity-40">
                    <Bitcoin size={28} />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">
                {type === 'm2m' ? t('investments.operation.m2m.label') : `${t('investments.operation.amount')} ${asset.currency}`}
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  className="form-control h-16 px-10 text-2xl font-black bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50" 
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary font-black text-xl opacity-40">$</div>
              </div>
              {type === 'm2m' && (
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-40 mt-3">
                  {t('investments.operation.m2m.tip')}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-end mt-12">
            <button onClick={onClose} className="px-8 py-4 rounded-2xl font-black text-sm bg-white/5 text-text-primary hover:bg-white/10 border border-white/5 transition-all">{t('common.cancel')}</button>
            <button onClick={handleConfirm} className={`px-10 py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all active:scale-95 ${submitColor}`}>
              {type === 'm2m' ? t('investments.operation.update') : t('investments.operation.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
