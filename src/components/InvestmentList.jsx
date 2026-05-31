import { useEffect, useMemo, useState } from 'react'
import {
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  LineChart,
  Pencil,
  Check,
  X,
  Search,
  SearchX,
} from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { usePortfolio } from '../hooks/usePortfolio.js'
import { formatBRL, formatPercent } from '../utils.js'
import RefreshButton from './RefreshButton.jsx'

const today = () => new Date().toISOString().slice(0, 10)

function PositionRow({ position, loading }) {
  const { inv, quote, hasQuote, current, pnl, pnlPct, dayChange, volatile, sector } = position
  const { removeInvestment, updateInvestment } = useFinance()
  const [editing, setEditing] = useState(false)
  const [ticker, setTicker] = useState(inv.ticker)
  const [quantity, setQuantity] = useState(String(inv.quantity))
  const [avgPrice, setAvgPrice] = useState(String(inv.avgPrice))
  const [date, setDate] = useState(inv.date || inv.createdAt?.slice(0, 10) || today())

  const startEdit = () => {
    setTicker(inv.ticker)
    setQuantity(String(inv.quantity))
    setAvgPrice(String(inv.avgPrice))
    setDate(inv.date || inv.createdAt?.slice(0, 10) || today())
    setEditing(true)
  }

  const save = () => {
    const qty = parseFloat(quantity)
    const price = parseFloat(avgPrice)
    if (!ticker.trim() || !qty || qty <= 0 || !price || price <= 0) return
    updateInvestment(inv.id, { ticker, quantity: qty, avgPrice: price, date })
    setEditing(false)
  }

  if (editing) {
    const inputCls =
      'w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-money-500 focus:outline-none focus:ring-2 focus:ring-money-100'
    return (
      <li className="space-y-2 bg-money-50/40 px-5 py-3.5">
        <div className="flex items-end gap-2">
          <div className="w-24 shrink-0">
            <label className="mb-1 block text-[10px] font-medium uppercase text-slate-500">Ticker</label>
            <input
              className={`${inputCls} uppercase`}
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase text-slate-500">Qtd</label>
            <input
              className={inputCls}
              type="number"
              step="1"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase text-slate-500">Preço médio</label>
            <input
              className={inputCls}
              type="number"
              step="0.01"
              min="0"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase text-slate-500">Data de compra</label>
            <input
              className={inputCls}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button
            onClick={save}
            className="shrink-0 rounded-lg bg-money-600 p-2 text-white transition hover:bg-money-700"
            aria-label="Salvar"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cancelar"
          >
            <X size={16} />
          </button>
        </div>
      </li>
    )
  }

  const posUp = pnl >= 0

  return (
    <li className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-800">{inv.ticker}</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {sector}
          </span>
          {volatile && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <AlertTriangle size={10} /> Volátil
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {inv.quantity} cotas · PM {formatBRL(inv.avgPrice)}
          {hasQuote && ` · cotação ${formatBRL(quote.price)}`}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {hasQuote ? (
          <>
            <p className={`font-semibold ${posUp ? 'text-money-600' : 'text-red-500'}`}>
              {formatBRL(current)}
            </p>
            <p
              className={`flex items-center justify-end gap-1 text-xs font-medium ${
                posUp ? 'text-money-600' : 'text-red-500'
              }`}
            >
              {posUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {formatBRL(pnl)} ({formatPercent(pnlPct)})
            </p>
            {dayChange != null && (
              <p className="text-[11px] text-slate-400">dia {formatPercent(dayChange)}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-400">{loading ? 'carregando…' : 'sem cotação'}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        <button
          onClick={startEdit}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-money-50 hover:text-money-600"
          aria-label="Editar posição"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => removeInvestment(inv.id)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          aria-label="Remover posição"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  )
}

export default function InvestmentList() {
  const { investments } = useFinance()
  const { positions, totals, loading, error, refresh, cooldownLeft } = usePortfolio()

  // Erros (ex.: rate limit) aparecem como popup só aqui, no componente de investimentos.
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!error) return
    setToast(error)
    const id = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(id)
  }, [error])

  // Busca + filtro por setor.
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('all')
  const sectors = useMemo(
    () => [...new Set(positions.map((p) => p.sector))].sort(),
    [positions]
  )
  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase()
    return positions.filter((p) => {
      if (sector !== 'all' && p.sector !== sector) return false
      if (q && !p.inv.ticker.includes(q)) return false
      return true
    })
  }, [positions, search, sector])

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-slate-400">
        <LineChart size={32} />
        <p className="text-sm">Nenhum investimento ainda. Adicione sua primeira posição!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo da carteira */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Carteira</h2>
          <RefreshButton loading={loading} cooldownLeft={cooldownLeft} onClick={refresh} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Investido</p>
            <p className="text-lg font-bold text-slate-800">{formatBRL(totals.invested)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Valor atual</p>
            <p className="text-lg font-bold text-slate-800">{formatBRL(totals.current)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-slate-500">Resultado</p>
            <p className={`text-lg font-bold ${totals.up ? 'text-money-600' : 'text-red-500'}`}>
              {formatBRL(totals.pnl)} ({formatPercent(totals.pnlPct)})
            </p>
          </div>
        </div>
      </div>

      {/* Posições */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm uppercase focus:border-money-500 focus:outline-none focus:ring-2 focus:ring-money-100"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              placeholder="Buscar ticker"
            />
          </div>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-money-500 focus:outline-none focus:ring-2 focus:ring-money-100"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            <option value="all">Todos os setores</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
            <SearchX size={28} />
            <p className="text-sm">Nenhuma posição encontrada com esses filtros.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <PositionRow key={p.inv.id} position={p} loading={loading} />
            ))}
          </ul>
        )}
      </div>

      {/* Popup de erro (rate limit, falha de cotação...) */}
      {toast && (
        <div
          style={{ animation: 'toast-in .2s ease-out' }}
          className="fixed bottom-6 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-lg"
          role="alert"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
          <span className="flex-1">{toast}</span>
          <button
            onClick={() => setToast(null)}
            aria-label="Fechar"
            className="shrink-0 rounded-md p-0.5 text-amber-500 transition hover:bg-amber-100"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
