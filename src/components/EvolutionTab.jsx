import {
  BarChart,
  Bar,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { usePortfolioHistory } from '../hooks/usePortfolioHistory.js'
import {
  monthlyCashflow,
  expensesByCategoryOverTime,
  monthShort,
  formatBRL,
} from '../utils.js'
import { categoryById } from '../config/categories.js'

const brl = (v) => formatBRL(v)

function Panel({ title, children, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  )
}

function EmptyHint({ children }) {
  return <p className="py-10 text-center text-sm text-slate-400">{children}</p>
}

export default function EvolutionTab() {
  const { transactions, investments } = useFinance()
  const cashflow = monthlyCashflow(transactions)
  const { data: catData, categories } = expensesByCategoryOverTime(transactions)
  const { series: networth, loading: nwLoading, error: nwError } = usePortfolioHistory()

  // Patrimônio total mês a mês = saldo acumulado (caixa) + valor da carteira.
  const saldoByMonth = Object.fromEntries(cashflow.map((c) => [c.key, c.saldo]))
  const pfByMonth = Object.fromEntries(networth.map((p) => [p.key, p.value]))
  const allMonths = [...new Set([...cashflow.map((c) => c.key), ...networth.map((p) => p.key)])].sort()

  let cumCash = 0
  let lastPf = 0
  const networthData = allMonths.map((key) => {
    cumCash += saldoByMonth[key] ?? 0
    if (pfByMonth[key] != null) lastPf = pfByMonth[key] // carrega último valor conhecido
    return {
      label: monthShort(key),
      caixa: cumCash,
      carteira: lastPf,
      value: cumCash + lastPf,
    }
  })

  const hasInvestments = investments.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="text-money-600" size={20} />
        <h1 className="font-display text-xl font-semibold text-slate-900">Evolução de longo prazo</h1>
      </div>

      {/* Fluxo de caixa mensal */}
      <Panel title="Fluxo de caixa mensal" hint="Receitas e despesas por mês, com o saldo em destaque.">
        {cashflow.length === 0 ? (
          <EmptyHint>Adicione transações para ver a evolução.</EmptyHint>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} fontSize={11} width={48} />
              <Tooltip formatter={brl} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Line dataKey="saldo" name="Saldo" type="monotone" stroke="#0f172a" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Gastos por categoria no tempo */}
      <Panel title="Gastos por categoria no tempo" hint="Como cada categoria de despesa evolui mês a mês.">
        {catData.length === 0 ? (
          <EmptyHint>Sem despesas registradas ainda.</EmptyHint>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} fontSize={11} width={48} />
              <Tooltip formatter={brl} />
              {categories.map((id) => (
                <Bar
                  key={id}
                  dataKey={id}
                  name={categoryById(id)?.label ?? id}
                  stackId="cat"
                  fill={categoryById(id)?.color ?? '#64748b'}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Evolução do patrimônio total (caixa + carteira) */}
      <Panel
        title="Evolução do patrimônio"
        hint="Patrimônio total mês a mês: saldo acumulado em caixa + valor de mercado da carteira."
      >
        {nwLoading && hasInvestments ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Carregando histórico…
          </div>
        ) : networthData.length === 0 ? (
          <EmptyHint>Adicione transações ou investimentos para ver a evolução do patrimônio.</EmptyHint>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={networthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} fontSize={11} width={48} />
                <Tooltip formatter={brl} />
                <Legend />
                <Line
                  dataKey="value"
                  name="Patrimônio total"
                  type="monotone"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  dataKey="caixa"
                  name="Caixa"
                  type="monotone"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                {hasInvestments && (
                  <Line
                    dataKey="carteira"
                    name="Carteira"
                    type="monotone"
                    stroke="#0ea5e9"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            {nwError && hasInvestments && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                <AlertTriangle size={13} /> Alguns ativos sem histórico — a parte da carteira pode estar incompleta.
              </p>
            )}
          </>
        )}
      </Panel>
    </div>
  )
}
