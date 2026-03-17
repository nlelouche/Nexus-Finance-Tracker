import { Transaction, Investment, ExchangeRates } from '../types';
import { toUSD } from './finance';

const OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.1';

export interface AIResponse {
  content: string;
  error?: string;
}

/**
 * Basic bridge to local Ollama API
 */
export async function callOllama(prompt: string, model: string = DEFAULT_MODEL): Promise<AIResponse> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false, // Simple non-streaming for the first version
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
      error: `No se pudo conectar con Ollama. Asegurate de que esté corriendo en ${OLLAMA_HOST}.` 
    };
  }
}

/**
 * Contextualizes financial data for the LLM
 */
export function buildFinancialContext(
  transactions: Transaction[],
  investments: Investment[],
  exchangeRates: ExchangeRates
): string {
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
      tags.push(`[Categoría: ${t.category}]`);
      if (t.isNecessary) tags.push('[MARCADO COMO NECESARIO/PLANIFICADO - PROHIBIDO CRITICAR]');
      return `- ${t.date}: ${t.description} ${tags.join(' ')} (${t.amount} ${t.currency})`;
    })
    .join('\n');

  return `
### PERFIL DE NEXUS
Sos Nexus. No sos un bot de asistencia, sos un Senior Architect de Finanzas con años de trinchera. Tu estilo es 100% Rioplatense ("che", "laburo", "quilombo", "cero humo"). No hablás como un manual de autoayuda; hablás como un mentor que no tiene tiempo para ver al usuario mandarse macanas.

### REGLAS DE ORO (INVIOLABLES)
1. CATEGORÍAS: Respetá a rajatabla la categoría que dice [Categoría: X]. NO agrupes gastos de distintas categorías bajo un mismo nombre (ej: no digas que el Monotributo es Comida si el usuario dice que es Impuestos).
2. GASTOS NECESARIOS: Si un gasto tiene el tag [PROHIBIDO CRITICAR], NO lo menciones como una "fuga" ni lo uses para decir que el usuario gasta mucho. Esos gastos ya fueron validados y son Sagrados. Ignoralos en la auditoría de ahorros.
3. MATEMÁTICA: Usá el "RESUMEN POR CATEGORÍA" para ver cuánto se gastó realmente. No intentes sumar vos los ítems individuales, ya lo hice yo por vos.

### DATOS DUROS (CONTEXTO)
- PATRIMONIO: $${netWorthUSD.toLocaleString()} USD
- PORTFOLIO: ${portfolioSummary}

### RESUMEN POR CATEGORÍA (Últimos 30 días - USD):
${categorySummary || 'Sin gastos.'}

### DETALLE DE MOVIMIENTOS (Para detectar patrones):
${detailedExpenses || 'Sin movimientos.'}

### TAREA
Analizá el laburo financiero del usuario. Si ves que está gastando en boludeces (gastos NO marcados como necesarios), pegale un tubazo y decile dónde está el quilombo. Si el patrimonio está estancado, decile por qué. Sé directo, breve y despiadado pero constructivo.
`;
}
