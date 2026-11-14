import { createContext, useContext, type Dispatch } from 'react'
import type { Layout } from '../../domain/layout.ts'
import type { Workspace } from '../../domain/model.ts'
import type { Action } from '../../domain/workspace.ts'

export interface WorkspaceContextValue {
  workspace: Workspace
  dispatch: Dispatch<Action>
  layout: Layout
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('useWorkspace precisa estar dentro de WorkspaceContext.')
  return value
}
