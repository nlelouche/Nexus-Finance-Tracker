import React, { useRef, useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useTranslation } from 'react-i18next';
import { 
  Download, Upload, Trash2, AlertTriangle, CheckCircle, 
  ShieldAlert, Database, Bot, RefreshCw 
} from 'lucide-react';
import { downloadJSON, validateBackupSchema, readFileAsJSON } from '../../utils/backup';

type Toast = { type: 'success' | 'error'; msg: string } | null;

const STORAGE_KEY = 'nexus-finance-storage';

export const AdminModule = () => {
  const { t } = useTranslation();
  const store = useFinanceStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<any | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── BACKUP ─────────────────────────────────────────────────
  const handleBackup = () => {
    try {
      const data = store.exportData();
      const date = new Date().toISOString().slice(0, 10);
      downloadJSON(data, `nexus-backup-${date}.json`);
      showToast('success', `${t('admin.export.title')}: nexus-backup-${date}.json`);
    } catch (err) {
      showToast('error', t('common.error'));
    }
  };

  // ── RESTORE ────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const json = await readFileAsJSON(file);
      if (validateBackupSchema(json)) {
        setConfirmRestore(json);
      } else {
        showToast('error', t('admin.import.desc')); // Or a specific error
      }
    } catch (err) {
      showToast('error', t('common.error'));
    }
    
    e.target.value = '';
  };

  const handleRestoreConfirm = () => {
    if (!confirmRestore) return;
    try {
      store.importData(confirmRestore);
      showToast('success', t('common.success'));
      setConfirmRestore(null);
    } catch (err) {
      showToast('error', t('common.error'));
    }
  };

  // ── CLEAR ──────────────────────────────────────────────────
  const handleClearConfirm = () => {
    try {
      store.clearDatabase();
      showToast('success', t('common.success'));
      setConfirmClear(false);
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      showToast('error', t('common.error'));
    }
  };

  const rawSize = (() => {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    return (new Blob([raw]).size / 1024).toFixed(1);
  })();

  return (
    <div className="p-6 md:p-10 max-w-[900px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-bold animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {toast.msg}
        </div>
      )}

      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-300 to-slate-500">
          {t('admin.title')}
        </h1>
        <p className="text-text-secondary mt-2 text-lg">{t('admin.subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: t('nav.dashboard'), value: store.transactions.length },
          { label: t('nav.investments'), value: store.investments.length },
          { label: t('nav.goals'), value: store.goals.length },
          { label: t('admin.clear.title'), value: store.recurringExpenses.length },
        ].map(stat => (
          <div key={stat.label} className="bg-bg-card border border-white/8 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-text-primary">{stat.value}</div>
            <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="bg-bg-card border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
              <Download size={22} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">{t('admin.export.title')}</h3>
              <p className="text-text-secondary text-sm mt-1">{t('admin.export.desc')}</p>
              <p className="text-xs text-text-secondary/60 mt-1 flex items-center gap-1">
                <Database size={11} /> Tamaño actual: <strong className="text-text-secondary">{rawSize} KB</strong>
              </p>
            </div>
          </div>
          <button onClick={handleBackup} className="btn bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shrink-0">
            <Download size={16} /> {t('admin.export.button')}
          </button>
        </div>

        <div className="bg-bg-card border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
              <Upload size={22} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">{t('admin.import.title')}</h3>
              <p className="text-text-secondary text-sm mt-1">{t('admin.import.desc')}</p>
            </div>
          </div>
          <div className="shrink-0">
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
            <button onClick={() => fileRef.current?.click()} className="btn bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center gap-2">
              <Upload size={16} /> {t('admin.import.button')}
            </button>
          </div>
        </div>

        <div className={`bg-bg-card border rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 transition-all ${
          confirmClear ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10'
        }`}>
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex-shrink-0">
              <Trash2 size={22} className="text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">{t('admin.clear.title')}</h3>
              <p className="text-text-secondary text-sm mt-1">{t('admin.clear.desc')}</p>
              {!confirmClear && <p className="text-xs text-text-secondary/60 mt-1">⚠️ {t('admin.clear.warning')}</p>}
            </div>
          </div>
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} className="btn bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <Trash2 size={16} /> {t('admin.clear.button')}
            </button>
          ) : (
            <div className="flex flex-col gap-2 shrink-0">
              <p className="text-rose-400 font-bold text-sm text-center flex items-center gap-1">
                <ShieldAlert size={16} /> {t('admin.clear.confirm')}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmClear(false)} className="btn border border-white/10 hover:bg-white/5 text-text-secondary flex-1">
                  {t('common.cancel')}
                </button>
                <button onClick={handleClearConfirm} className="btn bg-rose-600 hover:bg-rose-500 text-white font-bold flex-1">
                  {t('admin.clear.confirmButton')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-bg-card border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex-shrink-0">
              <Bot size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">{t('admin.ai.title')}</h3>
              <p className="text-text-secondary text-sm mt-1">{t('admin.ai.desc')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-text-secondary">{t('admin.ai.host')}</label>
              <input type="text" className="form-control" value={store.aiConfig.host} onChange={e => store.updateAiConfig({ host: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-text-secondary">{t('admin.ai.model')}</label>
              <input type="text" className="form-control" value={store.aiConfig.model} onChange={e => store.updateAiConfig({ model: e.target.value })} />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4 bg-white/5 p-2 rounded-lg border border-white/5">
            💡 <strong>Tip:</strong> {t('admin.ai.tip')}
          </p>
        </div>
      </div>

      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card border border-amber-500/40 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw size={22} className="text-amber-400" />
              <h3 className="font-bold text-text-primary text-lg">{t('admin.import.title')}</h3>
            </div>
            <p className="text-text-secondary text-sm mb-2">
              {t('admin.import.desc')}
            </p>
            <p className="text-amber-400 text-xs font-bold mb-6 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              ⚠️ {t('admin.clear.warning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRestore(null)}
                className="btn border border-white/10 hover:bg-white/5 text-text-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRestoreConfirm}
                className="btn bg-amber-500 hover:bg-amber-400 text-black font-bold flex-1"
              >
                {t('admin.import.button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
