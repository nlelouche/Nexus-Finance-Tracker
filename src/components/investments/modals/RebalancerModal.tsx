import React from 'react';
import { X, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PortfolioRebalancer } from '../sections/PortfolioRebalancer';

interface RebalancerModalProps {
  onClose: () => void;
}

export const RebalancerModal: React.FC<RebalancerModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 p-6">
      <div className="bg-bg-surface border border-white/10 w-full max-w-6xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
              <Calculator size={24}/>
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tighter">{t('investments.rebalancer.title')}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-text-secondary transition-all"><X size={28} /></button>
        </div>
        
        <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
          <PortfolioRebalancer />
        </div>

        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end">
          <button onClick={onClose} className="px-10 py-4 rounded-[24px] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
            {t('investments.rebalancer.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
