import { TrendingUp, TrendingDown, AlertTriangle, PieChart } from 'lucide-react'
import { formatBRL, formatPercent } from '../utils.js'
import { sectorColor } from '../config/sectors.js'
import RefreshButton from './RefreshButton.jsx'

// Painel presentacional: recebe o objeto de usePortfolio() por prop.
export default function PortfolioSummary({ portfolio }) {
  const { positions, totals, bySector, loading, refresh, cooldownLeft } = portfolio

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-slate-400">
        <PieChart size={28} />
        <p className="text-sm">Sem investimentos. Adicione posições na aba Investimentos.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Carteira ao vivo</h2>
        <RefreshButton loading={loading} cooldownLeft={cooldownLeft} onClick={refresh} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-medium text-slate-500">Investido</p>
          <p className="text-sm font-bold text-slate-800">{formatBRL(totals.invested)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-medium text-slate-500">Atual</p>
          <p className="text-sm font-bold text-slate-800">{formatBRL(totals.current)}</p>
        </div>
        <div className={`rounded-xl p-3 ${totals.up ? 'bg-money-50' : 'bg-red-50'}`}>
          <p className="text-[11px] font-medium text-slate-500">Resultado</p>
          <p className={`flex items-center justify-center gap-1 text-sm font-bold ${totals.up ? 'text-money-600' : 'text-red-500'}`}>
            {totals.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {formatPercent(totals.pnlPct)}
          </p>
        </div>
      </div>

      {/* Posições */}
      <ul className="mt-4 divide-y divide-slate-100">
        {positions.map((p) => (
          <li key={p.inv.id} className="flex items-center justify-between gap-2 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: sectorColor(p.sector) }}
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.inv.ticker}</p>
                <p className="text-[11px] text-slate-400">{p.sector}</p>
              </div>
              {p.volatile && <AlertTriangle size={13} className="text-amber-500" />}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{formatBRL(p.current)}</p>
              <p className={`text-[11px] font-medium ${p.pnl >= 0 ? 'text-money-600' : 'text-red-500'}`}>
                {formatPercent(p.pnlPct)}
                {p.dayChange != null && (
                  <span className="ml-1 text-slate-400">· dia {formatPercent(p.dayChange)}</span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Por setor */}
      {bySector.length > 1 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold text-slate-500">Por setor</p>
          <div className="space-y-1.5">
            {bySector.map(({ sector, value }) => {
              const pct = totals.current ? (value / totals.current) * 100 : 0
              return (
                <div key={sector} className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: sectorColor(sector) }}
                    />
                  </div>
                  <span className="w-28 shrink-0 truncate text-[11px] text-slate-500">{sector}</span>
                  <span className="w-10 shrink-0 text-right text-[11px] font-medium text-slate-600">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
