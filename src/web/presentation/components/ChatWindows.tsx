import { useEffect, useRef } from 'react'
import { baseName } from '../../../domain/graph.ts'
import { terminalSessions } from '../../infrastructure/terminal-session.ts'
import { statusClass, statusLabel } from '../format.ts'
import type { ChatNode } from '../graph/GraphCanvas.tsx'
import { Messages } from './Messages.tsx'

interface SlotProps {
  terminalId: string
  /** Só um lugar exibe a tela por vez: a janela no grafo ou a tela cheia. */
  active: boolean
  autoFocus?: boolean
}

/** O lugar onde a tela de um terminal aparece. Adota o elemento da sessão e o mantém ajustado. */
export function TerminalSlot({ terminalId, active, autoFocus = false }: SlotProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = container.current
    if (!active || !element) return
    const session = terminalSessions.get(terminalId)
    session.mount(element)
    if (autoFocus) session.focus()
    const observer = new ResizeObserver(() => session.fit())
    observer.observe(element)
    return () => observer.disconnect()
  }, [terminalId, active, autoFocus])

  return (
    <div className="terminal-slot" data-no-drag ref={container}>
      {!active && <p className="muted">Este chat está aberto em tela cheia.</p>}
    </div>
  )
}

interface TerminalWindowProps {
  node: Extract<ChatNode, { kind: 'terminal' }>
  maximized: boolean
  onMaximize: () => void
  onClose: () => void
}

/** Um chat que roda dentro da Trama: o Claude Code de verdade, em um terminal. */
export function TerminalWindow({ node, maximized, onMaximize, onClose }: TerminalWindowProps) {
  const { session, terminal } = node
  const details = [
    session?.role ?? terminal.role,
    session ? statusLabel(session.status) : 'iniciando…',
    baseName(terminal.cwd),
  ].filter(Boolean)

  return (
    <article className={`window terminal ${statusClass(session?.status)}`}>
      <header className="window-bar">
        <span className={`status ${statusClass(session?.status)}`} aria-hidden="true" />
        <strong className="window-title">{node.label}</strong>
        <span className="window-details">{details.join(' · ')}</span>
        <button type="button" onClick={onMaximize}>
          Ampliar
        </button>
        <button type="button" onClick={onClose} aria-label={`Encerrar o chat ${node.label}`}>
          Encerrar
        </button>
      </header>
      <TerminalSlot terminalId={terminal.id} active={!maximized} />
    </article>
  )
}

interface ExternalWindowProps {
  node: Extract<ChatNode, { kind: 'external' }>
  adopting: boolean
  onOpen: () => void
  onAdopt: () => void
}

/** Um chat aberto em outro terminal: a Trama só consegue acompanhar, não escrever nele. */
export function ExternalChatWindow({ node, adopting, onOpen, onAdopt }: ExternalWindowProps) {
  const { session } = node
  const details = [session.role, statusLabel(session.status), baseName(session.cwd)].filter(Boolean)

  return (
    <article className={`window external ${statusClass(session.status)}`}>
      <header className="window-bar">
        <span className={`status ${statusClass(session.status)}`} aria-hidden="true" />
        <strong className="window-title">{node.label}</strong>
        <button type="button" onClick={onOpen}>
          Ampliar
        </button>
      </header>
      <p className="window-details">{details.join(' · ')}</p>
      <div className="window-body" data-no-drag>
        <Messages messages={session.recent} currentTool={session.currentTool} />
      </div>
      <footer className="window-footer">
        {adopting ? (
          <p role="status">
            Feche este chat no terminal dele com <code>/exit</code>. Ele reabre aqui em seguida.
          </p>
        ) : (
          <>
            <span>Aberto em outro terminal, somente leitura.</span>
            <button type="button" onClick={onAdopt}>
              Trazer para a Trama
            </button>
          </>
        )}
      </footer>
    </article>
  )
}
