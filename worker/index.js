// Cloudflare Worker — proxy que esconde as chaves de API (Gemini + brapi).
// O front nunca fala direto com o Gemini ou a brapi: só com este Worker.
// Secrets (nunca no código — configurar via CLI):
//   wrangler secret put GEMINI_API_KEY
//   wrangler secret put BRAPI_TOKEN
// Var opcional: ALLOWED_ORIGIN (origem do site em produção; default "*").

const ALLOWED_METHODS = 'GET, POST, OPTIONS';

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
  });
}

// ── Rate limit por IP (não burlável pelo cliente) ───────────────────────────
// Janela deslizante em memória do isolate. A chave é o CF-Connecting-IP, que o
// Cloudflare define e o cliente NÃO consegue forjar (qualquer header enviado é
// sobrescrito). Protege o backend mesmo que o cooldown do front seja burlado.
const RL_WINDOW_MS = 60_000;
const RL_MAX = 12; // máx. de requisições de dados por IP por minuto (demo público)
const rlHits = new Map(); // ip -> number[] (timestamps)

function rateLimited(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'local-dev';
  const now = Date.now();
  const recent = (rlHits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (recent.length >= RL_MAX) {
    rlHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  rlHits.set(ip, recent);
  // Limpeza preguiçosa para o Map não crescer indefinidamente.
  if (rlHits.size > 5000) {
    for (const [k, v] of rlHits) {
      if (v.every((t) => now - t >= RL_WINDOW_MS)) rlHits.delete(k);
    }
  }
  return false;
}

// ── Escolher o melhor modelo Gemini disponível ──────────────────────────────

const PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash',
];

async function pickModel(apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  if (!res.ok) return PREFERRED_MODELS[PREFERRED_MODELS.length - 1];
  const data = await res.json();
  const available = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace('models/', ''));
  for (const preferred of PREFERRED_MODELS) {
    if (available.some((a) => a.startsWith(preferred))) {
      return available.find((a) => a.startsWith(preferred));
    }
  }
  return available[0] ?? PREFERRED_MODELS[PREFERRED_MODELS.length - 1];
}

// ── Rotas ────────────────────────────────────────────────────────────────────

async function handleAnalyze(request, env) {
  if (!env.GEMINI_API_KEY) {
    return json({ error: 'GEMINI_API_KEY não configurada no Worker' }, 500, env);
  }

  let prompt;
  try {
    const body = await request.json();
    prompt = body.prompt;
    if (!prompt || typeof prompt !== 'string') throw new Error();
  } catch {
    return json({ error: 'Body inválido: esperado { prompt: string }' }, 400, env);
  }

  const model = await pickModel(env.GEMINI_API_KEY);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    }),
  });

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    return json({ error: `Erro Gemini: ${err}` }, 502, env);
  }

  const data = await geminiRes.json();
  const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return json({ analysis }, 200, env);
}

async function handleQuote(request, env) {
  if (!env.BRAPI_TOKEN) {
    return json({ error: 'BRAPI_TOKEN não configurado no Worker' }, 500, env);
  }

  const url = new URL(request.url);
  const raw = (url.searchParams.get('tickers') || '').trim();
  if (!raw) {
    return json({ error: 'Parâmetro "tickers" ausente' }, 400, env);
  }

  const tickers = [...new Set(raw.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean))];

  // O plano free da brapi permite 1 ativo por requisição, então buscamos
  // cada ticker em paralelo e juntamos os resultados.
  const quotes = {};
  let lastError = null;

  await Promise.all(
    tickers.map(async (ticker) => {
      const brapiUrl = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?token=${env.BRAPI_TOKEN}`;
      try {
        const res = await fetch(brapiUrl);
        if (!res.ok) {
          lastError = await res.text();
          return;
        }
        const data = await res.json();
        const r = (data.results ?? [])[0];
        if (r) {
          quotes[r.symbol] = {
            price: r.regularMarketPrice ?? null,
            changePercent: r.regularMarketChangePercent ?? null,
            currency: r.currency ?? 'BRL',
            shortName: r.shortName ?? r.longName ?? r.symbol,
          };
        }
      } catch (err) {
        lastError = err.message;
      }
    })
  );

  // Só erra de vez se nenhum ticker retornou cotação.
  if (Object.keys(quotes).length === 0 && lastError) {
    return json({ error: `Erro brapi: ${lastError}` }, 502, env);
  }
  return json({ quotes }, 200, env);
}

async function handleHistory(request, env) {
  if (!env.BRAPI_TOKEN) {
    return json({ error: 'BRAPI_TOKEN não configurado no Worker' }, 500, env);
  }

  const url = new URL(request.url);
  const ticker = (url.searchParams.get('ticker') || '').trim().toUpperCase();
  const range = (url.searchParams.get('range') || '1y').trim();
  const interval = (url.searchParams.get('interval') || '1mo').trim();
  if (!ticker) {
    return json({ error: 'Parâmetro "ticker" ausente' }, 400, env);
  }

  const brapiUrl = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&token=${env.BRAPI_TOKEN}`;
  const res = await fetch(brapiUrl);

  if (!res.ok) {
    const err = await res.text();
    return json({ error: `Erro brapi: ${err}` }, 502, env);
  }

  const data = await res.json();
  const result = (data.results ?? [])[0];
  const history = (result?.historicalDataPrice ?? [])
    .filter((h) => h.close != null && h.date != null)
    .map((h) => ({
      // brapi devolve `date` como epoch em segundos
      date: new Date(h.date * 1000).toISOString().slice(0, 10),
      close: h.close,
    }));

  return json({ ticker, history }, 200, env);
}

async function handleSearch(request, env) {
  if (!env.BRAPI_TOKEN) {
    return json({ error: 'BRAPI_TOKEN não configurado no Worker' }, 500, env);
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) {
    return json({ tickers: [] }, 200, env);
  }

  const brapiUrl = `https://brapi.dev/api/available?search=${encodeURIComponent(q)}&token=${env.BRAPI_TOKEN}`;
  const res = await fetch(brapiUrl);

  if (!res.ok) {
    const err = await res.text();
    return json({ error: `Erro brapi: ${err}` }, 502, env);
  }

  const data = await res.json();
  // Apenas ações/fundos (ignora tickers fracionários "F" e índices).
  const tickers = (data.stocks ?? []).filter((t) => !/F$/.test(t)).slice(0, 12);
  return json({ tickers }, 200, env);
}

// ── Handler principal ─────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const { pathname } = new URL(request.url);

    // Rate limit por IP nas rotas que consomem backend externo.
    if (
      (pathname === '/analyze' || pathname === '/quote' || pathname === '/history') &&
      rateLimited(request)
    ) {
      return json(
        { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
        429,
        env
      );
    }

    if (pathname === '/analyze' && request.method === 'POST') {
      return handleAnalyze(request, env);
    }
    if (pathname === '/quote' && request.method === 'GET') {
      return handleQuote(request, env);
    }
    if (pathname === '/history' && request.method === 'GET') {
      return handleHistory(request, env);
    }
    if (pathname === '/search' && request.method === 'GET') {
      return handleSearch(request, env);
    }

    return json({ error: 'Rota não encontrada' }, 404, env);
  },
};
