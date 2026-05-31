import { useState } from 'react'
import {
  PiggyBank,
  Trash,
  LayoutDashboard,
  ArrowLeftRight,
  LineChart,
  TrendingUp,
} from 'lucide-react'
import { useFinance } from './context/FinanceContext.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import TransactionList from './components/TransactionList.jsx'
import InvestmentForm from './components/InvestmentForm.jsx'
import InvestmentList from './components/InvestmentList.jsx'
import DashboardTab from './components/DashboardTab.jsx'
import EvolutionTab from './components/EvolutionTab.jsx'
import ChatWidget from './components/ChatWidget.jsx'

const TABS = [
  { id: 'painel', label: 'Painel', icon: LayoutDashboard },
  { id: 'lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
  { id: 'investimentos', label: 'Investimentos', icon: LineChart },
  { id: 'evolucao', label: 'Evolução', icon: TrendingUp },
]

export default function App() {
  const { transactions, investments, clearAll } = useFinance()
  const [tab, setTab] = useState('painel')

  const handleClear = () => {
    if (transactions.length === 0 && investments.length === 0) return
    if (confirm('Apagar todas as transações e investimentos? Esta ação não pode ser desfeita.'))
      clearAll()
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Fundo com textura em gradiente esmeralda */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60rem 40rem at 110% -10%, rgba(16,185,129,0.12), transparent 60%), radial-gradient(50rem 35rem at -10% 110%, rgba(5,150,105,0.10), transparent 55%)',
        }}
      />

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-money-500 to-money-700">
              <PiggyBank className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold leading-none tracking-tight text-slate-900">
                Salvando Meu Dinheiro
              </h1>
              <p className="mt-1 text-xs text-slate-500">Controle, invista e analise com IA</p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash size={16} />
            <span className="hidden sm:inline">Limpar tudo</span>
          </button>
        </div>

        {/* Abas */}
        <div className="mx-auto max-w-5xl px-4">
          <nav className="-mb-px flex gap-1 overflow-x-auto pb-px">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`group flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'border-money-600 text-money-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon
                    size={16}
                    className={active ? 'text-money-600' : 'text-slate-400 group-hover:text-slate-600'}
                  />
                  {label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {tab === 'painel' && <DashboardTab onSeeEvolution={() => setTab('evolucao')} />}

        {tab === 'lancamentos' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <TransactionForm />
            </div>
            <div className="lg:col-span-2">
              <TransactionList />
            </div>
          </div>
        )}

        {tab === 'investimentos' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <InvestmentForm />
            </div>
            <div className="lg:col-span-2">
              <InvestmentList />
            </div>
          </div>
        )}

        {tab === 'evolucao' && <EvolutionTab />}
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        Seus dados ficam salvos apenas neste navegador · cotações e IA via proxy seguro.
      </footer>

      <ChatWidget />
    </div>
  )
}
