import { randomBytes } from 'node:crypto'
import { makeGetWebState } from './application/get-web-state.ts'
import {
  makeCloseTerminal,
  makeGetConversation,
  makeOpenTerminal,
} from './application/terminals.ts'
import { loadConfig } from './config.ts'
import { createHttpServer } from './http/http-server.ts'
import { MarkdownBrain } from './infrastructure/brain/markdown-brain.ts'
import { ClaudeSessionFiles } from './infrastructure/claude/claude-session-files.ts'
import { TranscriptFiles } from './infrastructure/claude/transcript-files.ts'
import { linuxProcesses, localFiles } from './infrastructure/system/linux-process.ts'
import { PtyTerminalGateway } from './infrastructure/terminal/pty-terminal-gateway.ts'

/* oxlint-disable no-console -- este é o ponto de entrada: avisa no terminal onde a Trama subiu. */

// Raiz de composição: o único lugar que conhece as implementações concretas.
const config = loadConfig()
const sessions = new ClaudeSessionFiles(config.claudeDir)
const conversations = new TranscriptFiles(config.claudeDir)
const terminals = new PtyTerminalGateway(config.claudeBin)

const server = createHttpServer({
  policy: {
    port: config.port,
    devOrigin: config.devOrigin,
    token: randomBytes(24).toString('hex'),
  },
  distDir: config.distDir,
  terminals,
  getWebState: makeGetWebState({
    sessions,
    conversations,
    terminals,
    brain: new MarkdownBrain(config.brainDir),
    processes: linuxProcesses,
    workspaceDir: config.workspaceDir,
    homeDir: config.homeDir,
    now: Date.now,
  }),
  getConversation: makeGetConversation({ sessions, conversations }),
  openTerminal: makeOpenTerminal({
    terminals,
    sessions,
    conversations,
    files: localFiles,
    homeDir: config.homeDir,
  }),
  closeTerminal: makeCloseTerminal(terminals),
  logError: console.error,
})

server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `A porta ${config.port} já está em uso. A Trama talvez já esteja aberta.`
      : error.message,
  )
  process.exit(1)
})

// Só aceita conexões desta máquina: a Trama controla terminais.
server.listen(config.port, '127.0.0.1', () => {
  console.log(`Trama no ar em http://127.0.0.1:${config.port}`)
  console.log(`Cérebro: ${config.brainDir}`)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    terminals.closeAll()
    server.close()
    process.exit(0)
  })
}
