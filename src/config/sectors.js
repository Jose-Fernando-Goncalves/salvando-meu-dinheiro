// Setor econômico por ticker da B3. O plano free da brapi não retorna setor
// na cotação, então mantemos um mapa local (fácil de estender) com fallback.

export const TICKER_SECTOR = {
  // Petróleo, Gás e Combustíveis
  PETR3: 'Petróleo e Gás',
  PETR4: 'Petróleo e Gás',
  PRIO3: 'Petróleo e Gás',
  RECV3: 'Petróleo e Gás',
  VBBR3: 'Petróleo e Gás',
  UGPA3: 'Petróleo e Gás',
  CSAN3: 'Petróleo e Gás',

  // Mineração e Siderurgia
  VALE3: 'Mineração e Siderurgia',
  CSNA3: 'Mineração e Siderurgia',
  GGBR4: 'Mineração e Siderurgia',
  GOAU4: 'Mineração e Siderurgia',
  USIM5: 'Mineração e Siderurgia',
  CMIN3: 'Mineração e Siderurgia',

  // Bancos e Serviços Financeiros
  ITUB4: 'Bancos',
  ITUB3: 'Bancos',
  BBDC4: 'Bancos',
  BBDC3: 'Bancos',
  BBAS3: 'Bancos',
  SANB11: 'Bancos',
  BPAC11: 'Bancos',
  B3SA3: 'Serviços Financeiros',
  ITSA4: 'Serviços Financeiros',
  CIEL3: 'Serviços Financeiros',

  // Energia Elétrica e Saneamento
  ELET3: 'Energia e Saneamento',
  ELET6: 'Energia e Saneamento',
  ENGI11: 'Energia e Saneamento',
  EGIE3: 'Energia e Saneamento',
  CMIG4: 'Energia e Saneamento',
  CPLE6: 'Energia e Saneamento',
  TAEE11: 'Energia e Saneamento',
  EQTL3: 'Energia e Saneamento',
  SBSP3: 'Energia e Saneamento',

  // Consumo e Varejo
  ABEV3: 'Consumo',
  MGLU3: 'Varejo',
  LREN3: 'Varejo',
  AMER3: 'Varejo',
  VIIA3: 'Varejo',
  PCAR3: 'Varejo',
  ASAI3: 'Varejo',
  CRFB3: 'Varejo',
  NTCO3: 'Consumo',
  JBSS3: 'Alimentos',
  BRFS3: 'Alimentos',
  MRFG3: 'Alimentos',
  BEEF3: 'Alimentos',

  // Saúde
  RDOR3: 'Saúde',
  HAPV3: 'Saúde',
  FLRY3: 'Saúde',
  RADL3: 'Saúde',

  // Indústria e Bens de Capital
  WEGE3: 'Indústria',
  EMBR3: 'Indústria',
  RAIL3: 'Logística',
  RENT3: 'Locação',
  POMO4: 'Indústria',

  // Telecomunicações e Tecnologia
  VIVT3: 'Telecom',
  TIMS3: 'Telecom',
  TOTS3: 'Tecnologia',

  // Construção e Imobiliário
  MRVE3: 'Construção',
  CYRE3: 'Construção',
  EZTC3: 'Construção',

  // Papel e Celulose
  SUZB3: 'Papel e Celulose',
  KLBN11: 'Papel e Celulose',
}

// Sufixo 11 sem mapeamento explícito costuma ser Fundo Imobiliário (FII).
export const sectorOf = (ticker) => {
  if (!ticker) return 'Outros'
  const t = ticker.toUpperCase()
  if (TICKER_SECTOR[t]) return TICKER_SECTOR[t]
  if (/11$/.test(t)) return 'Fundos Imobiliários'
  return 'Outros'
}

// Cor estável por setor (paleta variada para os gráficos).
const SECTOR_COLORS = [
  '#059669', '#0ea5e9', '#f97316', '#8b5cf6', '#ec4899',
  '#eab308', '#14b8a6', '#ef4444', '#6366f1', '#64748b',
]

const sectorColorCache = {}
export const sectorColor = (sector) => {
  if (!sectorColorCache[sector]) {
    const idx = Object.keys(sectorColorCache).length % SECTOR_COLORS.length
    sectorColorCache[sector] = SECTOR_COLORS[idx]
  }
  return sectorColorCache[sector]
}
