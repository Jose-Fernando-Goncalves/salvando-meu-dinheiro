import { TrendingUp, TrendingDown, Wallet, LineChart, Landmark } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { formatBRL, formatPercent } from '../utils.js'

// `totals` (do mês ou geral) e, opcionalmente, `portfolio` para os cards de
// Carteira e Patrimônio total. Sem totals usa os totais gerais do contexto.
export default function SummaryCards({ totals: totalsProp, portfolio }) {
  const { totals: ctxTotals } = useFinance()
  const totals = totalsProp ?? ctxTotals

  const cards = [
    {
      label: 'Receitas',
      value: totals.receitas,
      icon: TrendingUp,
      accent: 'text-money-600',
      ring: 'bg-money-100',
    },
    {
      label: 'Despesas',
      value: totals.despesas,
      icon: TrendingDown,
      accent: 'text-red-500',
      ring: 'bg-red-100',
    },
    {
      label: 'Saldo',
      value: totals.saldo,
      icon: Wallet,
      accent: totals.saldo >= 0 ? 'text-money-600' : 'text-red-500',
      ring: totals.saldo >= 0 ? 'bg-money-100' : 'bg-red-100',
    },
  ]

  const hasPortfolio = portfolio && portfolio.totals.current > 0
  if (hasPortfolio) {
    cards.push({
      label: 'Carteira',
      value: portfolio.totals.current,
      icon: LineChart,
      accent: portfolio.totals.up ? 'text-money-600' : 'text-red-500',
      ring: portfolio.totals.up ? 'bg-money-100' : 'bg-red-100',
      sub: `${formatPercent(portfolio.totals.pnlPct)} no total`,
      subUp: portfolio.totals.up,
    })
  }

  return (
    <div className="space-y-4">
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          hasPortfolio ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
        }`}
      >
        {cards.map(({ label, value, icon: Icon, accent, ring, sub, subUp }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${ring}`}>
                <Icon className={accent} size={18} />
              </div>
              <p className="text-sm font-medium text-slate-500">{label}</p>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${accent}`}>{formatBRL(value)}</p>
            {sub && (
              <p className={`mt-0.5 text-xs font-medium ${subUp ? 'text-money-600' : 'text-red-500'}`}>
                {sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {hasPortfolio && (
        <div className="rounded-2xl border border-money-200 bg-gradient-to-br from-money-50 to-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-money-600 text-white">
                <Landmark size={22} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Patrimônio total</p>
                <p className="text-3xl font-bold tabular-nums text-slate-900">
                  {formatBRL(ctxTotals.saldo + portfolio.totals.current)}
                </p>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-xs text-slate-500">Caixa</p>
                <p className="font-semibold tabular-nums text-slate-700">{formatBRL(ctxTotals.saldo)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Carteira</p>
                <p className="font-semibold tabular-nums text-slate-700">
                  {formatBRL(portfolio.totals.current)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
