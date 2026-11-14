import { useState, type FormEvent } from 'react'
import { canReply, replyPlaceholder } from '../../domain/chats.ts'
import type { Chat } from '../../domain/model.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { IconButton } from '../ui/Button.tsx'

export function ReplyForm({ chat }: { chat: Chat }) {
  const { workspace, dispatch } = useWorkspace()
  const [text, setText] = useState('')
  const enabled = canReply(chat, workspace.chats)

  const send = (event: FormEvent) => {
    event.preventDefault()
    const reply = text.trim()
    if (!reply) return
    dispatch({ type: 'chat-replied', chatId: chat.id, text: reply })
    setText('')
  }

  return (
    <form className="linha responder" onSubmit={send}>
      <input
        className="cresce t-ui-14"
        aria-label={`Responder ao ${chat.name}`}
        placeholder={replyPlaceholder(chat, workspace.chats)}
        value={text}
        disabled={!enabled}
        onChange={(event) => setText(event.target.value)}
      />
      <IconButton
        type="submit"
        icon="enviar"
        label="Enviar"
        tone={enabled ? 'claro' : 'apagado'}
        disabled={!enabled}
      />
    </form>
  )
}
