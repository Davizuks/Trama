import { chatContext } from '../../domain/chats.ts'
import type { Chat } from '../../domain/model.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'
import { Status } from '../ui/Status.tsx'

export function ChatCard({ chat, onOpen }: { chat: Chat; onOpen: () => void }) {
  const { workspace } = useWorkspace()
  const waiting = chat.status === 'needs-you'
  const forks = workspace.chats.filter((each) => each.forkOf === chat.id).length
  const detail =
    forks > 0
      ? `${forks} forks`
      : chat.lastActivity === 'agora'
        ? 'agora'
        : `há ${chat.lastActivity}`

  return (
    <article className="cartao">
      <header className="linha cartao__cabecalho">
        <h3 className="cresce corta t-ui-14-forte">{chat.name}</h3>
        <Status status={chat.status} />
      </header>
      <p className={`t-ui-14 ${waiting ? 'c-1' : 'c-2'}`}>{chat.summary}</p>
      <p className="t-ui-12 c-3">
        {chatContext(chat, workspace.chats)} · {detail}
      </p>
      {waiting ? (
        <div className="linha cartao__acoes">
          <Button kind="primario" onClick={onOpen}>
            Responder
          </Button>
          <Button onClick={onOpen}>Abrir</Button>
        </div>
      ) : (
        <button
          type="button"
          className="cartao__toque"
          aria-label={`Abrir ${chat.name}`}
          onClick={onOpen}
        />
      )}
    </article>
  )
}
