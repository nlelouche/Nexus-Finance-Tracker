import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { formatMoney } from '../../../utils/finance';
import { SimulationDataPoint } from '../../../utils/simulator';

interface ScenarioChartProps {
  data: SimulationDataPoint[];
  fireTarget: number;
}

export const ScenarioChart: React.FC<ScenarioChartProps> = ({ data, fireTarget }) => {
  const { t } = useTranslation();
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
          <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
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
              formatter={(value: any, name: any) => [
                formatMoney(Number(value), 'USD'), 
                name === 'baseline' ? t('simulation.chart.tooltip.baseline') : t('simulation.chart.tooltip.simulated')
              ]}
              labelFormatter={(label) => t('simulation.chart.tooltip.label', { year: label })}
            />
            <Legend verticalAlign="top" height={36}/>
            <ReferenceLine y={fireTarget} stroke="#10b981" strokeDasharray="5 5" label={{ value: t('simulation.chart.meta'), position: 'insideTopRight', fill: '#10b981', fontSize: 10 }} />
            
            <Line 
              type="monotone" 
              dataKey="baseline" 
              name="baseline"
              stroke="#64748b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="simulated" 
              name="simulated"
              stroke="#818cf8" 
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-8 justify-center border-t border-white/5 pt-4">
        <div className="text-center">
          <p className="text-[10px] text-text-secondary uppercase">{t('simulation.chart.diff')}</p>
          <p className={`text-sm font-black ${data[data.length-1].delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatMoney(data[data.length-1].delta, 'USD')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-text-secondary uppercase">{t('simulation.chart.impact')}</p>
          <p className={`text-sm font-black ${data[data.length-1].delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data[0].baseline > 0 ? ((data[data.length-1].delta / data[data.length-1].baseline) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      </div>
    </Card>
  );
};
