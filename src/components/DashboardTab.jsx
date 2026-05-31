import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useFinance } from '../context/FinanceContext.jsx'
import { usePortfolio } from '../hooks/usePortfolio.js'
import {
  listMonths,
  monthLabel,
  transactionsOfMonth,
  sumTotals,
  monthlyCashflow,
  formatBRL,
} from '../utils.js'
import SummaryCards from './SummaryCards.jsx'
import ExpenseChart from './ExpenseChart.jsx'
import PortfolioSummary from './PortfolioSummary.jsx'

export default function DashboardTab({ onSeeEvolution }) {
  const { transactions, investments } = useFinance()
  const portfolio = usePortfolio()

  const months = listMonths(transactions, investments)
  // 'all' ou uma chave YYYY-MM. Default: mês mais recente, se houver.
  const [month, setMonth] = useState(months[0] ?? 'all')

  // "maio de 2026" → "Maio 2026" (rótulo curto e legível para as pílulas).
  const pillLabel = (m) => {
    const l = monthLabel(m).replace(' de ', ' ')
    return l.charAt(0).toUpperCase() + l.slice(1)
  }

  const filtered = month === 'all' ? transactions : transactionsOfMonth(transactions, month)
  const totals = sumTotals(filtered)

  const cashflow = monthlyCashflow(transactions).slice(-6)

  return (
    <div className="space-y-6">
      {/* Seletor de mês (pílulas) */}
      {months.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ id: 'all', label: 'Todos' }, ...months.map((m) => ({ id: m, label: pillLabel(m) }))].map(
            ({ id, label }) => {
              const active = month === id
              return (
                <button
                  key={id}
                  onClick={() => setMonth(id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-money-600 text-white shadow-sm shadow-money-600/20'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-money-300 hover:text-money-700'
                  }`}
                >
                  {label}
                </button>
              )
            }
          )}
        </div>
      )}

      <SummaryCards totals={totals} portfolio={portfolio} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExpenseChart
          transactions={filtered}
          title={month === 'all' ? 'Despesas por categoria' : `Despesas · ${monthLabel(month)}`}
        />
        <PortfolioSummary portfolio={portfolio} />
      </div>

      {/* Mini-evolução do saldo */}
      {cashflow.length > 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Evolução do saldo</h2>
            {onSeeEvolution && (
              <button
                onClick={onSeeEvolution}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-money-700 transition hover:bg-money-50"
              >
                <BarChart3 size={15} /> Ver evolução
              </button>
            )}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cashflow}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={(v) => formatBRL(v)} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="saldo" radius={[6, 6, 0, 0]}>
                {cashflow.map((c) => (
                  <Cell key={c.key} fill={c.saldo >= 0 ? '#059669' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
