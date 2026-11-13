import { useEffect, useState } from 'react'
import type { ChatMessage } from '../../../domain/model.ts'
import { fetchConversation } from '../../infrastructure/api-client.ts'
import { Messages } from './Messages.tsx'

const REFRESH_MS = 2000

/** A conversa inteira de um chat aberto em outro terminal, atualizada ao vivo e sem edição. */
export function ConversationView({ pid }: { pid: number }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchConversation(pid)
        .then((loaded) => !cancelled && setMessages(loaded))
        // O chat pode ter sido fechado entre uma leitura e outra; a tela mantém o que já tinha.
        .catch(() => undefined)
    void load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [pid])

  return (
    <div className="conversation">
      <div className="conversation-track">
        {messages === null ? (
          <p className="muted">Carregando a conversa…</p>
        ) : (
          <Messages messages={messages} showAuthors />
        )}
      </div>
    </div>
  )
}
