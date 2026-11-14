import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import type { TramaGateway } from '../application/gateway.ts'
import type { Workspace } from '../domain/model.ts'
import { reduce, type Action } from '../domain/workspace.ts'
import { useLayout } from './hooks/useLayout.ts'
import {
  NavigationContext,
  useNavigationState,
  type InitialNavigation,
} from './hooks/useNavigation.ts'
import { WorkspaceContext } from './hooks/useWorkspace.ts'
import { FirstUse } from './setup/FirstUse.tsx'
import { ServerDown } from './setup/ServerDown.tsx'
import { Shell } from './shell/Shell.tsx'

type AppAction = Action | { type: 'loaded'; workspace: Workspace }

function appReducer(state: Workspace | null, action: AppAction): Workspace | null {
  if (action.type === 'loaded') return action.workspace
  return state ? reduce(state, action) : state
}

export function App({ gateway, start }: { gateway: TramaGateway; start: InitialNavigation }) {
  const [workspace, dispatch] = useReducer(appReducer, null)
  const [failed, setFailed] = useState(false)
  const layout = useLayout()
  const navigation = useNavigationState(start)

  const load = useCallback(() => {
    gateway
      .loadWorkspace()
      .then((loaded) => {
        dispatch({ type: 'loaded', workspace: loaded })
        setFailed(false)
      })
      .catch(() => setFailed(true))
  }, [gateway])

  useEffect(load, [load])

  const context = useMemo(
    () => (workspace ? { workspace, dispatch, layout } : null),
    [workspace, layout],
  )

  if (failed) return <ServerDown onRetry={load} />
  if (!context) return null

  return (
    <WorkspaceContext value={context}>
      <NavigationContext value={navigation}>
        {context.workspace.setup ? <FirstUse setup={context.workspace.setup} /> : <Shell />}
      </NavigationContext>
    </WorkspaceContext>
  )
}
