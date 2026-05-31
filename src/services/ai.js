// Consultor financeiro via Cloudflare Worker (que esconde a chave do Gemini).
// Monta prompts em pt-BR a partir dos dados e fala com o endpoint /analyze.

import { formatBRL, monthlyCashflow, monthShort } from '../utils.js'
import { categoryById } from '../config/categories.js'
import { sectorOf } from '../config/sectors.js'

const WORKER_URL = import.meta.env.VITE_WORKER_URL

const VOLATILITY_THRESHOLD = 3 // % de variação diária que dispara alerta

// Resumo financeiro do usuário, reutilizado pela análise e pelo chat.
function buildContext({ totals, transactions, investments, quotes }) {
  const byCategory = {}
  for (const t of transactions) {
    if (t.type !== 'despesa') continue
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  }
  const despesasLinhas =
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([id, v]) => `- ${categoryById(id)?.label ?? id}: ${formatBRL(v)}`)
      .join('\n') || '- (nenhuma despesa registrada)'

  const invLinhas = investments.length
    ? investments
        .map((inv) => {
          const q = quotes[inv.ticker]
          const invested = inv.avgPrice * inv.quantity
          if (!q || q.price == null) {
            return `- ${inv.ticker}: ${inv.quantity} cotas, preço médio ${formatBRL(inv.avgPrice)}, investido ${formatBRL(invested)} (cotação indisponível)`
          }
          const current = q.price * inv.quantity
          const pnl = current - invested
          const pnlPct = invested ? (pnl / invested) * 100 : 0
          const vol =
            Math.abs(q.changePercent ?? 0) >= VOLATILITY_THRESHOLD ? ' [ALTA VOLATILIDADE]' : ''
          return `- ${inv.ticker}: ${inv.quantity} cotas | preço médio ${formatBRL(inv.avgPrice)} | cotação ${formatBRL(q.price)} (${(q.changePercent ?? 0).toFixed(2)}% no dia) | investido ${formatBRL(invested)} → atual ${formatBRL(current)} | resultado ${formatBRL(pnl)} (${pnlPct.toFixed(2)}%)${vol}`
        })
        .join('\n')
    : '- (nenhum investimento registrado)'

  // Evolução mensal (últimos 6 meses) do fluxo de caixa
  const cashflow = monthlyCashflow(transactions).slice(-6)
  const evolucaoLinhas = cashflow.length
    ? cashflow
        .map(
          (m) =>
            `- ${monthShort(m.key)}: receitas ${formatBRL(m.receitas)}, despesas ${formatBRL(m.despesas)}, saldo ${formatBRL(m.saldo)} (poupança ${m.poupancaPct.toFixed(0)}%)`
        )
        .join('\n')
    : '- (sem histórico mensal)'

  // Carteira agrupada por setor (pelo valor atual)
  const sectorMap = {}
  for (const inv of investments) {
    const q = quotes[inv.ticker]
    const value = (q?.price ?? inv.avgPrice) * inv.quantity
    const s = sectorOf(inv.ticker)
    sectorMap[s] = (sectorMap[s] ?? 0) + value
  }
  const setorLinhas =
    Object.entries(sectorMap)
      .sort((a, b) => b[1] - a[1])
      .map(([s, v]) => `- ${s}: ${formatBRL(v)}`)
      .join('\n') || '- (sem investimentos)'

  return `## Resumo financeiro do usuário
- Receitas totais: ${formatBRL(totals.receitas)}
- Despesas totais: ${formatBRL(totals.despesas)}
- Saldo: ${formatBRL(totals.saldo)}

## Despesas por categoria
${despesasLinhas}

## Evolução mensal (fluxo de caixa)
${evolucaoLinhas}

## Carteira de investimentos (cotações em tempo real)
${invLinhas}

## Carteira por setor
${setorLinhas}`
}

const SYSTEM = `Você é o assistente financeiro do app "Salvando Meu Dinheiro": um consultor pessoal experiente, didático e objetivo. Responda SEMPRE em português do Brasil, em markdown enxuto (use bullets e negrito quando ajudar). Baseie-se nos dados do usuário abaixo, considerando também a EVOLUÇÃO MENSAL (tendências de gastos subindo/caindo, poupança ao longo do tempo) e a DIVERSIFICAÇÃO POR SETOR da carteira — não só o retrato atual. Quando opinar sobre ações/investimentos, lembre que não é recomendação financeira.`

async function callWorker(prompt) {
  if (!WORKER_URL) {
    throw new Error('VITE_WORKER_URL não configurada (.env.local)')
  }
  const url = `${WORKER_URL.replace(/\/$/, '')}/analyze`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json()).error ?? ''
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Falha na IA (HTTP ${res.status})`)
  }
  const data = await res.json()
  return data.analysis ?? ''
}

// Análise completa estruturada (usada pelo botão de atalho do chat).
export async function analyzeFinances(payload) {
  const prompt = `${SYSTEM}

${buildContext(payload)}

Faça uma análise completa e minuciosa estruturada EXATAMENTE com estas quatro seções (use \`##\`):

## 💰 Cortes de gastos
Categorias com gasto desproporcional e onde cortar, com valores e economia mensal estimada.

## 📊 Saúde financeira
Relação receita/despesa, taxa de poupança e saldo. Dê uma nota geral e o que melhorar.

## 📈 Sugestões de ações/investimentos
Comente a carteira atual e possibilidades de diversificação/ajuste, de forma equilibrada.

## ⚠️ Alertas de volatilidade
Investimentos com maior oscilação e o risco geral da carteira.

Ao final, inclua em itálico: *"Conteúdo gerado por IA — não é recomendação de investimento."*`
  return callWorker(prompt)
}

// Conversa: recebe o histórico (mensagens {role, content}) + a pergunta nova.
export async function chatAboutFinances({ messages, ...payload }) {
  const history = messages
    .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
    .join('\n\n')

  const prompt = `${SYSTEM}

${buildContext(payload)}

## Conversa até agora
${history}

Responda à última mensagem do usuário de forma direta e útil, considerando o histórico e os dados acima.`
  return callWorker(prompt)
}
