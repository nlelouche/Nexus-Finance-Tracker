import React from 'react';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface WidgetShellProps {
  id: string;
  children: React.ReactNode;
  editMode: boolean;
  visible: boolean;
  onToggle: () => void;
}

export const WidgetShell: React.FC<WidgetShellProps> = ({ id, children, editMode, visible, onToggle }) => {
  return (
    <div className={`h-full flex flex-col bg-bg-surface border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 group ${!visible && !editMode ? 'hidden' : 'shadow-xl shadow-black/20'} ${!visible && editMode ? 'ring-2 ring-indigo-500/30' : ''}`}>
      {editMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-white/10 border-b border-white/5 select-none relative z-50">
          <div className="flex items-center gap-2">
            <div className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded transition-colors text-text-secondary">
              <GripVertical size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{id}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`p-1 rounded transition-colors ${visible ? 'text-indigo-400 hover:bg-indigo-400/10' : 'text-text-secondary hover:text-white hover:bg-white/10'}`}
          >
            {visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      )}
      <div className={`flex-1 overflow-auto custom-scrollbar relative transition-all duration-300 ${!visible ? 'opacity-20 grayscale blur-md pointer-events-none' : ''}`}>
        {children}
        {!visible && editMode && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
              <EyeOff size={12} className="text-text-secondary" />
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter">Widget Oculto</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
