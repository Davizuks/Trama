import type { Chat } from '../../domain/model.ts'
import { StatusDot } from '../ui/Status.tsx'

interface ChatRowProps {
  chat: Chat
  selected: boolean
  onSelect: () => void
  fork?: boolean
}

export function ChatRow({ chat, selected, onSelect, fork = false }: ChatRowProps) {
  const classes = ['linha-chat', selected && 'linha-chat--selecionada', fork && 'linha-chat--fork']
  return (
    <button type="button" className={classes.filter(Boolean).join(' ')} onClick={onSelect}>
      <span className="linha-chat__estado">
        <StatusDot status={chat.status} />
      </span>
      <span className="coluna cresce linha-chat__conteudo">
        <span className="linha linha-chat__topo">
          <span className="cresce corta t-ui-13-forte c-1">
            {fork ? `↳ ${chat.name}` : chat.name}
          </span>
          <span className="t-ui-12 c-3">{chat.lastActivity}</span>
        </span>
        <span className="corta t-ui-12 c-2">{chat.summary}</span>
      </span>
    </button>
  )
}
