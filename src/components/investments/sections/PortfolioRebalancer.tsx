import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../ui';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { calculateRebalance } from '../../../utils/rebalancer';
import { formatMoney } from '../../../utils/finance';
import { Activity, Percent, ArrowUpCircle, ArrowDownCircle, MinusCircle, Edit3, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const PortfolioRebalancer = () => {
  const { t } = useTranslation();
  const { investments, allocationTargets, updateAllocationTargets, exchangeRates } = useFinanceStore();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTargets, setDraftTargets] = useState(allocationTargets);

  const rebalanceData = useMemo(() => 
    calculateRebalance(investments, allocationTargets, exchangeRates),
  [investments, allocationTargets, exchangeRates]);

  const totalCurrentUSD = rebalanceData.reduce((sum, item) => sum + item.currentUSD, 0);
  const totalAllocation = Object.values(draftTargets).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    if (totalAllocation !== 100) return;
    updateAllocationTargets(draftTargets);
    setIsEditing(false);
  };

  const chartData = rebalanceData.map(item => ({
    name: item.category,
    Actual: Number(item.currentPercentage.toFixed(1)),
    Objetivo: item.targetPercentage
  }));

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black tracking-tight text-text-primary">{t('investments.rebalancer.title')}</h3>
          <p className="text-sm text-text-secondary mt-1">{t('investments.rebalancer.subtitle')}</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={isEditing && totalAllocation !== 100}
          className={`btn flex items-center gap-2 transition-all ${isEditing ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-white/5 hover:bg-white/10'}`}
        >
          {isEditing ? <><Save size={18}/> {t('investments.rebalancer.save')}</> : <><Edit3 size={18}/> {t('investments.rebalancer.adjust')}</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gráfico Comparativo */}
        <Card className="lg:col-span-8 h-[400px]">
          <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary mb-6">{t('investments.rebalancer.chartTitle')}</h4>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Objetivo" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Panel de Edición / Status */}
        <Card className="lg:col-span-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary">{t('investments.rebalancer.strategy')}</h4>
            {isEditing && (
               <span className={`text-xs font-black px-2 py-1 rounded ${totalAllocation === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {totalAllocation}%
               </span>
            )}
          </div>

          <div className="space-y-4">
            {Object.entries(isEditing ? draftTargets : allocationTargets).map(([cat, pct]) => (
              <div key={cat} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-text-primary">{cat}</span>
                  {isEditing ? (
                    <div className="relative">
                      <input 
                        type="number"
                        className="w-16 bg-white/5 border border-white/10 rounded-lg p-1 text-right text-sm font-mono focus:border-indigo-500 outline-none"
                        value={pct}
                        onChange={(e) => setDraftTargets({...draftTargets, [cat]: Number(e.target.value)})}
                      />
                      <Percent size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-text-secondary" />
                    </div>
                  ) : (
                    <span className="text-sm font-black text-indigo-400">{pct}%</span>
                  )}
                </div>
                {!isEditing && (
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isEditing && (
             <div className="mt-8 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase font-bold tracking-tight">
                  {t('investments.rebalancer.totalPortfolio')}: <span className="text-indigo-400">{formatMoney(totalCurrentUSD, 'USD')}</span>
                </p>
             </div>
          )}
        </Card>
      </div>

      {/* Sugerencias de Acción */}
      <section>
        <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2">
          <Activity size={16} /> {t('investments.rebalancer.recommendations')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rebalanceData.map((res) => (
            <div 
              key={res.category} 
              className={`p-5 rounded-3xl border transition-all duration-300 ${
                res.action === 'buy' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' :
                res.action === 'sell' ? 'bg-rose-500/5 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.05)]' :
                'bg-white/3 border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h5 className="font-black text-lg">{res.category}</h5>
                  <p className="text-xs text-text-secondary">{t('investments.rebalancer.deviation')}: <span className={res.action !== 'hold' ? 'font-bold text-text-primary' : ''}>{(res.currentPercentage - res.targetPercentage).toFixed(1)}%</span></p>
                </div>
                {res.action === 'buy' && <ArrowUpCircle className="text-emerald-400" size={24} />}
                {res.action === 'sell' && <ArrowDownCircle className="text-rose-400" size={24} />}
                {res.action === 'hold' && <MinusCircle className="text-text-secondary opacity-50" size={24} />}
              </div>

              <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="flex-1">
                   <div className="text-[10px] font-black uppercase text-text-secondary opacity-50 mb-1">
                    {res.action === 'buy' ? t('investments.rebalancer.buySuggestion') : res.action === 'sell' ? t('investments.rebalancer.sellSuggestion') : t('investments.rebalancer.holdSuggestion')}
                   </div>
                   <div className={`text-xl font-black font-mono ${res.action === 'buy' ? 'text-emerald-400' : res.action === 'sell' ? 'text-rose-400' : 'text-text-secondary opacity-50'}`}>
                    {res.action === 'hold' ? '--' : formatMoney(Math.abs(res.diffUSD), 'USD')}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
