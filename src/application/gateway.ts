import type { Workspace } from '../domain/model.ts'

export interface TramaGateway {
  loadWorkspace(): Promise<Workspace>
}
