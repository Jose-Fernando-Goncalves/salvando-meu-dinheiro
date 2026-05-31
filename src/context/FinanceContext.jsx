import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const TX_KEY = 'smd:transactions:v1'
const INV_KEY = 'smd:investments:v1'

const FinanceContext = createContext(null)

const loadInitial = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState(() => loadInitial(TX_KEY))
  const [investments, setInvestments] = useState(() => loadInitial(INV_KEY))

  useEffect(() => {
    localStorage.setItem(TX_KEY, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(INV_KEY, JSON.stringify(investments))
  }, [investments])

  const addTransaction = (tx) => {
    setTransactions((prev) => [
      { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...tx },
      ...prev,
    ])
  }

  const removeTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const addInvestment = (inv) => {
    setInvestments((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...inv,
        ticker: inv.ticker.trim().toUpperCase(),
      },
      ...prev,
    ])
  }

  const removeInvestment = (id) => {
    setInvestments((prev) => prev.filter((i) => i.id !== id))
  }

  const updateInvestment = (id, fields) => {
    setInvestments((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              ...fields,
              ...(fields.ticker ? { ticker: fields.ticker.trim().toUpperCase() } : {}),
            }
          : i
      )
    )
  }

  const clearAll = () => {
    setTransactions([])
    setInvestments([])
  }

  const totals = useMemo(() => {
    let receitas = 0
    let despesas = 0
    for (const t of transactions) {
      if (t.type === 'receita') receitas += t.amount
      else despesas += t.amount
    }
    return { receitas, despesas, saldo: receitas - despesas }
  }, [transactions])

  const value = {
    transactions,
    investments,
    addTransaction,
    removeTransaction,
    addInvestment,
    removeInvestment,
    updateInvestment,
    clearAll,
    totals,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance precisa estar dentro de FinanceProvider')
  return ctx
}
