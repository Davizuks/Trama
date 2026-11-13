import { Fragment, useEffect, useRef } from 'react'
import type { ChatMessage } from '../../../domain/model.ts'

const INLINE_MARKUP = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g

/** Formata o Markdown mais comum nas respostas do Claude: negrito, código e títulos. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, index) => {
        const heading = line.match(/^#{1,4}\s+(.*)$/)
        const parts = (heading ? heading[1] : line).split(INLINE_MARKUP).map((part, i) => {
          if (part.startsWith('**') && part.length > 4)
            return <strong key={i}>{part.slice(2, -2)}</strong>
          if (part.startsWith('`') && part.length > 2)
            return <code key={i}>{part.slice(1, -1)}</code>
          return <Fragment key={i}>{part}</Fragment>
        })
        return (
          <Fragment key={index}>
            {index > 0 && '\n'}
            {heading ? <strong>{parts}</strong> : parts}
          </Fragment>
        )
      })}
    </>
  )
}

const AUTHORS = { user: 'Você', assistant: 'Claude' } as const

interface Props {
  messages: ChatMessage[]
  currentTool?: string | null
  showAuthors?: boolean
}

/** Uma conversa em balões, sempre rolada até a fala mais recente. */
export function Messages({ messages, currentTool, showAuthors = false }: Props) {
  const end = useRef<HTMLDivElement>(null)
  const last = messages.at(-1)?.text

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, last, currentTool])

  if (messages.length === 0 && !currentTool) {
    return <p className="muted">Ainda não há mensagens nesta conversa.</p>
  }
  return (
    <>
      {messages.map((message, index) =>
        message.author === 'tool' ? (
          <div key={index} className="message tool">
            → {message.text}
          </div>
        ) : (
          <div key={index} className={`message ${message.author}`}>
            {showAuthors && <span className="author">{AUTHORS[message.author]}</span>}
            <RichText text={message.text} />
          </div>
        ),
      )}
      {currentTool && <div className="message tool">→ {currentTool}</div>}
      <div ref={end} />
    </>
  )
}
