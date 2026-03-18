import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Card } from '../ui';
import { Calculator, Trash2, Play, TrendingDown, TrendingUp, DollarSign, Info, Edit2 } from 'lucide-react';
import { calculateBurnRate, calculateSavingsRate, toUSD, formatMoney } from '../../utils/finance';
import { runSimulation, SimulationEvent, EventType } from '../../utils/simulator';
import { ScenarioChart } from './sections/ScenarioChart';
import { Transaction, Investment } from '../../types';

export const ScenarioModule = () => {
  const { t } = useTranslation();
  const { transactions, investments, exchangeRates } = useFinanceStore();
  
  // Simulation State
  const [events, setEvents] = useState<SimulationEvent[]>([
    { id: '1', name: 'Bono Anual', type: 'one-time-cashflow', amount: 5000, monthOffset: 12, enabled: true },
    { id: '2', name: 'Crash de Mercado (-30%)', type: 'market-shock', amount: -0.3, monthOffset: 24, enabled: false },
    { id: '3', name: 'Aumento de Sueldo', type: 'recurring-cashflow', amount: 500, monthOffset: 6, enabled: false },
  ]);

  const [simulationMonths, setSimulationMonths] = useState(120); // 10 years default
  const [expectedReturn, setExpectedReturn] = useState(8);
  const [inflationRate, setInflationRate] = useState(3);
  const [useCustomMonthly, setUseCustomMonthly] = useState(false);
  const [customMonthly, setCustomMonthly] = useState(1000);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const updateEvent = (id: string, updates: Partial<SimulationEvent>) => {
    setEvents((prev) => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  // Baseline Data
  const netWorthUSD = useMemo(() => 
    investments.reduce((acc: number, inv: Investment) => acc + toUSD(inv.current, inv.currency, exchangeRates), 0)
  , [investments, exchangeRates]);

  const burnRateUSD = useMemo(() => 
    calculateBurnRate(transactions, exchangeRates)
  , [transactions, exchangeRates]);

  const savingsRateValue = useMemo(() => 
    calculateSavingsRate(transactions, exchangeRates)
  , [transactions, exchangeRates]);

  const monthlyIncome = useMemo(() => {
    const last3Months = transactions.filter((t: Transaction) => t.type === 'income' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1));
    return last3Months.length > 0 ? last3Months.reduce((sum: number, t: Transaction) => sum + toUSD(t.amount, t.currency, exchangeRates), 0) / 3 : 0;
  }, [transactions, exchangeRates]);

  const autoMonthlySavings = (monthlyIncome * savingsRateValue) || 0;
  const activeMonthlyContribution = useCustomMonthly ? customMonthly : autoMonthlySavings;

  // Run Simulation
  const simulationData = useMemo(() => {
    return runSimulation({
      months: simulationMonths,
      expectedReturn: expectedReturn / 100,
      monthlySavings: activeMonthlyContribution,
      currentNetWorth: netWorthUSD,
      inflationRate: inflationRate / 100,
      exchangeRates
    }, events);
  }, [simulationMonths, activeMonthlyContribution, netWorthUSD, expectedReturn, inflationRate, events, exchangeRates]);

  const fireTargetValue = (burnRateUSD * 12) / 0.04;

  const toggleEvent = (id: string) => {
    setEvents((prev: SimulationEvent[]) => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  const removeEvent = (id: string) => {
    setEvents((prev: SimulationEvent[]) => prev.filter(e => e.id !== id));
  };

  const addEvent = (type: EventType) => {
    const newEvent: SimulationEvent = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Nuevo ${type.replace('-', ' ')}`,
      type,
      amount: type.includes('shock') ? -0.1 : (type === 'yield-change' ? 0.02 : 1000),
      monthOffset: 12,
      enabled: true
    };
    setEvents([...events, newEvent]);
    setEditingEventId(newEvent.id);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto animate-in fade-in duration-700">
      <header className="flex flex-col gap-2 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Calculator className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-text-primary">
              {t('simulation.title')} <span className="text-indigo-400">{t('simulation.titleAccent')}</span>
            </h1>
            <p className="text-text-secondary font-medium opacity-60">{t('simulation.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Controls & Events */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-indigo-500/20 bg-indigo-500/5 p-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Play size={14} /> {t('simulation.config.title')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary mb-1 block">{t('simulation.config.horizon')}</label>
                <select 
                  value={simulationMonths} 
                  onChange={(e) => setSimulationMonths(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-indigo-500/50"
                >
                  <option value={60}>{t('simulation.config.years', { count: 5 })}</option>
                  <option value={120}>{t('simulation.config.years', { count: 10 })}</option>
                  <option value={240}>{t('simulation.config.years', { count: 20 })}</option>
                  <option value={360}>{t('simulation.config.years', { count: 30 })}</option>
                </select>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase font-bold text-text-secondary">{t('simulation.config.return')}</label>
                  <span className="text-xs font-bold text-white">{expectedReturn}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="25" step="0.5"
                  value={expectedReturn} 
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase font-bold text-text-secondary">{t('simulation.config.inflation')}</label>
                  <span className="text-xs font-bold text-white">{inflationRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="15" step="0.5"
                  value={inflationRate} 
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] uppercase font-bold text-text-secondary">{t('simulation.config.monthlyContrib')}</label>
                  <button 
                    onClick={() => setUseCustomMonthly(!useCustomMonthly)}
                    className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    {useCustomMonthly ? t('simulation.config.useAuto') : t('simulation.config.useCustom')}
                  </button>
                </div>
                
                {useCustomMonthly ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={14} className="text-text-secondary" />
                    </div>
                    <input
                      type="number"
                      value={customMonthly}
                      onChange={(e) => setCustomMonthly(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                ) : (
                  <div className="bg-black/20 border border-white/5 rounded-lg p-2 flex items-center gap-2">
                    <Calculator size={14} className="text-emerald-400" />
                    <div>
                      <p className="text-xs text-text-primary font-bold">{formatMoney(autoMonthlySavings, 'USD')}</p>
                      <p className="text-[9px] text-text-secondary">{t('simulation.config.autoSubtext')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('simulation.events.title')}</h3>
            <div className="flex gap-1">
               <button title="Cashflow" onClick={() => addEvent('one-time-cashflow')} className="p-1 hover:bg-emerald-500/20 bg-emerald-500/10 rounded text-emerald-400 transition-colors"><DollarSign size={14} /></button>
               <button title="Market Shock" onClick={() => addEvent('market-shock')} className="p-1 hover:bg-rose-500/20 bg-rose-500/10 rounded text-rose-400 transition-colors"><TrendingDown size={14} /></button>
               <button title="Yield Change" onClick={() => addEvent('yield-change')} className="p-1 hover:bg-indigo-500/20 bg-indigo-500/10 rounded text-indigo-400 transition-colors"><TrendingUp size={14} /></button>
            </div>
          </div>

          <div className="space-y-3">
            {events.map((event: SimulationEvent) => {
              const isEditing = editingEventId === event.id;
              
              return (
              <Card 
                key={event.id} 
                className={`p-4 border-white/5 transition-all group ${isEditing ? 'bg-indigo-500/5 border-indigo-500/50' : (event.enabled ? 'bg-indigo-500/10 border-indigo-500/30 cursor-pointer' : 'bg-white/5 opacity-60 cursor-pointer')}`}
                onClick={() => !isEditing && toggleEvent(event.id)}
              >
                {isEditing ? (
                  <div className="space-y-3 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <input 
                      value={event.name} 
                      onChange={(e) => updateEvent(event.id, { name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                      placeholder="Nombre del evento"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-text-secondary">Mes (Offset)</label>
                        <input 
                          type="number"
                          value={event.monthOffset} 
                          onChange={(e) => updateEvent(event.id, { monthOffset: Number(e.target.value) })}
                          className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-text-secondary">
                          {event.type === 'market-shock' || event.type === 'yield-change' ? 'Valor (Ej: Ley Decimal 0.1)' : 'Monto (USD)'}
                        </label>
                        <input 
                          type="number"
                          step={event.type === 'market-shock' || event.type === 'yield-change' ? 0.01 : 100}
                          value={event.amount} 
                          onChange={(e) => updateEvent(event.id, { amount: Number(e.target.value) })}
                          className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    </div>
                    <button onClick={() => setEditingEventId(null)} className="w-full py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-xs font-bold mt-2 transition-colors">
                      {t('common.save')}
                    </button>
                  </div>
                ) : (
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${event.type === 'market-shock' ? 'bg-rose-500/20 text-rose-400' : (event.type === 'yield-change' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400')}`}>
                      {event.type === 'market-shock' ? <TrendingDown size={18} /> : (event.type === 'yield-change' ? <TrendingUp size={18} /> : <DollarSign size={18} />)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{event.name}</h4>
                      <p className="text-[10px] text-text-secondary">
                        {event.type === 'market-shock' || event.type === 'yield-change'
                          ? t('simulation.events.impact', { value: `${(event.amount * 100).toFixed(1)}%` })
                          : t('simulation.events.amount', { value: formatMoney(event.amount, 'USD') })}
                        {' • '} {t('simulation.events.month', { month: event.monthOffset })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingEventId(event.id); }}
                      className="p-1 hover:bg-indigo-500/20 rounded text-indigo-400 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeEvent(event.id); }}
                      className="p-1 hover:bg-rose-500/20 rounded text-rose-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                )}
              </Card>
            )})}

            {events.length === 0 && (
              <div className="text-center py-10 opacity-40">
                <p className="text-sm italic">{t('simulation.events.empty')}</p>
                <p className="text-[10px]">{t('simulation.events.emptySub')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Visualization & Comparison */}
        <div className="lg:col-span-8 space-y-6">
          <ScenarioChart data={simulationData} fireTarget={fireTargetValue} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-indigo-500/20 bg-indigo-500/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-indigo-500/20 rounded text-indigo-400"><Info size={14} /></div>
                <h4 className="text-xs font-bold text-text-secondary uppercase">{t('simulation.impact.title')}</h4>
              </div>
              <p className="text-sm text-text-secondary">
                {simulationData[simulationData.length-1].totalInterest > 0 
                  ? t('simulation.impact.ahead') 
                  : t('simulation.impact.behind')}
              </p>
            </Card>

            <Card className="border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-500/20 rounded text-amber-400"><TrendingUp size={14} /></div>
                <h4 className="text-xs font-bold text-text-secondary uppercase">{t('simulation.strategy.title')}</h4>
              </div>
              <p className="text-sm text-text-secondary">
                {t('simulation.strategy.tip')}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
