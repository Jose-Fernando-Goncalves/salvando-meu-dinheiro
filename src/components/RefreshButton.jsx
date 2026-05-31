import { RefreshCw, Loader2 } from 'lucide-react'

// Botão "Atualizar": durante o cooldown fica desabilitado mostrando a contagem.
export default function RefreshButton({ loading, cooldownLeft = 0, onClick }) {
  const resting = cooldownLeft > 0

  return (
    <button
      onClick={onClick}
      disabled={loading || resting}
      title={resting ? `Aguarde ${cooldownLeft}s para atualizar de novo` : 'Atualizar cotações'}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <RefreshCw size={15} className={resting ? 'text-slate-300' : ''} />
      )}
      {resting ? `Aguarde ${cooldownLeft}s` : 'Atualizar'}
    </button>
  )
}
