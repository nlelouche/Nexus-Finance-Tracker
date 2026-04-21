import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Card, Button } from '../ui';
import { Camera, Trash2, Download, ArrowUpRight, ArrowDownRight, History, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { formatMoney, formatShort } from '../../utils/finance';
import { Snapshot } from '../../types';

export const SnapshotModule = () => {
  const { t } = useTranslation();
  const { snapshots, takeSnapshot, deleteSnapshot } = useFinanceStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'current' | 'gain', order: 'asc' | 'desc' }>({ key: 'current', order: 'desc' });

  const handleTakeSnapshot = () => {
    const name = window.prompt(t('snapshots.promptName')) || undefined;
    takeSnapshot(name);
  };

  const handleDownload = (snapshot: Snapshot) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `nexus_snapshot_${snapshot.date.split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-2">{t('snapshots.title')}</h1>
          <p className="text-text-secondary opacity-60">{t('snapshots.subtitle')}</p>
        </div>
        <button 
          onClick={handleTakeSnapshot}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 text-white"
        >
          <Camera size={18} /> {t('snapshots.button')}
        </button>
      </header>

      <div className="space-y-6">
        {snapshots?.length === 0 ? (
          <Card className="p-20 flex flex-col items-center justify-center text-center bg-white/[0.02] border-dashed border-white/10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-text-secondary mb-6">
              <History size={40} />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">{t('snapshots.empty')}</h3>
            <p className="text-sm text-text-secondary max-w-xs">
              {t('snapshots.emptyDesc')}
            </p>
          </Card>
        ) : (
          snapshots?.map((snap, idx) => {
            const nextSnap = snapshots[idx + 1]; // El anterior en el tiempo (lista está DESC)
            const isExpanded = expandedId === snap.id;

            // Comparativas
            const deltaValue = nextSnap ? snap.totalCurrentUSD - nextSnap.totalCurrentUSD : 0;
            const deltaInvested = nextSnap ? snap.totalInvestedUSD - nextSnap.totalInvestedUSD : 0; // Esfuerzo (Aportes)
            const deltaGain = nextSnap ? snap.totalGainUSD - nextSnap.totalGainUSD : 0; // Suerte (Mercado)

            return (
              <Card key={snap.id} className={`overflow-hidden transition-all duration-300 border-white/10 ${isExpanded ? 'bg-white/5' : 'bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                <div 
                  className="p-6 flex flex-wrap items-center justify-between gap-6 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : snap.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-text-primary tracking-tight">{snap.name}</h4>
                      <p className="text-[10px] font-bold text-text-secondary uppercase opacity-40">
                        {new Date(snap.date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{t('snapshots.patrimony')}</p>
                      <p className="text-lg font-black text-text-primary">{formatShort(snap.totalCurrentUSD)}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{t('snapshots.netGain')}</p>
                      <p className={`text-lg font-black ${snap.totalGainUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatMoney(snap.totalGainUSD, 'USD')}
                      </p>
                    </div>
                    {nextSnap && (
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t('snapshots.vsPrevious')}</p>
                        <div className="flex items-center gap-1">
                          {deltaValue >= 0 ? <ArrowUpRight size={14} className="text-emerald-400" /> : <ArrowDownRight size={14} className="text-rose-400" />}
                          <span className={`text-sm font-bold ${deltaValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatShort(Math.abs(deltaValue))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownload(snap); }}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary transition-all"
                      title={t('snapshots.exportJson')}
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm(t('snapshots.deleteConfirm'))) deleteSnapshot(snap.id); }}
                      className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="ml-2 text-text-secondary opacity-20">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-2 duration-300">
                    {/* Estadísticas Completas - Grid de 2 Columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Bloque 1: Estado Acumulado en el Punto del Snapshot */}
                      <div className="bg-white/5 rounded-[32px] p-8 border border-white/5">
                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <History size={14} /> Estado Acumulado
                        </h5>
                        <div className="flex justify-between items-end">
                           <div className="space-y-4">
                              <div>
                                <p className="text-[10px] font-bold text-text-secondary uppercase opacity-40 mb-1">Patrimonio Total</p>
                                <p className="text-2xl font-black text-text-primary tracking-tighter">{formatMoney(snap.totalCurrentUSD, 'USD')}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-text-secondary uppercase opacity-40 mb-1">Capital Invertido</p>
                                <p className="text-lg font-black text-text-primary/80 tracking-tighter">{formatMoney(snap.totalInvestedUSD, 'USD')}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-text-secondary uppercase opacity-40 mb-1">Ganancia Histórica</p>
                              <p className={`text-4xl font-black tracking-tighter ${snap.totalGainUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {snap.totalGainUSD >= 0 ? '+' : ''}{((snap.totalGainUSD / snap.totalInvestedUSD) * 100).toFixed(1)}%
                              </p>
                              <p className={`text-sm font-bold opacity-60 ${snap.totalGainUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatMoney(snap.totalGainUSD, 'USD')}
                              </p>
                           </div>
                        </div>
                      </div>

                      {/* Bloque 2: Variación vs Snapshot Anterior */}
                      <div className="bg-white/5 rounded-[32px] p-8 border border-white/5">
                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Info size={14} /> Variación del Periodo
                        </h5>
                        {nextSnap ? (
                          <div className="space-y-6">
                            <div className="flex justify-between items-center">
                               <span className="text-xs font-bold text-text-secondary opacity-60">Crecimiento (Mercado)</span>
                               <span className={`text-lg font-black ${deltaGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {deltaGain >= 0 ? '+' : ''}{formatMoney(deltaGain, 'USD')}
                               </span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-xs font-bold text-text-secondary opacity-60">Nuevos Aportes (Esfuerzo)</span>
                               <span className="text-lg font-black text-blue-400">
                                 {deltaInvested >= 0 ? '+' : ''}{formatMoney(deltaInvested, 'USD')}
                               </span>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                               <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Cambio Patrimonio</span>
                               <div className="text-right">
                                  <p className={`text-xl font-black ${deltaValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {deltaValue >= 0 ? '+' : ''}{formatMoney(deltaValue, 'USD')}
                                  </p>
                               </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
                             <p className="text-xs font-bold text-text-secondary opacity-30 italic">Primer registro histórico disponible</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tabla Completa de Activos */}
                    <div className="bg-white/5 rounded-[32px] overflow-hidden border border-white/5">
                      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                        <h5 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                          <History size={18} className="text-indigo-400" /> 
                          {t('snapshots.assetsSummary')}
                        </h5>
                        <div className="flex gap-2">
                           <span className="text-[10px] font-bold text-text-secondary opacity-30 uppercase tracking-tighter mr-2 pt-1">Ordenar por:</span>
                           {(['current', 'gain'] as const).map(key => (
                             <button 
                                key={key}
                                onClick={() => setSortConfig({ key, order: sortConfig.key === key && sortConfig.order === 'desc' ? 'asc' : 'desc' })}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border ${
                                  sortConfig.key === key 
                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                    : 'bg-white/5 text-text-secondary border-transparent hover:bg-white/10'
                                }`}
                             >
                               {key === 'current' ? 'Monto' : 'Ganancia'}
                               {sortConfig.key === key && (sortConfig.order === 'desc' ? ' ↓' : ' ↑')}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-white/[0.02]">
                              <th className="px-8 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Activo</th>
                              <th className="px-8 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Categoría</th>
                              <th className="px-8 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Invertido</th>
                              <th className="px-8 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Actual</th>
                              <th className="px-8 py-4 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Ganancia</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {[...snap.investments]
                              .sort((a, b) => {
                                let valA = a.current;
                                let valB = b.current;
                                if (sortConfig.key === 'gain') {
                                  valA = a.invested > 0 ? (a.current - a.invested) / a.invested : 0;
                                  valB = b.invested > 0 ? (b.current - b.invested) / b.invested : 0;
                                }
                                return sortConfig.order === 'desc' ? valB - valA : valA - valB;
                              })
                              .map(inv => {
                                const gain = inv.current - inv.invested;
                                const gainPct = inv.invested > 0 ? (gain / inv.invested) * 100 : 0;
                                return (
                                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-4 font-black text-text-primary text-sm">{inv.name}</td>
                                    <td className="px-8 py-4 text-xs font-bold text-text-secondary opacity-60">{inv.category}</td>
                                    <td className="px-8 py-4 text-right text-xs font-bold text-text-secondary">
                                      {formatMoney(inv.invested, inv.currency)}
                                    </td>
                                    <td className="px-8 py-4 text-right font-black text-text-primary text-sm">
                                      {formatMoney(inv.current, inv.currency)}
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                      <div className={`text-xs font-black ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                                      </div>
                                      <div className="text-[10px] font-bold text-text-secondary opacity-40">
                                        {formatMoney(gain, inv.currency)}
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
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
