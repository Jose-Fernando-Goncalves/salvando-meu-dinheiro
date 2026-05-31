// Re-exporta as categorias (agora modularizadas em config/categories.js) para
// manter compatibilidade com imports existentes (CATEGORIES, categoryById...).
export {
  CATEGORIES,
  CATEGORY_GROUPS,
  categoryById,
  categoriesByType,
  groupsByType,
  categoriesGroupedByType,
} from './config/categories.js'

export const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

export const formatPercent = (value) =>
  `${value >= 0 ? '+' : ''}${(value ?? 0).toFixed(2)}%`

// "2026-05" key for the month of a given ISO date string
export const monthKey = (iso) => iso.slice(0, 7)

export const monthLabel = (key) => {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

// Versão curta "mai/26" para eixos de gráficos.
export const monthShort = (key) => {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    .replace('.', '')
}

// ── Agregações mensais ────────────────────────────────────────────────────────

// Lista de meses (YYYY-MM) presentes nas transações/investimentos, mais recente primeiro.
export const listMonths = (transactions = [], investments = []) => {
  const set = new Set()
  for (const t of transactions) if (t.date) set.add(monthKey(t.date))
  for (const i of investments) {
    const d = i.date || i.createdAt
    if (d) set.add(monthKey(d))
  }
  return [...set].sort().reverse()
}

export const transactionsOfMonth = (transactions, key) =>
  key ? transactions.filter((t) => t.date && monthKey(t.date) === key) : transactions

// Totais de um conjunto de transações: { receitas, despesas, saldo }.
export const sumTotals = (transactions) => {
  let receitas = 0
  let despesas = 0
  for (const t of transactions) {
    if (t.type === 'receita') receitas += t.amount
    else despesas += t.amount
  }
  return { receitas, despesas, saldo: receitas - despesas }
}

// Série mensal ordenada (mais antigo → mais novo) com taxa de poupança.
export const monthlyCashflow = (transactions) => {
  const byMonth = {}
  for (const t of transactions) {
    if (!t.date) continue
    const k = monthKey(t.date)
    byMonth[k] = byMonth[k] || { receitas: 0, despesas: 0 }
    if (t.type === 'receita') byMonth[k].receitas += t.amount
    else byMonth[k].despesas += t.amount
  }
  return Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => {
      const saldo = v.receitas - v.despesas
      return {
        key,
        label: monthShort(key),
        receitas: v.receitas,
        despesas: v.despesas,
        saldo,
        poupancaPct: v.receitas ? (saldo / v.receitas) * 100 : 0,
      }
    })
}

// Mapa { categoryId: total } das despesas de uma lista de transações.
export const expensesByCategory = (transactions) => {
  const byCategory = {}
  for (const t of transactions) {
    if (t.type !== 'despesa') continue
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  }
  return byCategory
}

// Série mensal de despesas por categoria para gráfico de tendência:
// { data: [{ key, label, <catId>: valor, ... }], categories: [ids presentes] }
export const expensesByCategoryOverTime = (transactions) => {
  const months = {}
  const cats = new Set()
  for (const t of transactions) {
    if (t.type !== 'despesa' || !t.date) continue
    const k = monthKey(t.date)
    months[k] = months[k] || {}
    months[k][t.category] = (months[k][t.category] ?? 0) + t.amount
    cats.add(t.category)
  }
  const categories = [...cats]
  const data = Object.keys(months)
    .sort()
    .map((key) => {
      const row = { key, label: monthShort(key) }
      for (const c of categories) row[c] = months[key][c] ?? 0
      return row
    })
  return { data, categories }
}
