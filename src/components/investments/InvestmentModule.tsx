import React, { useState, useMemo } from 'react';
import { Responsive } from 'react-grid-layout/legacy';
import useMeasure from 'react-use-measure';
import { WidgetShell } from '../ui/WidgetShell';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useFinanceStore } from '../../store/useFinanceStore';
import { TrendingUp, Bitcoin, Building, Layers, Search, Plus, Upload, Download, Settings, X, Calculator, Trash2, DollarSign, Brain, Wallet, LayoutPanelLeft, Check } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateAssetTWRR, projectFuture } from '../../utils/metrics';
import { PortfolioRebalancer } from './sections/PortfolioRebalancer';
import type { InvestmentCategory, InvestmentStrategy, Currency } from '../../types';

export const InvestmentModule = () => {
  const { 
    investments, exchangeRates, addInvestment, 
    updateInvestmentCurrent, injectInvestment, withdrawInvestment, 
    deleteInvestment, investmentWidgets, updateInvestmentLayout, toggleInvestmentWidgetVisibility 
  } = useFinanceStore();

  const [ref, bounds] = useMeasure();
  const [activeModal, setActiveModal] = useState<'none' | 'inject' | 'withdraw' | 'assistant' | 'create' | 'm2m' | 'settings'>('none');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [modalAmount, setModalAmount] = useState('');
  const [modalCryptoAmount, setModalCryptoAmount] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkPrices, setBulkPrices] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const formatMoney = (val: number, cur: string) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);
  };

  const rateCripto = exchangeRates?.usdToCripto || 1290;
  const rateEur = exchangeRates?.eurToUsd || 1.08;

  const toUSD = (amount: number, cur: string): number => {
    if (cur === 'USD') return amount;
    if (cur === 'ARS') return amount / rateCripto;
    if (cur === 'EUR') return amount * rateEur;
    return amount;
  };

  const icons: Record<InvestmentCategory, React.ReactNode> = {
    'FCI': <TrendingUp size={18} />,
    'Cripto': <Bitcoin size={18} />,
    'ONs Dólar': <Building size={18} />,
    'CEDEARs': <Layers size={18} />,
    'Acciones Arg': <TrendingUp size={18} />,
    'Otro': <TrendingUp size={18} />
  };

  // KPIs (All converted to USD for aggregate metrics)
  const totalInvested = investments.reduce((acc, inv) => acc + toUSD(inv.invested, inv.currency), 0);
  const totalCurrent = investments.reduce((acc, inv) => acc + toUSD(inv.current, inv.currency), 0);
  const totalGain = totalCurrent - totalInvested;
  const totalPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Chart Data (Use USD values for proper sorting and proportion)
  const sortedByCurrent = [...investments]
    .map(inv => ({ ...inv, currentUSD: toUSD(inv.current, inv.currency) }))
    .sort((a, b) => b.currentUSD - a.currentUSD);
  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

  const portfolioTWRR = useMemo(() => {
    let weightedAnnualTwrr = 0;
    let totalWeightUSD = 0;
    let hasValidData = false;

    investments.forEach(inv => {
      const { annualTwrr } = calculateAssetTWRR(inv.history);
      if (annualTwrr !== null) {
        const invUSD = toUSD(inv.current, inv.currency);
        weightedAnnualTwrr += annualTwrr * invUSD;
        totalWeightUSD += invUSD;
        hasValidData = true;
      }
    });

    return hasValidData && totalWeightUSD > 0 ? weightedAnnualTwrr / totalWeightUSD : null;
  }, [investments, toUSD]);

  const [projMonthly, setProjMonthly] = useState('0');
  const [projRate, setProjRate] = useState(portfolioTWRR ? (portfolioTWRR * 100).toFixed(1) : '15');

  const handleOpenModal = (type: 'inject' | 'withdraw' | 'm2m' | 'settings', id: string) => {
      setSelectedAssetId(id);
      setActiveModal(type);
      if (type === 'm2m') {
          const inv = investments.find(i => i.id === id);
          setModalAmount(inv ? String(inv.current) : '');
      } else {
          setModalAmount('');
      }
      setModalCryptoAmount('');
  };

  const handleCloseModal = () => {
      setActiveModal('none');
      setSelectedAssetId(null);
  };

  const handleOpenAssistant = () => {
      setActiveModal('assistant');
  };

  const selectedAsset = investments.find(inv => inv.id === selectedAssetId);
  const isCryptoModal = selectedAsset?.category === 'Cripto';

  const handleConfirmAction = () => {
      if (!selectedAssetId) return;
      const amountNum = Number(modalAmount);
      const cryptoAmountNum = Number(modalCryptoAmount);

      if (activeModal === 'inject') {
          injectInvestment(selectedAssetId, amountNum, cryptoAmountNum || undefined);
      } else if (activeModal === 'withdraw') {
          withdrawInvestment(selectedAssetId, amountNum, cryptoAmountNum || undefined);
      } else if (activeModal === 'm2m') {
          updateInvestmentCurrent(selectedAssetId, amountNum);
      }
      handleCloseModal();
  };

  const handleDeleteAsset = () => {
      if (!selectedAssetId) return;
      if (window.confirm('¿Estás seguro de que querés eliminar este activo? Esta acción no se puede deshacer.')) {
          deleteInvestment(selectedAssetId);
          handleCloseModal();
      }
  };

  const handleSaveBulk = () => {
    Object.entries(bulkPrices).forEach(([id, price]) => {
      const inv = investments.find(i => i.id === id);
      if (inv && Number(price) !== inv.current) {
        updateInvestmentCurrent(id, Number(price));
      }
    });
    setIsBulkUpdating(false);
    setBulkPrices({});
  };

  const handleStartBulk = () => {
    const prices: Record<string, string> = {};
    investments.forEach(inv => {
      prices[inv.id] = String(inv.current);
    });
    setBulkPrices(prices);
    setIsBulkUpdating(true);
  };


  // Form state for new asset
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

  const handleAddInvestment = () => {
    if (!newAsset.name || !newAsset.invested) return;
    
    addInvestment({
      name: newAsset.name,
      category: newAsset.category,
      strategy: newAsset.strategy,
      invested: Number(newAsset.invested),
      current: Number(newAsset.current) || Number(newAsset.invested),
      currency: newAsset.currency,
      cryptoSymbol: newAsset.category === 'Cripto' ? newAsset.cryptoSymbol : undefined,
      cryptoAmount: newAsset.category === 'Cripto' ? Number(newAsset.cryptoAmount) : undefined,
    });
    
    setNewAsset({
      name: '',
      category: 'CEDEARs' as InvestmentCategory,
      strategy: 'Renta Variable Global' as InvestmentStrategy,
      invested: '',
      current: '',
      currency: 'USD' as Currency,
      cryptoSymbol: '',
      cryptoAmount: ''
    });
    setActiveModal('none');
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
            Portfolio
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-text-secondary font-medium opacity-60">
              Gestión de capital y análisis de rendimiento avanzado.
            </p>
            {editMode && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20 animate-pulse">
                  Modo Edición
                </span>
              )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
            {isBulkUpdating ? (
                <>
                    <button className="btn border border-white/10 text-text-secondary hover:bg-white/5" onClick={() => { setIsBulkUpdating(false); setBulkPrices({}); }}>
                        Cancelar
                    </button>
                    <button className="btn-primary px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20" onClick={handleSaveBulk}>
                        Guardar Todo
                    </button>
                </>
            ) : (
                <>
                    <button className="btn border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2 rounded-2xl px-5 py-3" onClick={handleStartBulk}>
                        <TrendingUp size={18} /> Actualización Lote
                    </button>
                    <button className="btn bg-white/5 text-text-primary hover:bg-white/10 border border-white/5 flex items-center gap-2 rounded-2xl px-5 py-3" onClick={handleOpenAssistant}>
                        <Calculator size={18} /> Asistente
                    </button>
                    <button 
                        className={`btn flex items-center gap-2 rounded-2xl px-5 py-3 border transition-all duration-300 ${editMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'}`} 
                        onClick={() => setEditMode(!editMode)}
                    >
                        {editMode ? <Check size={18} /> : <LayoutPanelLeft size={18} />}
                        {editMode ? 'Finalizar' : 'Editar Layout'}
                    </button>
                    <button className="btn-primary shadow-xl shadow-indigo-600/20 flex items-center gap-2 rounded-2xl px-6 py-3 font-black" onClick={() => setActiveModal('create')}>
                        <Plus size={18} /> Nuevo Activo
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
              id="KPIs de Portfolio" 
              editMode={editMode} 
              visible={investmentWidgets.find(w => w.id === 'portfolio-kpis')?.visible ?? true}
              onToggle={() => toggleInvestmentWidgetVisibility('portfolio-kpis')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full p-6">
                <div className="relative bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 rounded-[32px] p-8 shadow-[0_0_40px_rgba(99,102,241,0.15)] overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-4 right-4 opacity-10 text-indigo-300"><DollarSign size={80} /></div>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Patrimonio Total</p>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-text-primary tracking-tighter">{formatMoney(totalCurrent, 'USD')}</h2>
                    <div className="flex flex-col gap-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">
                      <span className="flex items-center gap-1"><span className="w-1 h-1 bg-indigo-400 rounded-full"></span> {formatMoney(totalCurrent * rateCripto, 'ARS')} ARS</span>
                      <span className="flex items-center gap-1"><span className="w-1 h-1 bg-purple-400 rounded-full"></span> {formatMoney(totalCurrent / rateEur, 'EUR')} EUR</span>
                    </div>
                  </div>
                </div>

                <div className="bg-bg-surface border border-white/5 rounded-[32px] p-8 flex flex-col justify-center">
                  <p className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Ganancia Neta</p>
                  <div className="flex items-center gap-4">
                    <h2 className={`text-4xl font-black tracking-tighter ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalGain >= 0 ? '+' : ''}{formatMoney(totalGain, 'USD')}
                    </h2>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full ${totalGain >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {totalPct >= 0 ? '+' : ''}{totalPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="bg-bg-surface border border-white/5 rounded-[32px] p-8 relative overflow-hidden group flex flex-col justify-center">
                  <div className="absolute top-4 right-4 opacity-5 text-purple-400 group-hover:scale-110 transition-transform duration-700"><Brain size={60} /></div>
                  <p className="text-xs font-black text-purple-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                    <Brain size={14} className="animate-pulse" /> Rendimiento Real
                  </p>
                  <h2 className="text-4xl font-black text-text-primary mt-2 tracking-tighter">
                    {portfolioTWRR !== null ? `${portfolioTWRR >= 0 ? '+' : ''}${(portfolioTWRR * 100).toFixed(2)}%` : '-- %'}
                  </h2>
                  <p className="text-[10px] text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-50">
                    {portfolioTWRR !== null ? 'Ponderado TWRR Anual' : 'Sin datos (+30d)'}
                  </p>
                </div>

                <div className="bg-bg-surface border border-white/5 rounded-[32px] p-8 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-10 text-indigo-400"><Wallet size={60} /></div>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.15em] mb-4">Capital Invertido</p>
                  <h2 className="text-4xl font-black text-text-primary tracking-tighter">{formatMoney(totalInvested, 'USD')}</h2>
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500/40 w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </WidgetShell>
          </div>

          {/* Wealth Projection */}
          <div key="wealth-projection">
             <WidgetShell 
              id="Proyección de Riqueza" 
              editMode={editMode} 
              visible={investmentWidgets.find(w => w.id === 'wealth-projection')?.visible ?? true}
              onToggle={() => toggleInvestmentWidgetVisibility('wealth-projection')}
            >
              <div className="h-full bg-bg-surface border border-white/5 p-10 rounded-[40px] overflow-hidden relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[40px] blur-xl opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-text-primary flex items-center gap-3 tracking-tighter">
                      <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><TrendingUp size={24} /></div>
                      Proyección de Riqueza
                    </h3>
                    <p className="text-sm text-text-secondary font-medium opacity-60 max-w-xl">
                      Simulá el crecimiento de tu capital basándote en tu rendimiento real (TWA) o una tasa personalizada.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Aporte Mensual (USD)</label>
                    <input type="number" className="form-control h-14 px-6 text-lg font-black bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50" value={projMonthly} onChange={e => setProjMonthly(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">Tasa Anual Estimada (%)</label>
                    <div className="relative">
                       <input type="number" step="0.1" className="form-control h-14 px-6 text-lg font-black bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50" value={projRate} onChange={e => setProjRate(e.target.value)} />
                       {portfolioTWRR !== null && (
                         <button 
                          onClick={() => setProjRate((portfolioTWRR * 100).toFixed(1))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-500/40 transition-all border border-indigo-500/30"
                         >
                           USAR MI TWA
                         </button>
                       )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Capital Inicial (Actual)</label>
                    <div className="h-14 px-6 flex items-center font-black text-lg bg-white/5 border border-white/5 rounded-2xl opacity-40">
                      {formatMoney(totalCurrent, 'USD')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                  {[
                    { label: 'En 1 Mes', months: 1, color: 'text-blue-400' },
                    { label: 'En 1 Año', months: 12, color: 'text-emerald-400' },
                    { label: 'En 2 Años', months: 24, color: 'text-purple-400' },
                    { label: 'En 5 Años', months: 60, color: 'text-orange-400' }
                  ].map((period) => (
                    <div key={period.label} className="bg-white/[0.03] p-6 rounded-[24px] border border-white/5 hover:bg-white/[0.05] transition-colors group/tile">
                      <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-2 opacity-60 group-hover/tile:opacity-100 transition-opacity">{period.label}</div>
                      <div className={`text-2xl font-black tracking-tighter ${period.color}`}>
                        {formatMoney(projectFuture(totalCurrent, Number(projMonthly), Number(projRate), period.months), 'USD')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </WidgetShell>
          </div>

          {/* Composition & Legend */}
          <div key="asset-composition">
            <WidgetShell 
              id="Distribución y Composición" 
              editMode={editMode} 
              visible={investmentWidgets.find(w => w.id === 'asset-composition')?.visible ?? true}
              onToggle={() => toggleInvestmentWidgetVisibility('asset-composition')}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full p-8 bg-bg-surface border border-white/5 rounded-[32px]">
                <div className="flex flex-col items-center justify-center relative min-h-[300px]">
                  <p className="absolute top-0 left-0 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Distribución de Activos</p>
                  <div className="w-full h-full pt-8">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={sortedByCurrent}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="currentUSD"
                          stroke="none"
                        >
                          {sortedByCurrent.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => formatMoney(value, 'USD')} 
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                          itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pointer-events-none">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Total USD</p>
                    <p className="text-3xl font-black text-text-primary tracking-tighter">{formatMoney(totalCurrent, 'USD')}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-6">Composición Detallada (%)</p>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                    {sortedByCurrent.map((inv, index) => (
                      <div key={inv.id} className="flex flex-col gap-2 group cursor-pointer">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <p className="text-sm font-black text-text-primary tracking-tight">{inv.name}</p>
                          </div>
                          <p className="text-[10px] font-bold text-text-secondary opacity-60">≈ {formatMoney(inv.currentUSD, 'USD')}</p>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 group-hover:brightness-125" 
                            style={{ 
                              width: `${(inv.currentUSD / totalCurrent) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </WidgetShell>
          </div>

          {/* Search & Table */}
          <div key="asset-table">
            <WidgetShell 
              id="Listado de Activos" 
              editMode={editMode} 
              visible={investmentWidgets.find(w => w.id === 'asset-table')?.visible ?? true}
              onToggle={() => toggleInvestmentWidgetVisibility('asset-table')}
            >
              <div className="space-y-6 h-full">
                <div className="group">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:opacity-100 group-focus-within:text-indigo-400 transition-all" size={20} />
                    <input 
                      type="text" 
                      placeholder="Filtrar activos por nombre, ticker o estrategia..." 
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[24px] py-6 pl-14 pr-6 text-lg font-bold placeholder:opacity-30 outline-none focus:bg-white/5 focus:border-indigo-500/30 transition-all shadow-inner tracking-tight"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-bg-surface border border-white/5 rounded-[32px] overflow-hidden shadow-xl shadow-black/20 h-full flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] border-b border-white/5">
                          <th className="px-8 py-6">Activo / Estrategia</th>
                          <th className="px-8 py-6 text-right">Invertido</th>
                          <th className="px-8 py-6 text-right">Valor Actual</th>
                          <th className="px-8 py-6 text-right">Rendimiento Total</th>
                          <th className="px-8 py-6 text-center whitespace-nowrap">Gestión</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {investments
                          .filter(inv => 
                            inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            inv.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            inv.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (inv.cryptoSymbol && inv.cryptoSymbol.toLowerCase().includes(searchTerm.toLowerCase()))
                          )
                          .map(inv => {
                            const gain = inv.current - inv.invested;
                            const pct = inv.invested > 0 ? (gain / inv.invested) * 100 : 0;
                            const isProfitable = gain >= 0;
                            const colorClass = isProfitable ? 'text-emerald-400' : 'text-rose-400';
                            const sign = isProfitable ? '+' : '';
                            const isCrypto = inv.category === 'Cripto' && inv.cryptoSymbol;

                            return (
                              <tr key={inv.id} className="hover:bg-white/[0.04] transition-all group/row">
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10 group-hover/row:border-indigo-500/30 group-hover/row:bg-indigo-500/10 transition-all">
                                      {icons[inv.category] || icons['Otro']}
                                    </div>
                                    <div>
                                      <div className="font-black text-text-primary text-base flex items-center gap-2">
                                          {inv.name}
                                          {isCrypto && <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-lg">{inv.cryptoSymbol}</span>}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-40">{inv.category}</span>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-text-secondary uppercase tracking-widest border border-white/5">{inv.strategy}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <div className="font-black text-text-secondary opacity-60 text-sm tracking-tight">{formatMoney(inv.invested, inv.currency)}</div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  {isBulkUpdating ? (
                                      <div className="relative max-w-[140px] ml-auto">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-black text-xs">$</span>
                                          <input 
                                              type="number" 
                                              className="form-control h-10 pl-6 text-sm font-black bg-white/5 border-indigo-500/30 text-right rounded-xl focus:ring-2 focus:ring-indigo-500/50" 
                                              value={bulkPrices[inv.id] || ''} 
                                              onChange={e => setBulkPrices({ ...bulkPrices, [inv.id]: e.target.value })}
                                          />
                                      </div>
                                  ) : (
                                      <div className="space-y-0.5">
                                        {isCrypto ? (
                                          <div className="font-black text-text-primary text-lg tracking-tighter">{inv.cryptoAmount?.toLocaleString('es-AR', {maximumFractionDigits: 6})} {inv.cryptoSymbol}</div>
                                        ) : (
                                          <div className="font-black text-text-primary text-lg tracking-tighter">{formatMoney(inv.current, inv.currency)}</div>
                                        )}
                                        <div className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Valor de Mercado</div>
                                      </div>
                                  )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <div className="space-y-0.5">
                                    <div className={`font-black text-lg tracking-tighter ${colorClass}`}>{sign}{formatMoney(gain, inv.currency)}</div>
                                    <div className="flex items-center justify-end gap-2">
                                      <span className={`${colorClass} text-[10px] font-black border border-current/20 px-2 py-0.5 rounded-full bg-current/5`}>{sign}{pct.toFixed(2)}%</span>
                                      {(() => {
                                        const { annualTwrr } = calculateAssetTWRR(inv.history);
                                        if (annualTwrr !== null) {
                                          return <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">TWA: {(annualTwrr * 100).toFixed(1)}%</span>;
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className={`flex justify-center gap-2 ${isBulkUpdating ? 'opacity-20 pointer-events-none' : ''}`}>
                                        <button className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-text-secondary transition-all hover:-translate-y-0.5" title="Cotización Manual" onClick={() => handleOpenModal('m2m', inv.id)}>
                                            <TrendingUp size={16} />
                                        </button>
                                        <button className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl hover:bg-emerald-500/10 text-emerald-400 transition-all hover:-translate-y-0.5" title="Inyectar Capital" onClick={() => handleOpenModal('inject', inv.id)}>
                                            <Upload size={16} />
                                        </button>
                                        <button className="p-3 border border-rose-500/20 bg-rose-500/5 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-all hover:-translate-y-0.5" title="Retirar Capital" onClick={() => handleOpenModal('withdraw', inv.id)}>
                                            <Download size={16} />
                                        </button>
                                        <button className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-text-secondary transition-all hover:-translate-y-0.5" title="Ajustes" onClick={() => handleOpenModal('settings', inv.id)}>
                                            <Settings size={16} />
                                        </button>
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

      {/* Operation Modals (Inject/Withdraw/M2M) */}
      {activeModal !== 'none' && (activeModal === 'inject' || activeModal === 'withdraw' || activeModal === 'm2m') && selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className={`bg-bg-surface border w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative ${activeModal === 'inject' ? 'border-emerald-500/30' : activeModal === 'm2m' ? 'border-indigo-500/30' : 'border-rose-500/30'}`}>
                <div className={`p-8 border-b flex justify-between items-center ${activeModal === 'inject' ? 'border-emerald-500/10 bg-emerald-500/5' : activeModal === 'm2m' ? 'border-indigo-500/10 bg-indigo-500/5' : 'border-rose-500/10 bg-rose-500/5'}`}>
                    <h3 className="text-2xl font-black flex items-center gap-3 text-text-primary tracking-tighter">
                        {activeModal === 'inject' && <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><Upload size={24}/></div>}
                        {activeModal === 'withdraw' && <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400"><Download size={24}/></div>}
                        {activeModal === 'm2m' && <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><TrendingUp size={24}/></div>}
                        {activeModal === 'inject' ? 'Inyectar Capital' : activeModal === 'withdraw' ? 'Retirar Capital' : 'Actualizar Valor'}
                    </h3>
                    <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full text-text-secondary transition-all"><X size={24} /></button>
                </div>
                <div className="p-10">
                    <p className="text-text-secondary font-medium mb-8">
                        {activeModal === 'inject' ? 'Abonar fondos a ' : activeModal === 'withdraw' ? 'Liquidar fondos de ' : 'Actualizar valor de mercado de '}
                        <strong className="text-text-primary text-lg font-black">{selectedAsset.name}</strong>.
                    </p>

                    <div className="space-y-8">
                      {(activeModal === 'inject' || activeModal === 'withdraw') && isCryptoModal && (
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Cantidad — {selectedAsset.cryptoSymbol}</label>
                              <div className="relative">
                                  <input 
                                      type="number" 
                                      className="form-control h-16 px-6 text-2xl font-black bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50" 
                                      placeholder="0.00"
                                      value={modalCryptoAmount}
                                      onChange={e => setModalCryptoAmount(e.target.value)}
                                  />
                                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-400 opacity-40">
                                      <Bitcoin size={28} />
                                  </div>
                              </div>
                          </div>
                      )}

                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">
                              {activeModal === 'm2m' ? 'Nuevo Valor de Mercado' : `Equivalente en ${selectedAsset.currency}`}
                          </label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  className="form-control h-16 px-10 text-2xl font-black bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50" 
                                  placeholder="0.00"
                                  value={modalAmount}
                                  onChange={e => setModalAmount(e.target.value)}
                              />
                              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary font-black text-xl opacity-40">$</div>
                          </div>
                          {activeModal === 'm2m' && (
                              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-40 mt-3">
                                  * El sistema recalculará el rendimiento basado en este valor.
                              </p>
                          )}
                      </div>
                    </div>

                    <div className="flex gap-4 justify-end mt-12">
                        <button onClick={handleCloseModal} className="px-8 py-4 rounded-2xl font-black text-sm bg-white/5 text-text-primary hover:bg-white/10 border border-white/5 transition-all">Cancelar</button>
                        <button onClick={handleConfirmAction} className={`px-10 py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all active:scale-95 ${activeModal === 'inject' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : activeModal === 'm2m' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'}`}>
                            {activeModal === 'm2m' ? 'Actualizar' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-white/10 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl text-text-secondary">
                  <Settings size={22}/>
                </div>
                <h3 className="text-xl font-black text-text-primary tracking-tighter">Ajustes de Activo</h3>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full text-text-secondary transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                   {icons[selectedAsset.category] || icons['Otro']}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-text-primary tracking-tighter">{selectedAsset.name}</h4>
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">{selectedAsset.category} • {selectedAsset.strategy}</p>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-6">Zona de Peligro</h5>
                <button 
                  onClick={handleDeleteAsset}
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
               <button onClick={handleCloseModal} className="px-8 py-3 rounded-2xl font-black text-sm bg-white/5 text-text-primary hover:bg-white/10 border border-white/5 transition-all">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Asset Modal */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-indigo-500/30 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                  <Plus size={22}/>
                </div>
                <h3 className="text-xl font-black text-text-primary tracking-tighter">Nuevo Activo</h3>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full text-text-secondary transition-all"><X size={24} /></button>
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
                <button onClick={handleCloseModal} className="px-8 py-4 rounded-2xl font-black text-sm bg-white/5 text-text-primary hover:bg-white/10 border border-white/5 transition-all">Cancelar</button>
                <button 
                  onClick={handleAddInvestment} 
                  disabled={!newAsset.name || !newAsset.invested}
                  className="px-10 py-4 rounded-2xl font-black text-sm btn-primary shadow-xl shadow-indigo-600/20 disabled:opacity-20 active:scale-95 transition-all"
                >
                  Crear Activo
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Rebalancer Modal */}
      {activeModal === 'assistant' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 p-6">
            <div className="bg-bg-surface border border-white/10 w-full max-w-6xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                        <Calculator size={24}/>
                      </div>
                      <h3 className="text-2xl font-black text-text-primary tracking-tighter">Portfolio Rebalancer</h3>
                    </div>
                    <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full text-text-secondary transition-all"><X size={28} /></button>
                </div>
                
                <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                    <PortfolioRebalancer />
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end">
                    <button onClick={handleCloseModal} className="px-10 py-4 rounded-[24px] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                        Cerrar Asistente
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
