import React, { useState, useMemo } from 'react';
import { Card } from '../ui';
import { useFinanceStore } from '../../store/useFinanceStore';
import { TrendingUp, Bitcoin, Building, Layers, Search, Plus, Upload, Download, Settings, X, Calculator, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateAssetTWRR, projectFuture } from '../../utils/metrics';
import { PortfolioRebalancer } from './sections/PortfolioRebalancer';
import type { InvestmentCategory, InvestmentStrategy, Currency } from '../../types';

export const InvestmentModule = () => {
  const { investments, updateInvestmentCurrent, injectInvestment, withdrawInvestment, addInvestment, deleteInvestment, exchangeRates } = useFinanceStore();

  const [activeModal, setActiveModal] = useState<'none' | 'inject' | 'withdraw' | 'assistant' | 'create' | 'm2m' | 'settings'>('none');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [modalAmount, setModalAmount] = useState('');
  const [modalCryptoAmount, setModalCryptoAmount] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkPrices, setBulkPrices] = useState<Record<string, string>>({});

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


  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 drop-shadow-sm">
            Inversiones & Fondos
          </h1>
          <p className="text-text-secondary mt-2 text-lg">Rendimiento de tu capital avanzado.</p>
        </div>
        <div className="flex gap-2">
            {isBulkUpdating ? (
                <>
                    <button className="btn border border-white/10 text-text-secondary hover:bg-white/5 transition-colors" onClick={() => { setIsBulkUpdating(false); setBulkPrices({}); }}>
                        Cancelar
                    </button>
                    <button className="btn bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all font-bold" onClick={handleSaveBulk}>
                        Guardar Todo
                    </button>
                </>
            ) : (
                <>
                    <button className="btn border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2 transition-colors" onClick={handleStartBulk}>
                        <TrendingUp size={18} /> Actualización por Lote
                    </button>
                    <button className="btn bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-2 transition-colors" onClick={handleOpenAssistant}>
                        <Calculator size={18} /> Asistente de Aportes
                    </button>
                    <button className="btn btn-primary shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center gap-2" onClick={() => setActiveModal('create')}>
                        <Plus size={18} /> Nuevo Activo
                    </button>
                </>
            )}
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-slate-700">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Patrimonio Total</p>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-text-primary">{formatMoney(totalCurrent, 'USD')}</h2>
            <div className="flex flex-col gap-0.5 text-xs font-mono text-text-secondary">
              <span>≈ {formatMoney(totalCurrent * rateCripto, 'ARS')}</span>
              <span>≈ {formatMoney(totalCurrent / rateEur, 'EUR')}</span>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
           <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Ganancia Neta (Simple)</p>
           <div className="flex items-end gap-2 mt-2">
             <h2 className={`text-3xl font-bold ${totalGain >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
               {totalGain >= 0 ? '+' : ''}{formatMoney(totalGain, 'USD')}
             </h2>
             <span className={`text-sm font-bold px-2 py-1 rounded mb-1 ${totalGain >= 0 ? 'text-accent-green bg-emerald-500/10' : 'text-accent-red bg-rose-500/10'}`}>
               {totalPct >= 0 ? '+' : ''}{totalPct.toFixed(2)}%
             </span>
           </div>
        </Card>
        <Card className="border-l-4 border-l-purple-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Rendimiento Real (TWA)</p>
          <h2 className="text-3xl font-bold text-purple-400 mt-2">
            {portfolioTWRR !== null ? `${portfolioTWRR >= 0 ? '+' : ''}${(portfolioTWRR * 100).toFixed(2)}%` : '-- %'}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {portfolioTWRR !== null ? 'Tasa anual ponderada (TWRR)' : 'Requiere más historial (>30 días)'}
          </p>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Capital Invertido</p>
          <h2 className="text-3xl font-bold text-text-primary mt-2">{formatMoney(totalInvested, 'USD')}</h2>
        </Card>
      </div>

      {/* Proyeccion */}
      <Card className="mb-8 p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none"></div>
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="text-indigo-400" size={24} /> Proyección a Futuro
        </h3>
        <p className="text-sm text-text-secondary mb-6 max-w-2xl">
          Usando tu rendimiento real ponderado (TWA), calculá cuánto tendrías si mantenés un ritmo constante de aportes mensuales o usá una tasa manual.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="form-label">Capital Base</label>
            <input type="text" className="form-control font-bold text-text-primary bg-white/5 border-white/5 opacity-80" value={formatMoney(totalCurrent, 'USD')} disabled />
          </div>
          <div>
            <label className="form-label">Aporte Mensual</label>
            <input type="number" className="form-control font-bold text-indigo-100" value={projMonthly} onChange={e => setProjMonthly(e.target.value)} />
          </div>
          <div>
            <label className="form-label text-indigo-300">Tasa Anual (%)</label>
            <div className="relative">
               <input type="number" step="0.1" className="form-control font-bold" value={projRate} onChange={e => setProjRate(e.target.value)} />
               {portfolioTWRR !== null && (
                 <button 
                  onClick={() => setProjRate((portfolioTWRR * 100).toFixed(1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/40 transition-colors"
                  title="Usar mi rendimiento real actual"
                 >
                   Usar TWA
                 </button>
               )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-white/5 pt-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
            <div className="text-xs text-text-secondary font-bold uppercase mb-1">En 1 Mes</div>
            <div className="text-lg font-bold text-blue-400">{formatMoney(projectFuture(totalCurrent, Number(projMonthly), Number(projRate), 1), 'USD')}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
            <div className="text-xs text-text-secondary font-bold uppercase mb-1">En 1 Año</div>
            <div className="text-xl font-bold text-emerald-400">{formatMoney(projectFuture(totalCurrent, Number(projMonthly), Number(projRate), 12), 'USD')}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
            <div className="text-xs text-text-secondary font-bold uppercase mb-1">En 2 Años</div>
            <div className="text-xl font-bold text-purple-400">{formatMoney(projectFuture(totalCurrent, Number(projMonthly), Number(projRate), 24), 'USD')}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
            <div className="text-xs text-text-secondary font-bold uppercase mb-1">En 5 Años</div>
            <div className="text-2xl font-bold text-orange-400">{formatMoney(projectFuture(totalCurrent, Number(projMonthly), Number(projRate), 60), 'USD')}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Doughnut Chart */}
        <Card className="lg:col-span-5 h-[400px] flex flex-col items-center justify-center relative">
            <h3 className="font-bold text-text-primary mb-2 text-sm w-full text-left absolute top-6 left-6">Distribución Visual</h3>
            <div className="w-full h-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedByCurrent}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="currentUSD"
                    stroke="none"
                  >
                    {sortedByCurrent.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatMoney(value, 'USD')} 
                    contentStyle={{ backgroundColor: 'rgba(3,3,3,0.8)', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute pointer-events-none flex flex-col items-center justify-center">
                <span className="text-sm text-text-secondary font-bold">Total</span>
                <span className="text-xl font-bold text-text-primary">{formatMoney(totalCurrent, 'USD')}</span>
            </div>
        </Card>

        {/* Custom Legend Scrolleable */}
        <Card className="lg:col-span-7 h-[400px] flex flex-col">
            <h3 className="font-bold text-text-primary mb-4 text-sm">Detalle de Composición (%)</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {sortedByCurrent.map((a, i) => {
                    const pct = totalCurrent > 0 ? ((a.currentUSD / totalCurrent) * 100).toFixed(1) : 0;
                    return (
                        <div key={a.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg border border-white/5 transition-colors group cursor-pointer">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                <div className="truncate">
                                    <div className="font-bold text-text-primary truncate">{a.name}</div>
                                    <div className="text-xs text-text-secondary truncate">{a.category} • {a.strategy}</div>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                                <div className="font-mono font-bold text-text-primary">{formatMoney(a.current, a.currency)}</div>
                                <div className="text-[10px] text-text-secondary font-mono">≈ {formatMoney(a.currentUSD, 'USD')}</div>
                                <div className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded inline-block mt-1">{pct}%</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Buscar activo por nombre..." 
            className="form-control pl-10 w-full"
          />
        </div>
      </div>

      <Card className="overflow-hidden p-0 mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-xs text-text-secondary uppercase border-b border-white/10">
                <th className="px-6 py-4 font-semibold">Activo</th>
                <th className="px-6 py-4 text-right font-semibold">Invertido</th>
                <th className="px-6 py-4 text-right font-semibold">Actual</th>
                <th className="px-6 py-4 text-right font-semibold">Rendimiento</th>
                <th className="px-6 py-4 text-center font-semibold">Operar</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {investments.map(inv => {
                const gain = inv.current - inv.invested;
                const pct = inv.invested > 0 ? (gain / inv.invested) * 100 : 0;
                const isProfitable = gain >= 0;
                const colorClass = isProfitable ? 'text-accent-green' : 'text-accent-red';
                const sign = isProfitable ? '+' : '';
                const isCrypto = inv.category === 'Cripto' && inv.cryptoSymbol;

                return (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg text-indigo-400">
                           {icons[inv.category] || icons['Otro']}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary flex items-center gap-2">
                              {inv.name}
                              {isCrypto && <span className="text-text-secondary font-normal text-xs px-1.5 py-0.5 bg-white/5 rounded">({inv.cryptoSymbol})</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-text-secondary">{inv.category}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-primary/70">{inv.strategy}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-text-secondary">{formatMoney(inv.invested, inv.currency)}</td>
                    <td className="px-6 py-4 text-right">
                       {isBulkUpdating ? (
                           <div className="relative max-w-[120px] ml-auto">
                               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-xs">$</span>
                               <input 
                                   type="number" 
                                   className="form-control h-8 pl-5 text-sm font-bold bg-white/5 border-indigo-500/30 text-right" 
                                   value={bulkPrices[inv.id] || ''} 
                                   onChange={e => setBulkPrices({ ...bulkPrices, [inv.id]: e.target.value })}
                               />
                           </div>
                       ) : isCrypto ? (
                           <>
                           <div className="font-mono font-bold text-text-primary text-lg">{inv.cryptoAmount?.toLocaleString('es-AR', {maximumFractionDigits: 6})} {inv.cryptoSymbol}</div>
                           <div className="font-mono text-text-secondary text-sm">{formatMoney(inv.current, inv.currency)}</div>
                           </>
                       ) : (
                          <div className="font-mono font-bold text-text-primary text-lg">{formatMoney(inv.current, inv.currency)}</div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${colorClass}`}>{sign}{formatMoney(gain, inv.currency)}</div>
                      <div className={`text-xs ${colorClass} font-semibold mb-1`}>{sign}{pct.toFixed(2)}%</div>
                      {(() => {
                        const { annualTwrr, isShortPeriod } = calculateAssetTWRR(inv.history);
                        if (annualTwrr !== null) {
                           const aColor = annualTwrr >= 0 ? 'text-indigo-400' : 'text-rose-400';
                           return <div className={`text-xs font-mono font-bold ${aColor}`} title="Tasa de Crecimiento Anual Compuesta Histórica">TCA: {(annualTwrr * 100).toFixed(1)}%</div>;
                        } else if (isShortPeriod) {
                           return <div className="text-[10px] text-text-secondary mt-1">⏳ &lt;30 días mod.</div>;
                        }
                        return null;
                      })()}
                    </td>
                    <td className="px-6 py-4">
                        <div className={`flex justify-center gap-2 ${isBulkUpdating ? 'opacity-20 pointer-events-none' : ''}`}>
                            <button className="p-2 border border-white/10 rounded-lg hover:bg-white/10 text-text-secondary transition-colors" title="Cotización Manual (M2M)" onClick={() => handleOpenModal('m2m', inv.id)}>
                                <TrendingUp size={16} />
                            </button>
                            <button className="p-2 border border-emerald-500/20 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Inyectar Capital" onClick={() => handleOpenModal('inject', inv.id)}>
                                <Upload size={16} />
                            </button>
                            <button className="p-2 border border-rose-500/20 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors" title="Retirar Capital" onClick={() => handleOpenModal('withdraw', inv.id)}>
                                <Download size={16} />
                            </button>
                            <button className="p-2 border border-white/10 rounded-lg hover:bg-white/10 text-text-secondary transition-colors" title="Ajustes" onClick={() => handleOpenModal('settings', inv.id)}>
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
      </Card>

      {/* Operation Modals (Inject/Withdraw/M2M) */}
      {activeModal !== 'none' && (activeModal === 'inject' || activeModal === 'withdraw' || activeModal === 'm2m') && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-bg-card border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${activeModal === 'inject' ? 'border-emerald-500/50' : activeModal === 'm2m' ? 'border-indigo-500/50' : 'border-rose-500/50'}`}>
                <div className={`p-4 border-b flex justify-between items-center ${activeModal === 'inject' ? 'border-emerald-500/20 bg-emerald-500/5' : activeModal === 'm2m' ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                    <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                        {activeModal === 'inject' && <Upload size={20} className="text-emerald-400"/>}
                        {activeModal === 'withdraw' && <Download size={20} className="text-rose-400"/>}
                        {activeModal === 'm2m' && <TrendingUp size={20} className="text-indigo-400"/>}
                        {activeModal === 'inject' ? 'Inyectar Capital' : activeModal === 'withdraw' ? 'Retirar Capital' : 'Actualizar Cotización (M2M)'}
                    </h3>
                    <button onClick={handleCloseModal} className="p-1 hover:bg-white/10 rounded-lg text-text-secondary transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6">
                    <p className="text-text-secondary text-sm mb-6">
                        {activeModal === 'inject' ? 'Agregar fondos a ' : activeModal === 'withdraw' ? 'Retirar fondos de ' : 'Actualizar el valor de mercado de '}
                        <strong className="text-text-primary">{selectedAsset.name}</strong>.
                    </p>

                    {(activeModal === 'inject' || activeModal === 'withdraw') && isCryptoModal && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Cantidad en {selectedAsset.cryptoSymbol}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Bitcoin className="text-text-secondary" size={16} />
                                </div>
                                <input 
                                    type="number" 
                                    className="form-control pl-10 text-lg font-bold" 
                                    placeholder="0.00"
                                    value={modalCryptoAmount}
                                    onChange={e => setModalCryptoAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                            {activeModal === 'm2m' ? 'Nuevo Valor de Mercado' : `Valor en Fiats (${selectedAsset.currency})`}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-text-secondary font-bold">$</span>
                            </div>
                            <input 
                                type="number" 
                                className="form-control pl-8 text-xl font-bold" 
                                placeholder="0.00"
                                value={modalAmount}
                                onChange={e => setModalAmount(e.target.value)}
                            />
                        </div>
                        {activeModal === 'm2m' && (
                             <p className="text-[10px] text-text-secondary mt-2">
                                * Esto registrará el nuevo valor actual. La diferencia con el invertido se reflejará como ganancia/pérdida.
                             </p>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button onClick={handleCloseModal} className="btn border border-white/10 hover:bg-white/5">Cancelar</button>
                        <button onClick={handleConfirmAction} className={`btn text-white ${activeModal === 'inject' ? 'bg-emerald-600 hover:bg-emerald-500' : activeModal === 'm2m' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
                            {activeModal === 'm2m' ? 'Actualizar' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                <Settings size={20} className="text-text-secondary"/> Ajustes de Activo
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-white/10 rounded-lg text-text-secondary"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-text-primary mb-1">{selectedAsset.name}</h4>
                <p className="text-xs text-text-secondary">{selectedAsset.category} • {selectedAsset.strategy}</p>
              </div>

              <div className="border-t border-white/5 pt-6">
                <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-4">Zona de Peligro</h5>
                <button 
                  onClick={handleDeleteAsset}
                  className="w-full btn bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Eliminar Activo Permanentemente
                </button>
                <p className="text-[10px] text-text-secondary mt-3 text-center">
                   Se borrará todo el historial de este activo y sus rendimientos asociados.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
               <button onClick={handleCloseModal} className="btn border border-white/10 hover:bg-white/5">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Asset Modal */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-indigo-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                <Plus size={20} className="text-indigo-400"/> Nuevo Activo
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-white/10 rounded-lg text-text-secondary"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="form-label">Nombre del Activo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: SPY, Bitcoin, Galicia..."
                  value={newAsset.name}
                  onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Categoría</label>
                  <select 
                    className="form-control"
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
                <div>
                  <label className="form-label">Estrategia</label>
                  <select 
                    className="form-control"
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

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Monto Invertido (Costo)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="0.00"
                    value={newAsset.invested}
                    onChange={e => setNewAsset({...newAsset, invested: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Moneda</label>
                  <select 
                    className="form-control"
                    value={newAsset.currency}
                    onChange={e => setNewAsset({...newAsset, currency: e.target.value as Currency})}
                  >
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Valor Actual (Opcional)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Si no ponés nada, se usa el invertido"
                  value={newAsset.current}
                  onChange={e => setNewAsset({...newAsset, current: e.target.value})}
                />
              </div>

              {newAsset.category === 'Cripto' && (
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <label className="form-label text-indigo-300">Símbolo (Ej: BTC)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="BTC"
                      value={newAsset.cryptoSymbol}
                      onChange={e => setNewAsset({...newAsset, cryptoSymbol: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="form-label text-indigo-300">Cantidad</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="0.000000"
                      value={newAsset.cryptoAmount}
                      onChange={e => setNewAsset({...newAsset, cryptoAmount: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button onClick={handleCloseModal} className="btn border border-white/10 hover:bg-white/5">Cancelar</button>
                <button 
                  onClick={handleAddInvestment} 
                  disabled={!newAsset.name || !newAsset.invested}
                  className="btn btn-primary disabled:opacity-50"
                >
                  Crear Activo
                </button>
              </div>
              </div>
            </div>
        </div>
      )}

      {/* Rebalancer Modal */}
      {activeModal === 'assistant' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-bg-card border border-indigo-500/30 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 bg-white/3 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-black text-text-primary">Portfolio Rebalancer</h3>
                    <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full text-text-secondary transition-colors"><X size={24} /></button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <PortfolioRebalancer />
                </div>

                <div className="p-6 border-t border-white/5 bg-white/3 flex justify-end">
                    <button onClick={handleCloseModal} className="btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8">
                        Cerrar Assistant
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
