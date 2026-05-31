import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Sparkles, X, Send, Loader2, BarChart3 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { useQuotes } from '../hooks/useQuotes.js'
import { analyzeFinances, chatAboutFinances } from '../services/ai.js'

const WELCOME = {
  role: 'assistant',
  content:
    'Olá! 👋 Sou seu assistente financeiro. Pergunte sobre seus gastos, investimentos ou peça uma análise completa.',
}

export default function ChatWidget() {
  const { totals, transactions, investments } = useFinance()
  const tickers = investments.map((i) => i.ticker)
  const { quotes } = useQuotes(tickers, { intervalMs: 0 })

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const scrollRef = useRef(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, open])

  const payload = { totals, transactions, investments, quotes }

  const run = async (history, fetcher) => {
    setLoading(true)
    try {
      const reply = await fetcher()
      setMessages([...history, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages([
        ...history,
        { role: 'assistant', content: `⚠️ ${err.message || 'Erro ao falar com a IA.'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const send = () => {
    const text = input.trim()
    if (!text || loading) return
    const history = [...messages, { role: 'user', content: text }]
    setMessages(history)
    setInput('')
    run(history, () =>
      chatAboutFinances({
        ...payload,
        messages: history.filter((m) => m !== WELCOME),
      })
    )
  }

  const fullAnalysis = () => {
    if (loading) return
    const history = [...messages, { role: 'user', content: 'Faça uma análise completa das minhas finanças.' }]
    setMessages(history)
    run(history, () => analyzeFinances(payload))
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir assistente financeiro"
        className={`fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-money-600 text-white shadow-xl shadow-money-600/30 transition hover:scale-105 active:scale-95 ${
          open ? 'rotate-90 opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Sparkles size={24} />
      </button>

      {/* Painel do chat */}
      <div
        className={`fixed bottom-5 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        style={{ height: 'min(70vh, 540px)' }}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-500 to-money-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            <div>
              <p className="text-sm font-semibold leading-none">Assistente financeiro</p>
              <p className="mt-0.5 text-[11px] text-white/80">com IA · análise dos seus dados</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="rounded-lg p-1.5 transition hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensagens */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-money-600 text-white'
                    : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {m.role === 'user' ? (
                  m.content
                ) : (
                  <article className="prose prose-sm prose-slate max-w-none prose-headings:mb-1 prose-headings:mt-3 prose-headings:text-sm prose-p:my-1.5 prose-li:my-0.5 prose-strong:text-slate-900">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </article>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-400">
                <Loader2 size={15} className="animate-spin" /> Pensando…
              </div>
            </div>
          )}

          {messages.length === 1 && !loading && (
            <button
              onClick={fullAnalysis}
              className="mx-auto flex items-center gap-2 rounded-full border border-money-200 bg-money-50 px-3.5 py-2 text-xs font-semibold text-money-700 transition hover:bg-money-100"
            >
              <BarChart3 size={14} /> Analisar minhas finanças
            </button>
          )}
        </div>

        {/* Entrada */}
        <div className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            placeholder="Pergunte algo…"
            className="max-h-28 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-money-500 focus:outline-none focus:ring-2 focus:ring-money-100"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="Enviar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-money-600 text-white transition hover:bg-money-700 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  )
}
