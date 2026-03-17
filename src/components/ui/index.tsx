import React from 'react';
import { createPortal } from 'react-dom';

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}
export const Card = ({ children, className = '', style, onClick }: CardProps) => (
  <div className={`card ${className} group`} style={style} onClick={onClick}>
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

// --- Tooltip ---
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const TooltipUI = ({ content, children }: TooltipProps) => {
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [show, setShow] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
  };

  React.useEffect(() => {
    if (show) {
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [show]);

  return (
    <div 
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={() => {
        updateCoords();
        setShow(true);
      }}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && coords && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: coords.top + coords.height + 8, // Just below the trigger
            left: coords.left + (coords.width / 2),
            transform: 'translateX(-50%)'
          }}
        >
          <div className="w-56 p-3 bg-gray-950/95 text-white text-[11px] font-medium leading-tight rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl">
            {content}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-gray-950/95" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- DatePicker ---
export { DatePicker } from './DatePicker';
