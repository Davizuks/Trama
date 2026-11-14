import { useState, type FormEvent } from 'react'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'
import { Field, Segmented } from '../ui/controls.tsx'
import { Dialog } from '../ui/Overlay.tsx'

type Kind = 'http' | 'command'
type Scope = 'all' | 'project'

export function AddMcpDialog() {
  const { workspace, dispatch } = useWorkspace()
  const { show } = useNavigation()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Kind>('http')
  const [address, setAddress] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const close = () => show(null)
  const project = workspace.brain.nodes.find((node) => node.kind === 'project')?.label ?? ''

  const add = (event: FormEvent) => {
    event.preventDefault()
    dispatch({
      type: 'mcp-added',
      server: {
        name: name.trim(),
        kind,
        command: kind === 'command' ? address.trim() : undefined,
        scope: scope === 'all' ? 'all' : project,
      },
    })
    close()
  }

  return (
    <Dialog title="Adicionar servidor MCP" width={480} onClose={close}>
      <form className="coluna formulario" onSubmit={add}>
        <span className="dialogo__rotulo t-ui-13-forte">Nome</span>
        <Field
          label="Nome"
          placeholder="linear"
          value={name}
          required
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
        <span className="dialogo__rotulo t-ui-13-forte">Tipo</span>
        <Segmented
          label="Tipo"
          value={kind}
          options={[
            { value: 'http', label: 'HTTP' },
            { value: 'command', label: 'Comando local' },
          ]}
          onChange={setKind}
        />
        <span className="dialogo__rotulo t-ui-13-forte">
          {kind === 'http' ? 'Endereço' : 'Comando'}
        </span>
        <Field
          label={kind === 'http' ? 'Endereço' : 'Comando'}
          mono
          placeholder={kind === 'http' ? 'https://mcp.linear.app/mcp' : 'npx @mcp/postgres'}
          value={address}
          required
          onChange={(event) => setAddress(event.target.value)}
        />
        <span className="dialogo__rotulo t-ui-13-forte">Onde vale</span>
        <Segmented
          label="Onde vale"
          value={scope}
          options={[
            { value: 'all', label: 'Todos os chats' },
            { value: 'project', label: 'Só neste projeto' },
          ]}
          onChange={setScope}
        />
        <p className="formulario__dica t-ui-13 c-3">
          A Trama abre o navegador para você entrar na conta do serviço, se ele pedir.
        </p>
        <div className="dialogo__acoes">
          <Button kind="texto" onClick={close}>
            Cancelar
          </Button>
          <Button kind="primario" type="submit">
            Adicionar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
