import { useMemo, useState } from 'react'
import { Trash2, Inbox, Search, SearchX } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { categoryById, formatBRL, formatDate } from '../utils.js'

const TYPE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'receita', label: 'Receitas' },
  { id: 'despesa', label: 'Despesas' },
]

export default function TransactionList() {
  const { transactions, removeTransaction } = useFinance()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')

  // Categorias presentes nas transações (para o select).
  const categories = useMemo(() => {
    const ids = [...new Set(transactions.map((t) => t.category))]
    return ids
      .map((id) => ({ id, label: categoryById(id)?.label ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [transactions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions
      .filter((t) => {
        if (type !== 'all' && t.type !== type) return false
        if (category !== 'all' && t.category !== category) return false
        if (q) {
          const label = categoryById(t.category)?.label ?? ''
          if (!t.description.toLowerCase().includes(q) && !label.toLowerCase().includes(q))
            return false
        }
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, search, type, category])

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-slate-400">
        <Inbox size={32} />
        <p className="text-sm">Nenhuma transação ainda. Adicione a primeira!</p>
      </div>
    )
  }

  const field =
    'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-money-500 focus:outline-none focus:ring-2 focus:ring-money-100'

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold">Transações</h2>
        <span className="text-sm text-slate-400">
          {filtered.length} de {transactions.length}
        </span>
      </div>

      {/* Filtros */}
      <div className="space-y-3 border-b border-slate-100 px-5 py-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${field} w-full pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição ou categoria"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setType(f.id)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                  type === f.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            className={`${field} flex-1 sm:flex-none`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
          <SearchX size={28} />
          <p className="text-sm">Nenhuma transação encontrada com esses filtros.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filtered.map((t) => {
            const cat = categoryById(t.category)
            const isReceita = t.type === 'receita'
            return (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <span
                  className="h-9 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: cat?.color ?? '#64748b' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{t.description}</p>
                  <p className="text-xs text-slate-500">
                    {cat?.label ?? 'Outros'} · {formatDate(t.date)}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-semibold ${isReceita ? 'text-money-600' : 'text-red-500'}`}
                >
                  {isReceita ? '+' : '−'} {formatBRL(t.amount)}
                </span>
                <button
                  onClick={() => removeTransaction(t.id)}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="Remover transação"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
