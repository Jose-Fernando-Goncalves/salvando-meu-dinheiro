import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { categoriesByType, categoriesGroupedByType } from '../utils.js'

const today = () => new Date().toISOString().slice(0, 10)

export default function TransactionForm() {
  const { addTransaction } = useFinance()
  const [type, setType] = useState('despesa')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(() => categoriesByType('despesa')[0]?.id ?? 'outros')
  const [date, setDate] = useState(today())

  const grouped = categoriesGroupedByType(type)

  const handleType = (next) => {
    setType(next)
    setCategory(categoriesByType(next)[0]?.id ?? 'outros')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!description.trim() || !value || value <= 0) return
    addTransaction({ type, description: description.trim(), amount: value, category, date })
    setDescription('')
    setAmount('')
  }

  const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-money-500 focus:outline-none focus:ring-2 focus:ring-money-100'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold">Nova transação</h2>

      <div className="grid grid-cols-2 gap-2">
        {['receita', 'despesa'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleType(t)}
            className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
              type === t
                ? t === 'receita'
                  ? 'bg-money-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Descrição</label>
        <input
          className={field}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Mercado do mês"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Valor (R$)</label>
          <input
            className={field}
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Data</label>
          <input
            className={field}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Categoria</label>
        <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
          {grouped.map(({ group, categories }) => (
            <optgroup key={group.id} label={group.label}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-money-600 py-2.5 font-semibold text-white transition hover:bg-money-700"
      >
        <Plus size={18} />
        Adicionar
      </button>
    </form>
  )
}
