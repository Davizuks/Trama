import { useState } from 'react'
import { ROLES, type Role } from '../../domain/model.ts'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'
import { Select } from '../ui/controls.tsx'
import { Dialog } from '../ui/Overlay.tsx'

export function NewChatDialog() {
  const { workspace, dispatch } = useWorkspace()
  const { show } = useNavigation()
  const projects = workspace.brain.nodes.filter((node) => node.kind === 'project')
  const [project, setProject] = useState(projects[0]?.label ?? workspace.account.workspace)
  const [role, setRole] = useState<Role>(workspace.settings.defaultRole)
  const close = () => show(null)

  const open = () => {
    dispatch({ type: 'chat-opened', project, role })
    close()
  }

  return (
    <Dialog title="Novo chat" onClose={close}>
      <span className="dialogo__rotulo t-ui-13-forte">Pasta de trabalho</span>
      <Select
        label="Pasta de trabalho"
        value={project}
        options={projects.map((node) => ({
          value: node.label,
          label: `${node.label} · ${workspace.settings.workFolder}/${node.id}`,
        }))}
        onChange={setProject}
      />
      <span className="dialogo__rotulo t-ui-13-forte">Papel</span>
      <div className="papeis" role="radiogroup" aria-label="Papel">
        {ROLES.map((each) => {
          const selected = each.id === role
          return (
            <button
              key={each.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`papeis__papel ${selected ? 't-ui-13-forte' : 't-ui-13'}`}
              onClick={() => setRole(each.id)}
            >
              {each.label}
            </button>
          )
        })}
      </div>
      <p className="papeis__dica t-ui-13 c-3">{ROLES.find((each) => each.id === role)?.hint}</p>
      <div className="dialogo__acoes">
        <Button kind="texto" onClick={close}>
          Cancelar
        </Button>
        <Button kind="primario" onClick={open}>
          Abrir chat
        </Button>
      </div>
    </Dialog>
  )
}
