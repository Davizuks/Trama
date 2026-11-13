import { useEffect, useMemo, useRef, useState } from 'react'
import { buildGraph } from '../../domain/graph.ts'
import type { OpenTerminalRequest } from '../../domain/model.ts'
import { closeTerminal, openTerminal } from '../infrastructure/api-client.ts'
import { terminalSessions } from '../infrastructure/terminal-session.ts'
import { ExternalChatWindow, TerminalSlot, TerminalWindow } from './components/ChatWindows.tsx'
import { ConversationView } from './components/ConversationView.tsx'
import { NewChatDialog } from './components/NewChatDialog.tsx'
import { Logo } from './components/Logo.tsx'
import { Sidebar } from './components/Sidebar.tsx'
import { statusClass } from './format.ts'
import { GraphCanvas, type ChatNode } from './graph/GraphCanvas.tsx'
import { useWebState } from './hooks/useWebState.ts'

const GRAPH_TAB = 'graph'
const SHOW_EXTERNAL_KEY = 'trama.showExternal'

/** A preferência é só uma conveniência: se o navegador bloquear o armazenamento, vale o padrão. */
function readShowExternal(): boolean {
  try {
    return localStorage.getItem(SHOW_EXTERNAL_KEY) === '1'
  } catch {
    return false
  }
}

/** Chat de outro terminal que o usuário pediu para trazer, à espera de ser fechado lá. */
interface Adoption {
  sessionId: string
  cwd: string
}

const messageOf = (failure: unknown) =>
  failure instanceof Error ? failure.message : 'Algo deu errado na Trama.'

export function App() {
  const { state, offline, refresh } = useWebState()
  // A aba fica no endereço da página, para sobreviver a um recarregamento.
  const [tab, setTab] = useState(() => decodeURIComponent(location.hash.slice(1)) || GRAPH_TAB)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adoptions, setAdoptions] = useState<Adoption[]>([])
  const resumed = useRef(new Set<string>())

  const [showExternal, setShowExternal] = useState(readShowExternal)

  // Por padrão a teia mostra só os chats criados nela; os de outros terminais são opcionais.
  const visible = useMemo(() => {
    if (!state || showExternal) return state
    return { ...state, sessions: state.sessions.filter((session) => session.terminalId) }
  }, [state, showExternal])
  const externalCount = state?.sessions.filter((session) => !session.terminalId).length ?? 0

  const toggleExternal = (show: boolean) => {
    setShowExternal(show)
    try {
      localStorage.setItem(SHOW_EXTERNAL_KEY, show ? '1' : '0')
    } catch {
      // Sem armazenamento, a escolha vale só até recarregar a página.
    }
  }

  const graph = useMemo(() => (visible ? buildGraph(visible) : { nodes: [], edges: [] }), [visible])
  const chats = useMemo(
    () => graph.nodes.filter((n): n is ChatNode => n.kind === 'terminal' || n.kind === 'external'),
    [graph],
  )
  const openChat = chats.find((chat) => chat.id === tab) ?? null
  const activeTab = openChat ? tab : GRAPH_TAB

  useEffect(() => {
    history.replaceState(null, '', tab === GRAPH_TAB ? location.pathname : `#${tab}`)
  }, [tab])

  // Telas de terminais que já acabaram são descartadas.
  useEffect(() => {
    if (state) terminalSessions.retainOnly(state.terminals.map((terminal) => terminal.id))
  }, [state])

  // Assim que um chat a trazer é fechado no terminal original, ele é retomado dentro da Trama.
  useEffect(() => {
    if (!state) return
    for (const adoption of adoptions) {
      const stillOpen = state.sessions.some((session) => session.id === adoption.sessionId)
      if (stillOpen || resumed.current.has(adoption.sessionId)) continue
      resumed.current.add(adoption.sessionId)
      setAdoptions((current) => current.filter((a) => a.sessionId !== adoption.sessionId))
      openTerminal({ cwd: adoption.cwd, resumeSessionId: adoption.sessionId })
        .then(refresh)
        .catch((failure: unknown) => setError(messageOf(failure)))
    }
  }, [state, adoptions, refresh])

  const createChat = async (request: OpenTerminalRequest) => {
    await openTerminal(request)
    await refresh()
  }

  const endChat = (node: Extract<ChatNode, { kind: 'terminal' }>) => {
    if (
      !confirm(`Encerrar o chat "${node.label}"? A conversa fica salva e pode ser retomada depois.`)
    ) {
      return
    }
    closeTerminal(node.terminal.id)
      .then(refresh)
      .catch((failure: unknown) => setError(messageOf(failure)))
  }

  const renderWindow = (node: ChatNode) =>
    node.kind === 'terminal' ? (
      <TerminalWindow
        node={node}
        maximized={activeTab === node.id}
        onMaximize={() => setTab(node.id)}
        onClose={() => endChat(node)}
      />
    ) : (
      <ExternalChatWindow
        node={node}
        adopting={adoptions.some((a) => a.sessionId === node.session.id)}
        onOpen={() => setTab(node.id)}
        onAdopt={() =>
          setAdoptions((current) => [
            ...current,
            { sessionId: node.session.id, cwd: node.session.cwd },
          ])
        }
      />
    )

  const working = visible?.sessions.filter((session) => session.status === 'busy').length ?? 0

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <Logo />
          Trama
        </h1>
        {state && (
          <span className="muted">
            {chats.length} {chats.length === 1 ? 'chat' : 'chats'} · {working} trabalhando ·{' '}
            {state.notes.length} notas
          </span>
        )}
        {externalCount > 0 && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={showExternal}
              onChange={(event) => toggleExternal(event.target.checked)}
            />
            Mostrar chats de outros terminais ({externalCount})
          </label>
        )}
        <span className={`live${offline ? ' offline' : ''}`} role="status">
          {offline ? 'sem resposta do servidor da Trama' : state ? 'ao vivo' : 'carregando…'}
        </span>
        <button
          type="button"
          className="primary"
          onClick={() => setCreating(true)}
          disabled={!state}
        >
          Novo chat
        </button>
      </header>

      {error && (
        <div className="banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            Fechar aviso
          </button>
        </div>
      )}

      {state && (
        <Sidebar
          state={state}
          chats={chats}
          selected={graph.nodes.find((node) => node.id === selectedId) ?? null}
          onOpenChat={setTab}
        />
      )}

      <main className="main">
        <nav className="tabs" role="tablist" aria-label="Teia e chats">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === GRAPH_TAB}
            onClick={() => setTab(GRAPH_TAB)}
          >
            Teia
          </button>
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              role="tab"
              aria-selected={activeTab === chat.id}
              onClick={() => setTab(chat.id)}
            >
              <span className={`status ${statusClass(chat.session?.status)}`} aria-hidden="true" />
              {chat.label}
            </button>
          ))}
        </nav>

        <GraphCanvas
          graph={graph}
          visible={activeTab === GRAPH_TAB}
          selectedId={selectedId}
          onSelect={setSelectedId}
          renderWindow={renderWindow}
        />
        {openChat?.kind === 'terminal' && (
          <div className="full-terminal">
            <TerminalSlot
              key={openChat.terminal.id}
              terminalId={openChat.terminal.id}
              active
              autoFocus
            />
          </div>
        )}
        {openChat?.kind === 'external' && <ConversationView pid={openChat.session.pid} />}
      </main>

      {state && (
        <NewChatDialog
          open={creating}
          folders={state.folders}
          homeDir={state.homeDir}
          onCreate={createChat}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  )
}
