import type { GraphNode } from '../../../domain/graph.ts'
import type { WebState } from '../../../domain/model.ts'
import { shortenPath, statusClass, statusLabel, stripWikilinks, timeAgo } from '../format.ts'
import type { ChatNode } from '../graph/GraphCanvas.tsx'

interface Props {
  state: WebState
  chats: ChatNode[]
  selected: GraphNode | null
  onOpenChat: (id: string) => void
}

/** Detalhes do nó selecionado no grafo que não é um chat: uma nota, o cérebro ou uma pasta. */
function Selection({ node, state }: { node: GraphNode; state: WebState }) {
  if (node.kind === 'terminal' || node.kind === 'external') return null
  return (
    <section className="selection" aria-live="polite">
      <h2>Selecionado</h2>
      <p>
        <strong>{node.label}</strong>
      </p>
      {node.kind === 'brain' && (
        <p className="muted">
          {state.notes.length} notas em {shortenPath(state.workspaceDir, state.homeDir)}/cerebro
        </p>
      )}
      {(node.kind === 'note' || node.kind === 'project') && (
        <>
          {node.note.projectDir && (
            <p className="muted">Projeto em {shortenPath(node.note.projectDir, state.homeDir)}</p>
          )}
          <p>
            <a href={`obsidian://open?path=${encodeURIComponent(node.note.path)}`}>
              Abrir no Obsidian
            </a>
          </p>
        </>
      )}
      {node.kind === 'folder' && (
        <p className="muted">
          {shortenPath(node.cwd, state.homeDir)}.{' '}
          {node.insideWorkspace
            ? 'Ainda não tem nota de projeto no cérebro.'
            : 'Fica fora da teia: os chats daqui não leem o cérebro.'}
        </p>
      )}
    </section>
  )
}

export function Sidebar({ state, chats, selected, onOpenChat }: Props) {
  return (
    <aside className="sidebar">
      {selected && <Selection node={selected} state={state} />}

      <h2>Chats</h2>
      {chats.length === 0 && (
        <p className="muted">
          Nenhum chat aberto na Trama. Clique em “Novo chat” para abrir o primeiro.
        </p>
      )}
      <ul className="chat-list">
        {chats.map((chat) => {
          const session = chat.session
          return (
            <li key={chat.id}>
              <button type="button" onClick={() => onOpenChat(chat.id)}>
                <span className={`status ${statusClass(session?.status)}`} aria-hidden="true" />
                <span className="chat-name">{chat.label}</span>
                <span className="muted">
                  {session
                    ? `${statusLabel(session.status)} ${timeAgo(session.updatedAt, state.now)}`
                    : 'iniciando…'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <h2>Fila de tarefas</h2>
      {state.queue.length === 0 ? (
        <p className="muted">Fila vazia.</p>
      ) : (
        <ul className="plain-list">
          {state.queue.map((item, index) => (
            <li key={index} className={item.done ? 'done' : undefined}>
              {stripWikilinks(item.text)}
            </li>
          ))}
        </ul>
      )}

      <h2>Recados entre sessões</h2>
      {state.messages.length === 0 ? (
        <p className="muted">Nenhum recado.</p>
      ) : (
        <ul className="plain-list">
          {state.messages.map((message, index) => (
            <li key={index}>{stripWikilinks(message)}</li>
          ))}
        </ul>
      )}
    </aside>
  )
}
