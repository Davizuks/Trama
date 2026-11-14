import type { Chat } from '../../domain/model.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'

interface ForkDecisionProps {
  forks: Chat[]
  onKeepAll: () => void
}

export function ForkDecision({ forks, onKeepAll }: ForkDecisionProps) {
  const { dispatch } = useWorkspace()
  const ordered = [...forks].sort(
    (a, b) => Number(b.status === 'needs-you') - Number(a.status === 'needs-you'),
  )

  return (
    <section className="decisao" aria-label="Decidir entre os forks">
      <h3 className="t-ui-13-forte">Bifurcado em {forks.length} caminhos</h3>
      <div className="linha decisao__acoes">
        {ordered.map((fork, i) => (
          <Button
            key={fork.id}
            kind={i === 0 ? 'primario' : 'secundario'}
            onClick={() => dispatch({ type: 'fork-kept', chatId: fork.id })}
          >
            Ficar com "{fork.name}"
          </Button>
        ))}
        <Button kind="texto" onClick={onKeepAll}>
          Manter todos
        </Button>
      </div>
    </section>
  )
}
