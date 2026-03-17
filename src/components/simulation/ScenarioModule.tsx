import { useState, useMemo } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Card } from '../ui';
import { Calculator, Plus, Trash2, Play, TrendingDown, TrendingUp, DollarSign, Info } from 'lucide-react';
import { calculateBurnRate, calculateSavingsRate, toUSD, formatMoney } from '../../utils/finance';
import { runSimulation, SimulationEvent, EventType } from '../../utils/simulator';
import { ScenarioChart } from './sections/ScenarioChart';
import { Transaction, Investment } from '../../types';

export const ScenarioModule = () => {
  const { transactions, investments, exchangeRates } = useFinanceStore();
  
  // Simulation State
  const [events, setEvents] = useState<SimulationEvent[]>([
    { id: '1', name: 'Bono Anual', type: 'one-time-cashflow', amount: 5000, monthOffset: 12, enabled: true },
    { id: '2', name: 'Crash de Mercado (-30%)', type: 'market-shock', amount: -0.3, monthOffset: 24, enabled: false },
    { id: '3', name: 'Aumento de Sueldo', type: 'recurring-cashflow', amount: 500, monthOffset: 6, enabled: false },
  ]);

  const [simulationMonths, setSimulationMonths] = useState(120); // 10 years default

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

  const monthlySavings = monthlyIncome * savingsRateValue;

  // Run Simulation
  const simulationData = useMemo(() => {
    return runSimulation({
      months: simulationMonths,
      annualReturn: 0.07,
      monthlySavings: monthlySavings,
      currentNetWorth: netWorthUSD,
      exchangeRates
    }, events);
  }, [simulationMonths, monthlySavings, netWorthUSD, events, exchangeRates]);

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
      name: `Nuevo ${type}`,
      type,
      amount: type.includes('shock') ? -0.1 : 1000,
      monthOffset: 12,
      enabled: true
    };
    setEvents([...events, newEvent]);
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
              Financial <span className="text-indigo-400">Flight Simulator</span>
            </h1>
            <p className="text-text-secondary font-medium opacity-60">Proyectá el impacto de decisiones y eventos externos sin riesgo.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Controls & Events */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-indigo-500/20 bg-indigo-500/5 p-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Play size={14} /> Configuración de Vuelo
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary mb-1 block">Horizonte Temporal</label>
                <select 
                  value={simulationMonths} 
                  onChange={(e) => setSimulationMonths(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-text-primary"
                >
                  <option value={60}>5 Años</option>
                  <option value={120}>10 Años</option>
                  <option value={240}>20 Años</option>
                  <option value={360}>30 Años</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Eventos del Escenario</h3>
            <div className="flex gap-2">
               <button onClick={() => addEvent('one-time-cashflow')} className="p-1 hover:bg-white/10 rounded text-indigo-400"><Plus size={16} /></button>
            </div>
          </div>

          <div className="space-y-3">
            {events.map((event: SimulationEvent) => (
              <Card 
                key={event.id} 
                className={`p-4 border-white/5 transition-all cursor-pointer ${event.enabled ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 opacity-60'}`}
                onClick={() => toggleEvent(event.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${event.type === 'market-shock' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {event.type === 'market-shock' ? <TrendingDown size={18} /> : <DollarSign size={18} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{event.name}</h4>
                      <p className="text-[10px] text-text-secondary">
                        {event.type === 'market-shock' ? `Impacto: ${(event.amount * 100).toFixed(0)}%` : `Monto: ${formatMoney(event.amount, 'USD')}`}
                        {' • '} Mes {event.monthOffset}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeEvent(event.id); }}
                    className="p-1 hover:bg-rose-500/20 rounded text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}

            {events.length === 0 && (
              <div className="text-center py-10 opacity-40">
                <p className="text-sm italic">No hay eventos activos.</p>
                <p className="text-[10px]">Agregá eventos para simular cambios.</p>
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
                <h4 className="text-xs font-bold text-text-secondary uppercase">Impacto en Libertad</h4>
              </div>
              <p className="text-sm text-text-secondary">
                Este escenario {simulationData[simulationData.length-1].delta > 0 ? 'adelanta' : 'retrasa'} tu meta significativamente.
              </p>
            </Card>

            <Card className="border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-500/20 rounded text-amber-400"><TrendingUp size={14} /></div>
                <h4 className="text-xs font-bold text-text-secondary uppercase">Estrategia Sugerida</h4>
              </div>
              <p className="text-sm text-text-secondary">
                Simulá un aumento de ahorro del 10% para ver cómo neutraliza shocks de mercado.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
