export const getDaysRemaining = (targetDate: string) => {
  const [year, month] = targetDate.split('-').map(Number);
  const target = new Date(year, month - 1, 1);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const getMonthsRemaining = (targetDate: string) => {
  const [year, month] = targetDate.split('-').map(Number);
  const now = new Date();
  return Math.max(0, (year - now.getFullYear()) * 12 + (month - (now.getMonth() + 1)));
};

export const getTrackingStatus = (startDate: string, targetDate: string, currentAmount: number, targetAmount: number) => {
  const [sy, sm] = startDate.split('-').map(Number);
  const [ty, tm] = targetDate.split('-').map(Number);
  const now = new Date();

  const start = new Date(sy, sm - 1, 1);
  const end = new Date(ty, tm - 1, 1);

  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();

  if (totalMs <= 0 || elapsedMs <= 0) return null;

  const timeProgress = Math.min(1, elapsedMs / totalMs);
  const expectedAmount = targetAmount * timeProgress;
  const diff = currentAmount - expectedAmount;
  const diffPct = expectedAmount > 0 ? (diff / expectedAmount) * 100 : 0;

  if (currentAmount >= targetAmount) {
    return { status: 'complete', label: '✅ Meta alcanzada', sub: '', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', expectedAmount, diffPct };
  }
  if (diffPct >= 10) {
    return { status: 'ahead', label: '🚀 Adelantado', sub: `+${diffPct.toFixed(0)}% sobre lo esperado`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', expectedAmount, diffPct };
  }
  if (diffPct >= -10) {
    return { status: 'on-track', label: '✅ En tiempo', sub: 'Vas perfecto, seguí así', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', expectedAmount, diffPct };
  }
  if (diffPct >= -30) {
    return { status: 'behind', label: '⚠️ Atrasado', sub: `${Math.abs(diffPct).toFixed(0)}% por debajo de lo esperado`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', expectedAmount, diffPct };
  }
  return { status: 'critical', label: '🔴 Muy atrasado', sub: `${Math.abs(diffPct).toFixed(0)}% por debajo — revisá tu plan`, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', expectedAmount, diffPct };
};

// Proyecta cuándo terminarás al ritmo mensual actual
export const getProjection = (startDate: string, targetDate: string, currentAmount: number, targetAmount: number) => {
  const [sy, sm] = startDate.split('-').map(Number);
  const now = new Date();
  const start = new Date(sy, sm - 1, 1);
  const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

  if (monthsElapsed <= 0 || currentAmount <= 0) return null;

  const monthlyRate = currentAmount / monthsElapsed;
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return null;

  const monthsToFinish = Math.ceil(remaining / monthlyRate);
  const projectedDate = new Date(now.getFullYear(), now.getMonth() + monthsToFinish, 1);
  const projectedStr = projectedDate.toISOString().slice(0, 7);

  // Comparar con targetDate
  const [ty, tm] = targetDate.split('-').map(Number);
  const targetDateObj = new Date(ty, tm - 1, 1);
  const diffMs = targetDateObj.getTime() - projectedDate.getTime();
  const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));

  return {
    projectedDate: projectedStr,
    monthsToFinish,
    diffMonths, // positivo = terminás antes, negativo = terminás después
    monthlyRate,
  };
};

export const GOAL_EMOJIS = ['🎯', '🏠', '🚗', '✈️', '💍', '🎓', '💻', '⛵', '🏔️', '🎸'];
