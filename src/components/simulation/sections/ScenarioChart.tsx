import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../ui';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { formatMoney } from '../../../utils/finance';
import { SimulationDataPoint } from '../../../utils/simulator';

interface ScenarioChartProps {
  data: SimulationDataPoint[];
  fireTarget: number;
}

export const ScenarioChart: React.FC<ScenarioChartProps> = ({ data, fireTarget }) => {
  const { t } = useTranslation();
  
  const mappedData = data.map(d => ({
    ...d,
    bounds: [d.pessimistic, d.optimistic]
  }));

  return (
    <Card className="h-[450px] border-white/10 bg-white/5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-black text-text-primary tracking-tight">{t('simulation.chart.title')}</h3>
          <p className="text-xs text-text-secondary">{t('simulation.chart.subtitle')}</p>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mappedData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke="#ffffff20"
              fontSize={10}
              tick={{ fill: '#94a3b8' }}
              label={{ value: t('simulation.chart.xAxis'), position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis 
              hide
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              formatter={(value: any, name: any) => {
                if (Array.isArray(value)) return [`${formatMoney(value[0], 'USD')} - ${formatMoney(value[1], 'USD')}`, t('simulation.chart.tooltip.bounds', { defaultValue: 'Expected Range' })];
                const key = name as string;
                let label = key;
                if (key === 'totalPrincipal') label = t('simulation.chart.tooltip.principal', { defaultValue: 'Principal' });
                if (key === 'nominalValue') label = t('simulation.chart.tooltip.nominal', { defaultValue: 'Nominal Value' });
                if (key === 'realValue') label = t('simulation.chart.tooltip.real', { defaultValue: 'Real Value (Infl. Adj)' });
                return [formatMoney(Number(value), 'USD'), label];
              }}
              labelFormatter={(label) => t('simulation.chart.tooltip.label', { year: label })}
            />
            <Legend verticalAlign="top" height={36}/>
            <ReferenceLine y={fireTarget} stroke="#10b981" strokeDasharray="5 5" label={{ value: t('simulation.chart.meta'), position: 'insideTopRight', fill: '#10b981', fontSize: 10 }} />
            
            <Area 
              type="monotone" 
              dataKey="bounds" 
              name={t('simulation.chart.tooltip.bounds', { defaultValue: 'Confidence Range' })}
              stroke="none" 
              fill="#818cf8" 
              fillOpacity={0.1} 
            />
            <Line 
              type="monotone" 
              dataKey="totalPrincipal" 
              name={t('simulation.chart.tooltip.principal', { defaultValue: 'Principal' })}
              stroke="#64748b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="realValue" 
              name={t('simulation.chart.tooltip.real', { defaultValue: 'Real Value' })}
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="nominalValue" 
              name={t('simulation.chart.tooltip.nominal', { defaultValue: 'Nominal Value' })}
              stroke="#818cf8" 
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6 }}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-8 justify-center border-t border-white/5 pt-4">
        <div className="text-center">
          <p className="text-[10px] text-text-secondary uppercase">{t('simulation.chart.kpi.interest', { defaultValue: 'Compound Interest' })}</p>
          <p className={`text-sm font-black ${data[data.length-1].totalInterest >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatMoney(data[data.length-1].totalInterest, 'USD')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-text-secondary uppercase">{t('simulation.chart.kpi.principal', { defaultValue: 'Total Invested' })}</p>
          <p className="text-sm font-black text-indigo-400">
            {formatMoney(data[data.length-1].totalPrincipal, 'USD')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-text-secondary uppercase">{t('simulation.chart.kpi.realLabel', { defaultValue: 'Purchasing Power' })}</p>
          <p className="text-sm font-black text-white">
            {formatMoney(data[data.length-1].realValue, 'USD')}
          </p>
        </div>
      </div>
    </Card>
  );
};
