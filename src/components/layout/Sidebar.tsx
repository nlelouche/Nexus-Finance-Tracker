import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowDownLeft, ArrowUpRight, TrendingUp, Target, Moon, ShieldCheck, Rocket, Globe, Camera } from 'lucide-react';

export function Sidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('en') ? 'es' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <aside className="w-[240px] bg-bg-surface/80 backdrop-blur-xl border-r border-border-light py-8 px-4 flex flex-col fixed h-screen z-10 hidden md:flex shadow-2xl">
      <div className="text-2xl font-bold tracking-tight mb-12 px-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-brand-primary rounded flex items-center justify-center">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bg-body)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        Nexus
      </div>

      <nav className="flex flex-col gap-2">
        <Link 
          to="/" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive('/') ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white shadow-inner' : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
          <Home size={18} />
          {t('nav.dashboard')}
        </Link>
        <Link 
          to="/ingresos" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive('/ingresos') ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white shadow-inner' : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
          <ArrowDownLeft size={18} />
          {t('nav.income')}
        </Link>
        <Link 
          to="/egresos" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive('/egresos') ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white shadow-inner' : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
          <ArrowUpRight size={18} />
          {t('nav.expenses')}
        </Link>
        <Link 
          to="/inversiones" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive('/inversiones') ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white shadow-inner' : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
          <TrendingUp size={18} />
          {t('nav.investments')}
        </Link>
        <Link 
          to="/objetivos" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive('/objetivos') ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white shadow-inner' : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
          <Target size={18} />
          {t('nav.goals')}
        </Link>
        <Link 
          to="/simulador" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive('/simulador') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/10 text-white shadow-inner' : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
          <Rocket size={18} />
          {t('nav.simulation')}
        </Link>
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <div className="border-t border-white/5 mb-2" />
        <Link
          to="/snapshots"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm ${isActive('/snapshots') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/10 text-white shadow-inner' : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
          <Camera size={16} /> {t('nav.snapshots')}
        </Link>
        <Link
          to="/admin"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm ${isActive('/admin') ? 'bg-gradient-to-r from-slate-500/20 to-slate-400/10 border border-white/10 text-white shadow-inner' : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'}`}
        >
          <ShieldCheck size={16} /> {t('nav.admin')}
        </Link>
        <button 
          onClick={toggleLanguage}
          className="flex items-center justify-between px-4 py-3 w-full rounded-lg font-medium text-text-muted text-sm hover:text-text-secondary transition-colors duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Globe size={16} />
            {t('nav.language')}
          </div>
          <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded">
            {i18n.language?.startsWith('en') ? 'EN' : 'ES'}
          </span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-medium text-text-muted text-sm hover:text-text-secondary transition-colors duration-200 cursor-pointer">
          <Moon size={16} />
          {t('nav.darkMode')}
        </button>
      </div>
    </aside>
  );
}
