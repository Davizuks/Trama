import type { ReactNode } from 'react'
import type { Setup, SetupStepState } from '../../domain/model.ts'
import { setupBlocker } from '../../domain/workspace.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'
import { Field } from '../ui/controls.tsx'
import { Icon } from '../ui/Icon.tsx'
import { Logo } from '../ui/Logo.tsx'

interface StepProps {
  state: SetupStepState
  title: string
  detail: string
  dimmed?: boolean
  children?: ReactNode
}

function Step({ state, title, detail, dimmed = false, children }: StepProps) {
  return (
    <li className="passo">
      <div className="passo__resumo">
        <span className={`passo__marca passo__marca--${state}`}>
          {state === 'done' && <Icon name="feito" size={12} />}
        </span>
        <div className="coluna cresce passo__texto">
          <span className={`t-ui-14-forte ${dimmed ? 'c-3' : ''}`}>{title}</span>
          <span className="t-ui-13 c-3">{detail}</span>
        </div>
      </div>
      {children && <div className="linha passo__controle">{children}</div>}
    </li>
  )
}

export function FirstUse({ setup }: { setup: Setup }) {
  const { workspace, dispatch } = useWorkspace()
  const missingClaude = setup.claude !== 'done'
  const blocker = setupBlocker(setup)
  const done = (step: keyof Setup) => dispatch({ type: 'setup-step-done', step })

  return (
    <div className="centro rolagem">
      <div className="coluna preparo">
        <Logo size={36} />
        <h1 className="t-titulo-18">
          {missingClaude ? 'Falta o Claude Code' : 'Vamos preparar a Trama'}
        </h1>
        <p className="t-ui-14 c-2">
          {missingClaude
            ? 'A Trama abre e organiza chats do Claude Code. Sem ele instalado, não há o que mostrar.'
            : 'Quatro coisas para conferir. Leva um minuto.'}
        </p>
        <ul className="preparo__passos">
          <Step
            state={setup.claude}
            title="Claude Code"
            detail={
              missingClaude
                ? 'Não encontrei o Claude Code nesta máquina. Instale e volte aqui.'
                : `Instalado e logado como ${workspace.account.name}.`
            }
          >
            {missingClaude && (
              <>
                <Button kind="primario">Ver como instalar</Button>
                <Button kind="texto" onClick={() => done('claude')}>
                  Verificar de novo
                </Button>
              </>
            )}
          </Step>
          <Step
            state={setup.workFolder}
            title="Pasta de trabalho"
            detail="Onde ficam os seus projetos."
            dimmed={missingClaude}
          >
            {!missingClaude && (
              <Field
                label="Pasta de trabalho"
                value={workspace.settings.workFolder}
                onChange={(event) =>
                  dispatch({ type: 'settings-changed', patch: { workFolder: event.target.value } })
                }
              />
            )}
          </Step>
          <Step
            state={setup.brain}
            title="Cérebro"
            detail={
              missingClaude
                ? 'A pasta de notas que os chats compartilham.'
                : setup.brain === 'done'
                  ? `Cérebro em ${workspace.settings.brainFolder}.`
                  : 'Não achei um cérebro nessa pasta.'
            }
            dimmed={missingClaude}
          >
            {!missingClaude && setup.brain !== 'done' && (
              <>
                <Button onClick={() => done('brain')}>Criar um novo</Button>
                <Button kind="texto" onClick={() => done('brain')}>
                  Apontar um
                </Button>
              </>
            )}
          </Step>
          <Step
            state={setup.obsidian}
            title="Obsidian"
            detail="Opcional. Serve para ver e editar as notas."
            dimmed={missingClaude}
          >
            {!missingClaude && setup.obsidian !== 'done' && (
              <Button kind="texto" onClick={() => done('obsidian')}>
                Pular
              </Button>
            )}
          </Step>
        </ul>
        {!missingClaude && (
          <div className="linha preparo__acao">
            <p className="cresce t-ui-13 c-3">{blocker ?? 'Tudo pronto.'}</p>
            <Button
              kind="primario"
              disabled={blocker !== null}
              onClick={() => dispatch({ type: 'setup-finished' })}
            >
              Começar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
