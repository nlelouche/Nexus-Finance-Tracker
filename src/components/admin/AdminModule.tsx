import React, { useRef, useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, ShieldAlert, Database, RefreshCw, Bot } from 'lucide-react';

type Toast = { type: 'success' | 'error'; msg: string } | null;

const STORAGE_KEY = 'nexus-finance-storage'; // mismo key que persist en useFinanceStore

export const AdminModule = () => {
  const store = useFinanceStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null); // JSON string a restaurar

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── BACKUP ─────────────────────────────────────────────────
  const handleBackup = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { showToast('error', 'No hay datos en localStorage para exportar.'); return; }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `nexus-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', `Backup generado: nexus-backup-${date}.json`);
    } catch {
      showToast('error', 'Error al generar el backup.');
    }
  };

  // ── RESTORE ────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        JSON.parse(text); // validar que es JSON válido
        setConfirmRestore(text);
      } catch {
        showToast('error', 'El archivo no es un JSON válido.');
      }
    };
    reader.readAsText(file);
    // reset el input para poder seleccionar el mismo archivo dos veces
    e.target.value = '';
  };

  const handleRestoreConfirm = () => {
    if (!confirmRestore) return;
    try {
      localStorage.setItem(STORAGE_KEY, confirmRestore);
      showToast('success', 'Backup restaurado. Recargando...');
      setConfirmRestore(null);
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      showToast('error', 'Error al restaurar el backup.');
    }
  };

  // ── CLEAR ──────────────────────────────────────────────────
  const handleClearConfirm = () => {
    try {
      store.clearDatabase(); // Limpia el zustand store (sobrescribe valores iniciales)
      // localStorage.removeItem(STORAGE_KEY); NO! Si lo removemos, Zustand carga los "INITIAL_" mocks cuando hace reload
      showToast('success', 'Base de datos limpiada. Recargando...');
      setConfirmClear(false);
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      showToast('error', 'Error al limpiar la base de datos.');
    }
  };

  // ── Stats rápidas ──────────────────────────────────────────
  const rawSize = (() => {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    return (new Blob([raw]).size / 1024).toFixed(1);
  })();

  return (
    <div className="p-6 md:p-10 max-w-[900px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      {/* Toast */}
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
          Panel de Administración
        </h1>
        <p className="text-text-secondary mt-2 text-lg">Backup, restauración y limpieza de datos.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Transacciones', value: store.transactions.length },
          { label: 'Inversiones', value: store.investments.length },
          { label: 'Objetivos', value: store.goals.length },
          { label: 'Costos Fijos', value: store.recurringExpenses.length },
        ].map(stat => (
          <div key={stat.label} className="bg-bg-card border border-white/8 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-text-primary">{stat.value}</div>
            <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">

        {/* BACKUP */}
        <div className="bg-bg-card border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
              <Download size={22} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">Exportar Backup</h3>
              <p className="text-text-secondary text-sm mt-1">
                Descarga un archivo <code className="text-indigo-400">.json</code> con todos tus datos actuales.
                Guardalo en un lugar seguro.
              </p>
              <p className="text-xs text-text-secondary/60 mt-1 flex items-center gap-1">
                <Database size={11} /> Tamaño actual del store: <strong className="text-text-secondary">{rawSize} KB</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleBackup}
            className="btn bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            <Download size={16} /> Descargar Backup
          </button>
        </div>

        {/* RESTORE */}
        <div className="bg-bg-card border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
              <Upload size={22} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">Restaurar Backup</h3>
              <p className="text-text-secondary text-sm mt-1">
                Importa un archivo <code className="text-amber-400">.json</code> generado por esta herramienta.
                <strong className="text-amber-400"> Reemplaza todos los datos actuales.</strong>
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => fileRef.current?.click()}
              className="btn bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center gap-2"
            >
              <Upload size={16} /> Seleccionar archivo
            </button>
          </div>
        </div>

        {/* CLEAR */}
        <div className={`bg-bg-card border rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 transition-all ${
          confirmClear ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10'
        }`}>
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex-shrink-0">
              <Trash2 size={22} className="text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">Limpiar Base de Datos</h3>
              <p className="text-text-secondary text-sm mt-1">
                Elimina <strong className="text-rose-400">todos los datos</strong>: transacciones, inversiones, objetivos, costos fijos y targets.
                La app arranca desde cero.
              </p>
              {!confirmClear && (
                <p className="text-xs text-text-secondary/60 mt-1">⚠️ Esta acción no se puede deshacer. Hacé un backup primero.</p>
              )}
            </div>
          </div>
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="btn bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center gap-2 shrink-0"
            >
              <Trash2 size={16} /> Limpiar datos
            </button>
          ) : (
            <div className="flex flex-col gap-2 shrink-0">
              <p className="text-rose-400 font-bold text-sm text-center flex items-center gap-1">
                <ShieldAlert size={16} /> ¿Estás seguro?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmClear(false)} className="btn border border-white/10 hover:bg-white/5 text-text-secondary flex-1">
                  Cancelar
                </button>
                <button
                  onClick={handleClearConfirm}
                  className="btn bg-rose-600 hover:bg-rose-500 text-white font-bold flex-1"
                >
                  Sí, borrar todo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI CONFIGURATION */}
        <div className="bg-bg-card border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex-shrink-0">
              <Bot size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">Configuración de IA Local</h3>
              <p className="text-text-secondary text-sm mt-1">
                Ajustá los parámetros de conexión para tu instancia de <code className="text-purple-400">Ollama</code>.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-text-secondary">Host / URL</label>
              <input 
                type="text" 
                className="form-control" 
                value={store.aiConfig.host} 
                onChange={e => store.updateAiConfig({ host: e.target.value })} 
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-text-secondary">Modelo (Ollama Name)</label>
              <input 
                type="text" 
                className="form-control" 
                value={store.aiConfig.model} 
                onChange={e => store.updateAiConfig({ model: e.target.value })} 
                placeholder="llama3.1"
              />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4 bg-white/5 p-2 rounded-lg border border-white/5">
            💡 <strong>Tip:</strong> Asegurate de que Ollama tenga configurado <code className="text-purple-300">OLLAMA_ORIGINS="*"</code> para evitar problemas de CORS.
          </p>
        </div>
      </div>

      {/* Restore Confirm Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card border border-amber-500/40 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw size={22} className="text-amber-400" />
              <h3 className="font-bold text-text-primary text-lg">Confirmar Restauración</h3>
            </div>
            <p className="text-text-secondary text-sm mb-2">
              Se van a reemplazar <strong className="text-text-primary">todos los datos actuales</strong> con el contenido del archivo seleccionado.
            </p>
            <p className="text-amber-400 text-xs font-bold mb-6 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              ⚠️ Los datos actuales se perderán permanentemente. Si querés conservarlos, cancelá y hacé un backup primero.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRestore(null)}
                className="btn border border-white/10 hover:bg-white/5 text-text-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestoreConfirm}
                className="btn bg-amber-500 hover:bg-amber-400 text-black font-bold flex-1"
              >
                Restaurar backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
