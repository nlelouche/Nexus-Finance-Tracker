import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../ui';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatMoney } from '../../../utils/finance';

interface WealthForecastProps {
  currentNetWorth: number;
  monthlySavings: number;
  fireTarget: number;
  annualReturn?: number;
}

export const WealthForecast: React.FC<WealthForecastProps> = ({
  currentNetWorth,
  monthlySavings,
  fireTarget,
  annualReturn = 0.07
}) => {
  const { t } = useTranslation();
  const data = useMemo(() => {
    const points = [];
    const monthsForecast = 120; // 10 years forecast
    const monthlyReturn = Math.pow(1 + annualReturn, 1/12) - 1;
    
    let balance = currentNetWorth;
    
    for (let i = 0; i <= monthsForecast; i++) {
      if (i % 6 === 0) { // Every 6 months
        points.push({
          month: i,
          year: (i / 12).toFixed(1),
          patrimonio: Math.round(balance),
          target: fireTarget
        });
      }
      balance = (balance + monthlySavings) * (1 + monthlyReturn);
      
      // Stop if it grows too much to keep chart readable
      if (balance > fireTarget * 2) break;
    }
    
    return points;
  }, [currentNetWorth, monthlySavings, fireTarget, annualReturn]);

  return (
    <Card className="mt-6 border-white/10 bg-white/5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-text-primary tracking-tight">{t('dashboard.forecast.title')}</h3>
          <p className="text-xs text-text-secondary">{t('dashboard.forecast.subtitle', { rate: (annualReturn * 100).toFixed(0) })}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-emerald-400 uppercase">{t('dashboard.forecast.metaFire')}</p>
          <p className="text-sm font-black text-text-primary">{formatMoney(fireTarget, 'USD')}</p>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="year" 
              label={{ value: t('dashboard.forecast.xAxis'), position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#94a3b8' }}
              stroke="#ffffff20"
              fontSize={10}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              hide
              domain={[0, 'dataMax + 100000']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
              itemStyle={{ color: '#818cf8' }}
              formatter={(value: any) => [formatMoney(Number(value), 'USD'), t('dashboard.forecast.tooltip')]}
              labelFormatter={(label) => t('dashboard.forecast.label', { year: label })}
            />
            <ReferenceLine y={fireTarget} stroke="#10b981" strokeDasharray="5 5" label={{ value: t('dashboard.forecast.meta'), position: 'insideTopRight', fill: '#10b981', fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="patrimonio" 
              stroke="#818cf8" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPatrimonio)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
