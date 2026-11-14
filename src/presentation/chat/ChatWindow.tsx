import { useState, type PointerEvent } from 'react'
import { chatContext, forksOf } from '../../domain/chats.ts'
import type { Chat } from '../../domain/model.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { IconButton } from '../ui/Button.tsx'
import { Status } from '../ui/Status.tsx'
import { ForkDecision } from './ForkDecision.tsx'
import { ReplyForm } from './ReplyForm.tsx'
import { RequestCard } from './RequestCard.tsx'
import { Transcript } from './Transcript.tsx'

interface ChatWindowProps {
  chat: Chat
  selected?: boolean
  onFocus?: () => void
  onDragStart?: (event: PointerEvent<HTMLElement>) => void
}

export function ChatWindow({ chat, selected = false, onFocus, onDragStart }: ChatWindowProps) {
  const { workspace } = useWorkspace()
  const forks = forksOf(workspace.chats, chat.id)
  const [keepingAll, setKeepingAll] = useState(false)
  const deciding = forks.length > 1 && !keepingAll

  return (
    <article
      className={`janela ${selected ? 'janela--selecionada' : ''}`}
      aria-label={`Chat ${chat.name}`}
      onPointerDown={onFocus}
    >
      <header
        className={`linha janela__cabecalho ${onDragStart ? 'janela__cabecalho--alca' : ''}`}
        onPointerDown={onDragStart}
      >
        <h3 className="t-ui-14-forte">{chat.name}</h3>
        <span className="cresce corta t-ui-13 c-3">{chatContext(chat, workspace.chats)}</span>
        <Status status={chat.status} />
        <IconButton icon="mais-acoes" label="Mais ações" />
      </header>
      <Transcript lines={chat.transcript} />
      <footer className="janela__rodape">
        {chat.request ? (
          <RequestCard chat={chat} request={chat.request} />
        ) : deciding ? (
          <ForkDecision forks={forks} onKeepAll={() => setKeepingAll(true)} />
        ) : (
          <ReplyForm chat={chat} />
        )}
      </footer>
    </article>
  )
}
