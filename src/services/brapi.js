// Busca cotações via Cloudflare Worker (que esconde o token da brapi).
// Retorna mapa ticker → { price, changePercent, currency, shortName }.

const WORKER_URL = import.meta.env.VITE_WORKER_URL

export async function fetchQuotes(tickers) {
  const list = (Array.isArray(tickers) ? tickers : [tickers])
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)

  if (list.length === 0) return {}

  if (!WORKER_URL) {
    throw new Error('VITE_WORKER_URL não configurada (.env.local)')
  }

  const url = `${WORKER_URL.replace(/\/$/, '')}/quote?tickers=${encodeURIComponent(list.join(','))}`
  const res = await fetch(url)

  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json()).error ?? ''
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Falha ao buscar cotações (HTTP ${res.status})`)
  }

  const data = await res.json()
  return data.quotes ?? {}
}

// Busca tickers por termo via Worker → ['PETR4', 'PETR3', ...].
export async function searchTickers(query) {
  const q = (query || '').trim()
  if (q.length < 1) return []
  if (!WORKER_URL) throw new Error('VITE_WORKER_URL não configurada (.env.local)')

  const url = `${WORKER_URL.replace(/\/$/, '')}/search?q=${encodeURIComponent(q)}`
  const res = await fetch(url)
  if (!res.ok) return []

  const data = await res.json()
  return data.tickers ?? []
}

// Histórico de preços de um ticker via Worker → [{ date: 'YYYY-MM-DD', close }].
export async function fetchHistory(ticker, { range = '1y', interval = '1mo' } = {}) {
  if (!ticker) return []
  if (!WORKER_URL) {
    throw new Error('VITE_WORKER_URL não configurada (.env.local)')
  }

  const base = WORKER_URL.replace(/\/$/, '')
  const url = `${base}/history?ticker=${encodeURIComponent(ticker.toUpperCase())}&range=${range}&interval=${interval}`
  const res = await fetch(url)

  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json()).error ?? ''
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Falha ao buscar histórico (HTTP ${res.status})`)
  }

  const data = await res.json()
  return data.history ?? []
}

// Cotação de fechamento de um ticker numa data (YYYY-MM-DD). Retorna o
// fechamento do dia ou do pregão anterior mais próximo, ou null se não houver.
export async function fetchCloseOn(ticker, date) {
  if (!ticker || !date) return null

  // Escolhe range/intervalo conforme há quanto tempo foi a data.
  const ageDays = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  let range = '1mo'
  let interval = '1d'
  if (ageDays > 364) {
    range = '5y'
    interval = '1mo'
  } else if (ageDays > 89) {
    range = '1y'
    interval = '1d'
  } else if (ageDays > 25) {
    range = '3mo'
    interval = '1d'
  }

  const hist = await fetchHistory(ticker, { range, interval })
  if (!hist.length) return null

  // Fechamento exato do dia, ou o pregão mais recente até a data.
  const upTo = hist.filter((h) => h.date <= date).sort((a, b) => a.date.localeCompare(b.date))
  const point = upTo.length ? upTo[upTo.length - 1] : null
  return point ? point.close : null
}
