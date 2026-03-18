import { Transaction, Investment, ExchangeRates } from '../types';
import { toUSD } from './finance';

export interface AIResponse {
  content: string;
  error?: string;
}

/**
 * Basic bridge to local Ollama API
 * Use the dynamic config from the store
 */
export async function callOllama(
  prompt: string, 
  config: { host: string; model: string }
): Promise<AIResponse> {
  try {
    const response = await fetch(`${config.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return { content: data.response };
  } catch (err: any) {
    console.error('AI Bridge Error:', err);
    return { 
      content: '', 
      error: `No se pudo conectar con Ollama. Asegurate de que esté corriendo en ${config.host}.` 
    };
  }
}

/**
 * Contextualizes financial data for the LLM
 */
export function buildFinancialContext(
  transactions: Transaction[],
  investments: Investment[],
  exchangeRates: ExchangeRates,
  lng: string = 'en'
): string {
  const isEn = lng.startsWith('en');

  const netWorthUSD = investments.reduce((acc, inv) => acc + toUSD(inv.current, inv.currency, exchangeRates), 0);
  
  // Group assets
  const portfolioSummary = investments.map(i => `${i.name} [${i.category}]: ${i.current} ${i.currency}`).join(', ');

  // Stats for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTx = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  
  // Pre-calculate sums by category for expenses (to prevent AI math errors)
  const categoryTotals: Record<string, number> = {};
  recentTx.filter(t => t.type === 'expense').forEach(t => {
    const amountUSD = toUSD(t.amount, t.currency, exchangeRates);
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amountUSD;
  });

  const categorySummary = Object.entries(categoryTotals)
    .map(([cat, val]) => `- ${cat}: $${val.toFixed(2)} USD`)
    .join('\n');

  const detailedExpenses = recentTx
    .filter(t => t.type === 'expense')
    .map(t => {
      const tags = [];
      const catLabel = isEn ? 'Category' : 'Categoría';
      tags.push(`[${catLabel}: ${t.category}]`);
      if (t.isNecessary) {
        tags.push(isEn ? '[DO NOT CRITICIZE - NECESSARY]' : '[PROHIBIDO CRITICAR - NECESARIO]');
      }
      return `- ${t.date}: ${t.description} ${tags.join(' ')} (${t.amount} ${t.currency})`;
    })
    .join('\n');

  if (isEn) {
    return `
### NEXUS PROFILE
You are Nexus. You are not a regular support bot; you are a Senior Financial Architect and Investor with years of real-world experience. Your style is direct, professional, ruthless, and no-nonsense. You don't speak like a self-help book; you speak like a strict mentor who has no time to watch the user make financial mistakes.

### GOLDEN RULES (UNBREAKABLE)
1. CATEGORIES: Strictly respect the category specified in [Category: X]. DO NOT group expenses from different categories under the same name.
2. NECESSARY EXPENSES: If an expense has the tag [DO NOT CRITICIZE], DO NOT mention it as a "money leak" or use it to claim the user is overspending. Those expenses are justified and planned. Ignore them in your savings audit.
3. MATH: Use the "CATEGORY SUMMARY" to see how much was actually spent. The calculations have already been done by the system.

### HARD DATA (CONTEXT)
- NET WORTH: $${netWorthUSD.toLocaleString()} USD
- PORTFOLIO: ${portfolioSummary}

### CATEGORY SUMMARY (Last 30 days - USD):
${categorySummary || 'No recent expenses.'}

### DETAILED TRANSACTIONS (To detect patterns):
${detailedExpenses || 'No recent transactions.'}
`;
  }

  return `
### PERFIL DE NEXUS
Eres Nexus. No eres un bot de asistencia, eres un Consultor e Inversor Senior de Finanzas con años de experiencia en la trinchera. Tu estilo es directo, profesional, implacable y sin rodeos. No hablas como un manual de autoayuda; hablas como un mentor estricto que no tiene tiempo para ver al usuario cometer errores financieros.

### REGLAS DE ORO (INVIOLABLES)
1. CATEGORÍAS: Respeta estrictamente la categoría que dice [Categoría: X]. NO agrupes gastos de distintas categorías bajo un mismo nombre.
2. GASTOS NECESARIOS: Si un gasto tiene la etiqueta [PROHIBIDO CRITICAR], NO lo menciones como una "fuga de dinero" ni lo uses para decir que el usuario gasta mucho. Esos gastos ya fueron justificados y planificados. Ignóralos en la auditoría de ahorros.
3. MATEMÁTICA: Usa el "RESUMEN POR CATEGORÍA" para ver cuánto se gastó realmente. Los cálculos ya fueron hechos por el sistema.

### DATOS DUROS (CONTEXTO)
- PATRIMONIO: $${netWorthUSD.toLocaleString()} USD
- PORTFOLIO: ${portfolioSummary}

### RESUMEN POR CATEGORÍA (Últimos 30 días - USD):
${categorySummary || 'Sin gastos recientes.'}

### DETALLE DE MOVIMIENTOS (Para detectar patrones):
${detailedExpenses || 'Sin movimientos recientes.'}
`;
}

