import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { useQuotes } from './useQuotes.js'
import { sectorOf } from '../config/sectors.js'

const VOLATILITY_THRESHOLD = 3 // % de variação diária

// Fonte única da carteira: combina os investimentos com a cotação ao vivo e
// devolve posições, totais e agrupamento por setor já calculados.
export function usePortfolio({ intervalMs = 60000 } = {}) {
  const { investments } = useFinance()
  const tickers = investments.map((i) => i.ticker)
  const { quotes, loading, error, refresh, cooldownLeft } = useQuotes(tickers, { intervalMs })

  return useMemo(() => {
    const positions = investments.map((inv) => {
      const quote = quotes[inv.ticker]
      const invested = inv.avgPrice * inv.quantity
      const hasQuote = quote && quote.price != null
      const current = hasQuote ? quote.price * inv.quantity : invested
      const pnl = hasQuote ? current - invested : 0
      const pnlPct = invested ? (pnl / invested) * 100 : 0
      const dayChange = quote?.changePercent ?? null
      const volatile = dayChange != null && Math.abs(dayChange) >= VOLATILITY_THRESHOLD
      return {
        inv,
        quote,
        hasQuote,
        invested,
        current,
        pnl,
        pnlPct,
        dayChange,
        volatile,
        sector: sectorOf(inv.ticker),
      }
    })

    let invested = 0
    let current = 0
    const sectorMap = {}
    for (const p of positions) {
      invested += p.invested
      current += p.current
      sectorMap[p.sector] = (sectorMap[p.sector] ?? 0) + p.current
    }
    const pnl = current - invested
    const pnlPct = invested ? (pnl / invested) * 100 : 0

    const bySector = Object.entries(sectorMap)
      .map(([sector, value]) => ({ sector, value }))
      .sort((a, b) => b.value - a.value)

    return {
      positions,
      totals: { invested, current, pnl, pnlPct, up: pnl >= 0 },
      bySector,
      quotes,
      loading,
      error,
      refresh,
      cooldownLeft,
    }
  }, [investments, quotes, loading, error, refresh, cooldownLeft])
}
