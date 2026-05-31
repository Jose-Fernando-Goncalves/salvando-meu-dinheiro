import { useEffect, useState } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { fetchHistory } from '../services/brapi.js'
import { monthKey } from '../utils.js'

// Reconstrói o valor da carteira mês a mês: para cada mês, soma
// (preço de fechamento do mês × quantidade) das posições já compradas até ali.
// Combina o histórico da brapi com a data de compra de cada investimento.
export function usePortfolioHistory() {
  const { investments } = useFinance()
  const tickers = [...new Set(investments.map((i) => i.ticker.toUpperCase()))]
  const key = tickers.sort().join(',')

  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (tickers.length === 0) {
      setSeries([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all(
      tickers.map(async (t) => {
        try {
          return [t, await fetchHistory(t, { range: '1y', interval: '1mo' })]
        } catch {
          return [t, []]
        }
      })
    )
      .then((entries) => {
        if (cancelled) return
        const histByTicker = Object.fromEntries(entries)

        // Conjunto de meses presentes em qualquer histórico.
        const monthsSet = new Set()
        for (const hist of Object.values(histByTicker)) {
          for (const h of hist) monthsSet.add(monthKey(h.date))
        }
        const months = [...monthsSet].sort()

        // Último fechamento conhecido por ticker até cada mês (carry-forward).
        const lastCloseByTicker = {}
        const data = months.map((m) => {
          let total = 0
          for (const inv of investments) {
            const t = inv.ticker.toUpperCase()
            const hist = histByTicker[t] || []
            const point = hist.find((h) => monthKey(h.date) === m)
            if (point) lastCloseByTicker[t] = point.close
            const close = lastCloseByTicker[t] ?? inv.avgPrice
            const purchaseMonth = monthKey(inv.date || inv.createdAt || m)
            if (m >= purchaseMonth) total += close * inv.quantity
          }
          return { key: m, value: total }
        })

        setSeries(data)
        setError(entries.every(([, h]) => h.length === 0) ? 'Histórico indisponível' : null)
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, investments])

  return { series, loading, error }
}
