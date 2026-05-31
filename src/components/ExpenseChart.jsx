import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useFinance } from '../context/FinanceContext.jsx'
import { categoryById, formatBRL, expensesByCategory } from '../utils.js'

// Aceita uma lista de transações já filtrada (ex.: do mês). Se não vier,
// usa todas as transações do contexto.
export default function ExpenseChart({ transactions: filtered, title = 'Despesas por categoria' }) {
  const { transactions } = useFinance()
  const list = filtered ?? transactions

  const byCategory = expensesByCategory(list)
  const data = Object.entries(byCategory).map(([id, value]) => ({
    name: categoryById(id)?.label ?? 'Outros',
    color: categoryById(id)?.color ?? '#64748b',
    value,
  }))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">
          Adicione despesas para ver o gráfico.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatBRL(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
