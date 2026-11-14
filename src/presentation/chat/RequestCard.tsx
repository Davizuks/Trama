import type { Chat, ChatRequest } from '../../domain/model.ts'
import type { Action } from '../../domain/workspace.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'

type Answer = Extract<Action, { type: 'request-answered' }>['answer']

const ACTIONS: Record<ChatRequest['kind'], Array<{ label: string; answer: Answer }>> = {
  command: [
    { label: 'Permitir', answer: 'allow' },
    { label: 'Permitir sempre', answer: 'allow' },
    { label: 'Negar', answer: 'deny' },
  ],
  edit: [
    { label: 'Permitir', answer: 'allow' },
    { label: 'Permitir sempre', answer: 'allow' },
    { label: 'Negar', answer: 'deny' },
  ],
  crashed: [
    { label: 'Retomar conversa', answer: 'resume' },
    { label: 'Ver o que houve', answer: 'resume' },
    { label: 'Fechar', answer: 'close' },
  ],
}

const KINDS = ['primario', 'secundario', 'texto'] as const

export function RequestCard({ chat, request }: { chat: Chat; request: ChatRequest }) {
  const { dispatch } = useWorkspace()
  const crashed = request.kind === 'crashed'

  return (
    <section className="pedido anima-entrada" aria-label={request.title}>
      <header className="linha pedido__cabecalho">
        <span className={`ponto ${crashed ? 'ponto--perigo' : 'ponto--needs-you'}`} />
        <h3 className="cresce t-ui-13-forte">{request.title}</h3>
        <span className="t-ui-12 c-3 corta">{request.context}</span>
      </header>
      <pre className="pedido__bloco t-terminal">{request.detail}</pre>
      <div className="linha pedido__acoes">
        {ACTIONS[request.kind].map((action, i) => (
          <Button
            key={action.label}
            kind={KINDS[i]}
            onClick={() =>
              dispatch({ type: 'request-answered', chatId: chat.id, answer: action.answer })
            }
          >
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  )
}
