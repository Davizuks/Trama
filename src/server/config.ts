import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface Config {
  port: number
  /** Pasta que reúne o cérebro e os projetos; chats abertos dentro dela fazem parte da teia. */
  workspaceDir: string
  brainDir: string
  claudeDir: string
  claudeBin: string
  homeDir: string
  distDir: string
  devOrigin: string | null
}

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function findClaude(homeDir: string): string {
  const installed = path.join(homeDir, '.local/bin/claude')
  return fs.existsSync(installed) ? installed : 'claude'
}

/**
 * Configuração por variáveis de ambiente, todas opcionais:
 * `TRAMA_PORT`, `TRAMA_WORKSPACE`, `TRAMA_BRAIN`, `TRAMA_CLAUDE_BIN` e `TRAMA_DEV_ORIGIN`.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const homeDir = os.homedir()
  const workspaceDir = path.resolve(env.TRAMA_WORKSPACE ?? path.join(repoDir, '..'))
  return {
    port: Number(env.TRAMA_PORT) || 4747,
    workspaceDir,
    brainDir: path.resolve(env.TRAMA_BRAIN ?? path.join(workspaceDir, 'cerebro')),
    claudeDir: path.join(homeDir, '.claude'),
    claudeBin: env.TRAMA_CLAUDE_BIN ?? findClaude(homeDir),
    homeDir,
    distDir: path.join(repoDir, 'dist'),
    devOrigin: env.TRAMA_DEV_ORIGIN ?? null,
  }
}
