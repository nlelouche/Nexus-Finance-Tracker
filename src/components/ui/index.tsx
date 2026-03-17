import React from 'react';

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export const Card = ({ children, className = '', style }: CardProps) => (
  <div className={`card ${className} group`} style={style}>
    {children}
  </div>
);

// --- ProgressBar ---
interface ProgressBarProps {
  progress: number; // 0 to 100
  status?: 'good' | 'bad' | 'neutral';
}
export const ProgressBar = ({ progress, status = 'neutral' }: ProgressBarProps) => {
  const statusClass = status === 'good' ? 'good' : status === 'bad' ? 'bad' : '';
  const percent = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="progress-bg">
      <div 
        className={`progress-fill ${statusClass}`} 
        style={{ width: `${percent}%` }} 
      />
    </div>
  );
};

// --- Sparkline ---
interface SparklineProps {
  data: number[];
  colorProfile?: 'green' | 'red' | 'brand';
  svgProps?: React.SVGProps<SVGSVGElement>;
}
export const Sparkline = ({ data, colorProfile = 'green', svgProps }: SparklineProps) => {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  const color = colorProfile === 'green' ? 'var(--accent-green)' : 
                colorProfile === 'red' ? 'var(--accent-red)' : 
                'var(--brand-primary)';
                
  const bgColorPrefix = colorProfile === 'green' ? '16, 185, 129' : 
                        colorProfile === 'red' ? '239, 68, 68' : 
                        '59, 130, 246';

  return (
    <div className="relative w-full h-[30px] group-hover:scale-[1.02] transition-transform duration-500" {...(svgProps as any)}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible drop-shadow-md">
        <defs>
          <linearGradient id={`grad-${colorProfile}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={`rgba(${bgColorPrefix}, 0.3)`} />
            <stop offset="100%" stopColor={`rgba(${bgColorPrefix}, 0)`} />
          </linearGradient>
        </defs>
        <path d={`M0,${height} L${points} L${width},${height} Z`} fill={`url(#grad-${colorProfile})`} />
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        />
      </svg>
    </div>
  );
};

// --- DatePicker ---
export { DatePicker } from './DatePicker';
