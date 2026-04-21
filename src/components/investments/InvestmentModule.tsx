import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Responsive } from 'react-grid-layout/legacy';
import useMeasure from 'react-use-measure';
import { WidgetShell } from '../ui/WidgetShell';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useFinanceStore } from '../../store/useFinanceStore';
import { 
  TrendingUp, Bitcoin, Building, Layers, Search, Plus, 
  Calculator, LayoutPanelLeft, Check, Wallet, DollarSign, Brain,
  Clock, BarChart3, RefreshCcw
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { projectFuture } from '../../utils/metrics';
import { formatMoney as fm } from '../../utils/finance';
import { useInvestmentData, KPIIconType } from '../../hooks/useInvestmentData';

// Modals
import { OperationModal } from './modals/OperationModal';
import { SettingsModal } from './modals/SettingsModal';
import { CreateAssetModal } from './modals/CreateAssetModal';
import { RebalancerModal } from './modals/RebalancerModal';

import type { InvestmentCategory } from '../../types';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const ICONS: Record<InvestmentCategory, React.ReactNode> = {
  'FCI': <TrendingUp size={18} />,
  'Cripto': <Bitcoin size={18} />,
  'ONs Dólar': <Building size={18} />,
  'CEDEARs': <Layers size={18} />,
  'Acciones Arg': <TrendingUp size={18} />,
  'Otro': <TrendingUp size={18} />
};

const KPI_ICONS: Record<KPIIconType, React.ReactNode> = {
  wallet: <Wallet size={20} />,
  dollar: <DollarSign size={20} />,
  trending: <TrendingUp size={20} />,
  brain: <Brain size={20} />,
  strategies: <Layers size={20} />,
  clock: <Clock size={20} />,
  chart: <BarChart3 size={20} />
};

export const InvestmentModule = () => {
  const { t } = useTranslation();
  const { 
    addInvestment, updateInvestmentCurrent, injectInvestment, 
    withdrawInvestment, deleteInvestment, updateInvestmentLayout, 
    toggleInvestmentWidgetVisibility, rebaseAllInvestments
  } = useFinanceStore();

  const [ref, bounds] = useMeasure();
  const [activeModal, setActiveModal] = useState<'none' | 'inject' | 'withdraw' | 'assistant' | 'create' | 'm2m' | 'settings'>('none');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkPrices, setBulkPrices] = useState<Record<string, string>>({});

  const { 
    investments, filteredInvestments, sortedByCurrent, 
    totals, kpis, investmentWidgets, portfolioTWRR 
  } = useInvestmentData(searchTerm);

  const [projMonthly, setProjMonthly] = useState('0');
  const [projRate, setProjRate] = useState(portfolioTWRR ? (portfolioTWRR * 100).toFixed(1) : '15');

  const selectedAsset = investments.find(inv => inv.id === selectedAssetId);

  // ── Handlers ───────────────────────────────────────────────────
  const handleOpenModal = (type: typeof activeModal, id?: string) => {
    if (id) setSelectedAssetId(id);
    setActiveModal(type);
  };

  const handleCloseModal = () => {
    setActiveModal('none');
    setSelectedAssetId(null);
  };

  const handleOperationConfirm = (amount: number, cryptoAmount?: number, newTotalValue?: number) => {
    if (!selectedAsset) return;
    if (activeModal === 'inject') injectInvestment(selectedAsset.id, amount, cryptoAmount, newTotalValue);
    if (activeModal === 'withdraw') withdrawInvestment(selectedAsset.id, amount, cryptoAmount, newTotalValue);
    if (activeModal === 'm2m') updateInvestmentCurrent(selectedAsset.id, amount);
    handleCloseModal();
  };

  const handleStartBulk = () => {
    const prices: Record<string, string> = {};
    investments.forEach(inv => { prices[inv.id] = String(inv.current); });
    setBulkPrices(prices);
    setIsBulkUpdating(true);
  };

  const handleSaveBulk = () => {
    Object.entries(bulkPrices).forEach(([id, price]) => {
      const inv = investments.find(i => i.id === id);
      if (inv && Number(price) !== inv.current) updateInvestmentCurrent(id, Number(price));
    });
    setIsBulkUpdating(false);
    setBulkPrices({});
  };

  const handleRebase = () => {
    if (window.confirm(t('investments.rebase.confirm'))) {
      rebaseAllInvestments();
    }
  };

  const handleLayoutChange = (current: any) => {
    if (editMode) {
      const updated = investmentWidgets.map((w: any) => {
        const match = (current as any[]).find((c: any) => c.i === w.id);
        return match ? { ...w, x: match.x, y: match.y, w: match.w, h: match.h } : w;
      });
      updateInvestmentLayout(updated);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            {t('investments.title')}
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-text-secondary font-medium opacity-60">{t('investments.subtitle')}</p>
            {editMode && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20 animate-pulse">
                {t('dashboard.editMode')}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {isBulkUpdating ? (
            <>
              <button className="btn border border-white/10 text-text-secondary hover:bg-white/5" onClick={() => { setIsBulkUpdating(false); setBulkPrices({}); }}>{t('common.cancel')}</button>
              <button className="btn-primary px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 text-white" onClick={handleSaveBulk}>Guardar todo</button>
            </>
          ) : (
            <>
              <button className="btn border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2 rounded-2xl px-5 py-3" onClick={handleStartBulk}>
                <TrendingUp size={18} /> {t('investments.bulkUpdate')}
              </button>
              <button 
                className="btn border border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 flex items-center gap-2 rounded-2xl px-5 py-3" 
                onClick={handleRebase}
                title={t('investments.rebase.title')}
              >
                <RefreshCcw size={18} /> {t('investments.rebase.button')}
              </button>
              <button className="btn bg-white/5 text-text-primary hover:bg-white/10 border border-white/5 flex items-center gap-2 rounded-2xl px-5 py-3" onClick={() => handleOpenModal('assistant')}>
                <Calculator size={18} /> {t('investments.assistant')}
              </button>
              <button 
                className={`btn flex items-center gap-2 rounded-2xl px-5 py-3 border transition-all duration-300 ${editMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'}`} 
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? <Check size={18} /> : <LayoutPanelLeft size={18} />}
                {editMode ? t('investments.finish') : t('investments.editLayout')}
              </button>
              <button className="btn-primary shadow-xl shadow-indigo-600/20 flex items-center gap-2 rounded-2xl px-6 py-3 font-black text-white" onClick={() => handleOpenModal('create')}>
                <Plus size={18} /> {t('investments.newAsset')}
              </button>
            </>
          )}
        </div>
      </header>

      <div ref={ref} className="min-h-[1000px]">
        <Responsive
          className="layout"
          layouts={{ lg: investmentWidgets.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h })) }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          width={bounds.width || 1200}
          draggableHandle=".drag-handle"
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          margin={[24, 24]}
        >
          {/* KPIs */}
          <div key="portfolio-kpis">
            <WidgetShell 
              id={t('investments.title')} editMode={editMode} 
              visible={investmentWidgets.find(w => w.id === 'portfolio-kpis')?.visible ?? true}
              onToggle={() => toggleInvestmentWidgetVisibility('portfolio-kpis')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full p-6">
                {kpis.map((kpi, idx) => (
                  <div key={idx} className={`relative rounded-[32px] p-8 border border-white/5 flex flex-col justify-center overflow-hidden ${kpi.bg}`}>
                    <div className="absolute top-4 right-4 opacity-10 text-text-primary">{KPI_ICONS[kpi.iconId] || <TrendingUp size={20} />}</div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${kpi.color}`}>{kpi.label}</p>
                    <h2 className="text-4xl font-black text-text-primary tracking-tighter">{kpi.value}</h2>
                    <div className="flex items-center justify-between mt-2">
                       <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">{kpi.sub}</p>
                       {kpi.extra && (
                         <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${kpi.extra.status === 'better' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                           {kpi.extra.label}
                         </span>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </WidgetShell>
          </div>

          {/* Wealth Projection */}
          <div key="wealth-projection">
             <WidgetShell 
              id={t('investments.projection.title')} editMode={editMode} 
              visible={investmentWidgets.find(w => w.id === 'wealth-projection')?.visible ?? true}
              onToggle={() => toggleInvestmentWidgetVisibility('wealth-projection')}
            >
              <div className="h-full bg-bg-surface border border-white/5 p-10 rounded-[40px] overflow-hidden relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[40px] blur-xl opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-text-primary flex items-center gap-3 tracking-tighter">
                      <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><TrendingUp size={24} /></div>
                      {t('investments.projection.title')}
                    </h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t('investments.projection.monthly')}</label>
                    <input type="number" className="form-control h-14 px-6 text-lg font-black bg-white/5 border-white/10 rounded-2xl" value={projMonthly} onChange={e => setProjMonthly(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">{t('investments.projection.annualRate')}</label>
                    <input type="number" step="0.1" className="form-control h-14 px-6 text-lg font-black bg-white/5 border-white/10 rounded-2xl" value={projRate} onChange={e => setProjRate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t('investments.projection.initial')}</label>
                    <div className="h-14 px-6 flex items-center font-black text-lg bg-white/5 border border-white/5 rounded-2xl opacity-40">{fm(totals.totalCurrent, 'USD')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                  {[
                    { label: '1 Mes', months: 1, color: 'text-blue-400' },
                    { label: '1 Año', months: 12, color: 'text-emerald-400' },
                    { label: '2 Años', months: 24, color: 'text-purple-400' },
                    { label: '5 Años', months: 60, color: 'text-orange-400' }
                  ].map((period) => (
                    <div key={period.label} className="bg-white/[0.03] p-6 rounded-[24px] border border-white/5 hover:bg-white/[0.05] transition-colors group/tile">
                      <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-2 opacity-60 group-hover/tile:opacity-100 transition-opacity">{period.label}</div>
                      <div className={`text-2xl font-black tracking-tighter ${period.color}`}>
                        {fm(projectFuture(totals.totalCurrent, Number(projMonthly), Number(projRate), period.months), 'USD')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </WidgetShell>
          </div>

          {/* Composition */}
          <div key="asset-composition">
            <WidgetShell 
              id="Distribución y composición" editMode={editMode} 
              visible={investmentWidgets.find(w => w.id === 'asset-composition')?.visible ?? true}
              onToggle={() => toggleInvestmentWidgetVisibility('asset-composition')}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full p-8 bg-bg-surface border border-white/5 rounded-[32px]">
                <div className="flex flex-col items-center justify-center relative min-h-[300px]">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={sortedByCurrent} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="currentUSD" stroke="none">
                        {sortedByCurrent.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => fm(value, 'USD')} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '16px', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pointer-events-none">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Total USD</p>
                    <p className="text-3xl font-black text-text-primary tracking-tighter">{fm(totals.totalCurrent, 'USD')}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                    {sortedByCurrent.map((inv, index) => (
                      <div key={inv.id} className="flex flex-col gap-2 group">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <p className="text-sm font-black text-text-primary tracking-tight">{inv.name}</p>
                          </div>
                          <p className="text-[10px] font-bold text-text-secondary opacity-60">≈ {fm(inv.currentUSD, 'USD')}</p>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(inv.currentUSD / (totals.totalCurrent || 1)) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </WidgetShell>
          </div>

          {/* Table */}
          <div key="asset-table">
            <WidgetShell 
              id={t('investments.list.title')} editMode={editMode} 
              visible={investmentWidgets.find(w => w.id === 'asset-table')?.visible ?? true}
              onToggle={() => toggleInvestmentWidgetVisibility('asset-table')}
            >
              <div className="space-y-6 h-full flex flex-col">
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={20} />
                  <input 
                    type="text" placeholder={t('investments.list.filter')} 
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[24px] py-6 pl-14 pr-6 text-lg font-bold outline-none focus:border-indigo-500/30 transition-all"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="bg-bg-surface border border-white/5 rounded-[32px] overflow-hidden shadow-xl flex-1">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] border-b border-white/5">
                          <th className="px-8 py-6">{t('investments.list.asset')}</th>
                          <th className="px-8 py-6 text-right">{t('investments.list.invested')}</th>
                          <th className="px-8 py-6 text-right">{t('investments.list.current')}</th>
                          <th className="px-8 py-6 text-right">{t('investments.list.performance')}</th>
                          <th className="px-8 py-6 text-center">{t('investments.list.management')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredInvestments.map(inv => {
                          const gain = inv.current - inv.invested;
                          const pct = inv.invested > 0 ? (gain / inv.invested) * 100 : 0;
                          const isProfitable = gain >= 0;
                          return (
                            <tr key={inv.id} className="hover:bg-white/[0.04] transition-all group/row">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10 group-hover/row:border-indigo-500/30 transition-all">
                                    {ICONS[inv.category] || ICONS['Otro']}
                                  </div>
                                  <div>
                                    <div className="font-black text-text-primary text-base flex items-center gap-2">
                                      {inv.name}
                                      {inv.cryptoSymbol && <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-lg">{inv.cryptoSymbol}</span>}
                                    </div>
                                    <span className="text-[10px] font-black text-text-secondary uppercase opacity-40">{inv.strategy}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-right font-black text-text-secondary opacity-60 text-sm">{fm(inv.invested, inv.currency)}</td>
                              <td className="px-8 py-5 text-right">
                                {isBulkUpdating ? (
                                  <input 
                                    type="number" className="w-24 bg-white/5 border border-indigo-500/30 text-right rounded-lg px-2 py-1 text-sm font-black" 
                                    value={bulkPrices[inv.id] || ''} onChange={e => setBulkPrices({ ...bulkPrices, [inv.id]: e.target.value })}
                                  />
                                ) : (
                                  <div className="font-black text-text-primary text-lg">{inv.category === 'Cripto' ? `${inv.cryptoAmount?.toFixed(4)} ${inv.cryptoSymbol}` : fm(inv.current, inv.currency)}</div>
                                )}
                              </td>
                              <td className={`px-8 py-5 text-right font-black text-lg ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isProfitable ? '+' : ''}{fm(gain, inv.currency)}
                                <div className="text-[10px] opacity-60">({pct.toFixed(2)}%)</div>
                              </td>
                              <td className="px-8 py-5">
                                <div className={`flex justify-center gap-2 ${isBulkUpdating ? 'opacity-20 pointer-events-none' : ''}`}>
                                  {['m2m', 'inject', 'withdraw', 'settings'].map((m: any) => (
                                    <button key={m} className={`p-3 rounded-xl hover:-translate-y-0.5 transition-all bg-white/5 border border-white/5 text-text-secondary`} onClick={() => handleOpenModal(m, inv.id)}>
                                      {m === 'm2m' && <TrendingUp size={16} />}
                                      {m === 'inject' && <TrendingUp size={16} className="rotate-90" />}
                                      {m === 'withdraw' && <TrendingUp size={16} className="-rotate-90" />}
                                      {m === 'settings' && <Plus size={16} className="rotate-45" />}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </WidgetShell>
          </div>
        </Responsive>
      </div>

      {/* Modals */}
      {(activeModal === 'inject' || activeModal === 'withdraw' || activeModal === 'm2m') && selectedAsset && (
        <OperationModal type={activeModal} asset={selectedAsset} onClose={handleCloseModal} onConfirm={handleOperationConfirm} />
      )}
      {activeModal === 'settings' && selectedAsset && (
        <SettingsModal asset={selectedAsset} onClose={handleCloseModal} onDelete={deleteInvestment} categoryIcons={ICONS} />
      )}
      {activeModal === 'create' && (
        <CreateAssetModal onClose={handleCloseModal} onConfirm={addInvestment} />
      )}
      {activeModal === 'assistant' && (
        <RebalancerModal onClose={handleCloseModal} />
      )}
    </div>
  );
};
