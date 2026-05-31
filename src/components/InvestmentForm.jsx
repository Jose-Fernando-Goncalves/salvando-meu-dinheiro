import { useEffect, useRef, useState } from 'react'
import { Plus, Loader2, Search } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { fetchCloseOn, searchTickers } from '../services/brapi.js'
import { formatBRL } from '../utils.js'

const today = () => new Date().toISOString().slice(0, 10)

export default function InvestmentForm() {
  const { addInvestment } = useFinance()
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [avgPrice, setAvgPrice] = useState('')
  const [date, setDate] = useState(today())

  // Cotação do dia selecionado (default para o preço médio).
  const [quote, setQuote] = useState({ loading: false, close: null, error: null })
  const priceTouched = useRef(false) // não sobrescreve se o usuário digitar

  // Busca de tickers (autocomplete).
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = ticker.trim()
    if (t.length < 2) {
      setSuggestions([])
      setSearching(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const id = setTimeout(async () => {
      try {
        const r = await searchTickers(t)
        if (!cancelled) setSuggestions(r)
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [ticker])

  const selectTicker = (t) => {
    setTicker(t)
    setSuggestions([])
    setOpen(false)
  }

  // Busca a cotação de fechamento do ticker na data escolhida (debounced).
  useEffect(() => {
    const t = ticker.trim().toUpperCase()
    if (t.length < 4 || !date) {
      setQuote({ loading: false, close: null, error: null })
      return
    }
    let cancelled = false
    setQuote((q) => ({ ...q, loading: true, error: null }))
    const id = setTimeout(async () => {
      try {
        const close = await fetchCloseOn(t, date)
        if (cancelled) return
        setQuote({ loading: false, close, error: close == null ? 'sem cotação para a data' : null })
        if (close != null && !priceTouched.current) setAvgPrice(String(close))
      } catch (err) {
        if (!cancelled) setQuote({ loading: false, close: null, error: err.message })
      }
    }, 600)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [ticker, date])

  const handleSubmit = (e) => {
    e.preventDefault()
    const qty = parseFloat(quantity)
    const price = parseFloat(avgPrice)
    if (!ticker.trim() || !qty || qty <= 0 || !price || price <= 0) return
    addInvestment({ ticker, quantity: qty, avgPrice: price, date })
    setTicker('')
    setQuantity('')
    setAvgPrice('')
    setDate(today())
    setQuote({ loading: false, close: null, error: null })
    priceTouched.current = false
    setSuggestions([])
    setOpen(false)
  }

  const field =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-money-500 focus:outline-none focus:ring-2 focus:ring-money-100'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold">Nova posição</h2>
        <p className="text-xs text-slate-500">Ações e fundos da B3</p>
      </div>

      <div className="relative">
        <label className="mb-1 block text-sm font-medium text-slate-600">Ação / Fundo</label>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${field} pl-9 uppercase`}
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value.toUpperCase())
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder="Buscar ticker (ex: PETR4, VALE3)"
            maxLength={10}
            autoComplete="off"
          />
          {searching && (
            <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>

        {open && ticker.trim().length >= 2 && (suggestions.length > 0 || (!searching)) && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {suggestions.length === 0 && !searching ? (
              <li className="px-3 py-2 text-sm text-slate-400">Nenhum ativo encontrado</li>
            ) : (
              suggestions.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectTicker(t)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-money-50 hover:text-money-700"
                  >
                    <span className="font-semibold">{t}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Data de compra</label>
        <input
          className={field}
          type="date"
          max={today()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Quantidade</label>
          <input
            className={field}
            type="number"
            step="1"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Preço médio (R$)</label>
          <input
            className={field}
            type="number"
            step="0.01"
            min="0"
            value={avgPrice}
            onChange={(e) => {
              priceTouched.current = true
              setAvgPrice(e.target.value)
            }}
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Cotação da data selecionada */}
      {(quote.loading || quote.close != null || quote.error) && (
        <p className="-mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          {quote.loading ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Buscando cotação da data…
            </>
          ) : quote.close != null ? (
            <>
              Cotação em {date.split('-').reverse().join('/')}:{' '}
              <strong className="text-slate-700">{formatBRL(quote.close)}</strong>
              {priceTouched.current && (
                <button
                  type="button"
                  onClick={() => {
                    priceTouched.current = false
                    setAvgPrice(String(quote.close))
                  }}
                  className="font-medium text-money-600 hover:underline"
                >
                  usar
                </button>
              )}
            </>
          ) : (
            <span className="text-amber-600">Sem cotação para a data — informe o preço manualmente.</span>
          )}
        </p>
      )}

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-money-600 py-2.5 font-semibold text-white transition hover:bg-money-700"
      >
        <Plus size={18} />
        Adicionar posição
      </button>
    </form>
  )
}
