import { useEffect } from 'react'
import { Button } from '../ui/Button.tsx'
import { Logo } from '../ui/Logo.tsx'

const RETRY_SECONDS = 5

export function ServerDown({ onRetry }: { onRetry: () => void }) {
  useEffect(() => {
    const timer = window.setInterval(onRetry, RETRY_SECONDS * 1000)
    return () => window.clearInterval(timer)
  }, [onRetry])

  return (
    <div className="centro">
      <div className="coluna preparo preparo--centrado">
        <span className="preparo__logo-apagado">
          <Logo size={40} />
        </span>
        <h1 className="t-titulo-18">A Trama não está respondendo</h1>
        <p className="t-ui-14 c-2">
          O servidor local parou ou foi fechado. Os chats que estavam abertos nele foram encerrados,
          mas as conversas ficam salvas e podem ser retomadas.
        </p>
        <div className="linha preparo__botoes">
          <Button kind="primario" onClick={onRetry}>
            Tentar de novo
          </Button>
          <Button kind="texto">Ver o registro</Button>
        </div>
        <p className="t-ui-12 c-3">Tentando reconectar a cada {RETRY_SECONDS} segundos…</p>
      </div>
    </div>
  )
}
