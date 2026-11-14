import { describeServer } from '../../domain/chats.ts'
import { useNavigation } from '../hooks/useNavigation.ts'
import { useWorkspace } from '../hooks/useWorkspace.ts'
import { Button } from '../ui/Button.tsx'
import { Toggle } from '../ui/controls.tsx'
import { Icon } from '../ui/Icon.tsx'

export function McpServers() {
  const { workspace, dispatch, layout } = useWorkspace()
  const { show, openSettings } = useNavigation()

  return (
    <div className="coluna conexoes">
      {layout !== 'phone' && (
        <p className="linha mcp__caminho t-ui-13 c-3">
          <button type="button" onClick={() => openSettings('conexoes')}>
            Conexões
          </button>
          / <span className="c-2">Servidores MCP</span>
        </p>
      )}
      <div className="linha mcp__titulo">
        {layout !== 'phone' && <h1 className="cresce t-titulo-18">Servidores MCP</h1>}
        <Button kind="primario" onClick={() => show('novo-mcp')}>
          Adicionar servidor
        </Button>
      </div>
      <p className="t-ui-14 c-3">
        Cada servidor dá ferramentas extras aos chats. Ligue só o que cada projeto precisa: menos
        ferramentas deixam os chats mais rápidos e focados.
      </p>
      <ul className="mcp__lista">
        {workspace.mcpServers.map((server) => {
          const active = server.enabled && !server.needsLogin
          return (
            <li key={server.id} className="linha mcp__servidor">
              <span className={`conexao__simbolo mcp__simbolo ${active ? '' : 'c-3'}`}>
                <Icon name={server.kind === 'http' ? 'servidor' : 'comando'} />
              </span>
              <div className="coluna cresce conexao__texto">
                <span className={`t-ui-14-forte ${active ? '' : 'c-2'}`}>{server.name}</span>
                <span className="t-ui-13 c-3">{describeServer(server)}</span>
              </div>
              {server.needsLogin && <Button>Entrar</Button>}
              <Toggle
                label={`Ligar ${server.name}`}
                on={server.enabled}
                onChange={() => dispatch({ type: 'mcp-toggled', serverId: server.id })}
              />
            </li>
          )
        })}
      </ul>
      <p className="t-ui-13 c-3">
        Adicione só servidores em que você confia. Um servidor recebe o que o chat enviar para ele e
        pode devolver instruções ao chat.
      </p>
    </div>
  )
}
