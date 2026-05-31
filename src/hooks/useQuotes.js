import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchQuotes } from '../services/brapi.js'

// Cooldown entre atualizações MANUAIS (botão). Compartilhado entre todas as
// instâncias do hook via variável de módulo, então trocar de aba / remontar o
// componente não reseta o bloqueio. (A garantia de verdade é no Worker.)
export const MANUAL_COOLDOWN_SECONDS = 15
const MANUAL_COOLDOWN_MS = MANUAL_COOLDOWN_SECONDS * 1000
let lastManualAt = 0

// Busca cotações para os tickers e atualiza periodicamente (polling leve)
// enquanto a página está aberta.
export function useQuotes(tickers, { intervalMs = 60000 } = {}) {
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)

  // String estável para usar como dependência (evita refazer fetch à toa).
  const key = [...new Set(tickers.map((t) => t.toUpperCase()))].sort().join(',')
  const keyRef = useRef(key)
  keyRef.current = key

  // Busca interna (sem cooldown) — usada na montagem e no polling automático.
  const load = useCallback(async () => {
    const list = keyRef.current ? keyRef.current.split(',') : []
    if (list.length === 0) {
      setQuotes({})
      setError(null)
      return
    }
    setLoading(true)
    try {
      const data = await fetchQuotes(list)
      setQuotes(data)
      setError(null)
    } catch (err) {
      setError(err.message || 'Erro ao buscar cotações')
    } finally {
      setLoading(false)
    }
  }, [])

  // Atualização manual (botão) — bloqueada durante o cooldown.
  const refresh = useCallback(() => {
    const remaining = lastManualAt + MANUAL_COOLDOWN_MS - Date.now()
    if (remaining > 0) return
    lastManualAt = Date.now()
    setCooldownLeft(Math.ceil(MANUAL_COOLDOWN_MS / 1000))
    load()
  }, [load])

  useEffect(() => {
    if (!key) {
      setQuotes({})
      return
    }
    load()
    if (!intervalMs) return
    const id = setInterval(load, intervalMs)
    return () => clearInterval(id)
  }, [key, intervalMs, load])

  // Mantém o contador regressivo em sincronia (entre instâncias também).
  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, lastManualAt + MANUAL_COOLDOWN_MS - Date.now())
      setCooldownLeft(Math.ceil(left / 1000))
    }, 500)
    return () => clearInterval(id)
  }, [])

  return { quotes, loading, error, refresh, cooldownLeft }
}
