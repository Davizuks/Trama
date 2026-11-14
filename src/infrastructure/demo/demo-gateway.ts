import type { TramaGateway } from '../../application/gateway.ts'
import type { Workspace } from '../../domain/model.ts'
import { demoForks, demoWorkspace } from './demo-workspace.ts'

const SCENES: Record<string, (base: Workspace) => Workspace> = {
  padrao: (base) => base,

  'sem-chats': (base) => ({ ...base, chats: [], notices: [] }),

  forks: (base) => ({
    ...base,
    chats: [
      ...base.chats
        .filter((chat) => chat.id !== 'revisor-3')
        .map((chat) =>
          chat.id === 'maestro-1'
            ? {
                ...chat,
                status: 'stopped' as const,
                lastActivity: '4 min',
                summary: 'Bifurcado em 2 caminhos',
                transcript: chat.transcript.slice(0, -2),
              }
            : chat,
        ),
      ...demoForks,
    ],
    notices: base.notices.filter((notice) => notice.chatId !== 'revisor-3'),
  }),

  permissao: (base) => ({
    ...base,
    chats: base.chats.map((chat) => {
      if (chat.id === 'construtor-2')
        return {
          ...chat,
          status: 'needs-you' as const,
          summary: 'Quer rodar um comando',
          request: {
            kind: 'command' as const,
            title: 'Quer rodar um comando',
            detail: 'git push origin rodape-novo',
            context: 'Portfólio',
          },
        }
      if (chat.id === 'maestro-1')
        return {
          ...chat,
          summary: 'Quer editar um arquivo',
          request: {
            kind: 'edit' as const,
            title: 'Quer editar um arquivo',
            detail: '- [ ] Trocar o rodapé do portfólio\n+ [x] Trocar o rodapé do portfólio',
            context: 'cerebro/quadro.md',
          },
        }
      return chat
    }),
  }),

  'chat-parou': (base) => ({
    ...base,
    chats: base.chats.map((chat) =>
      chat.id === 'construtor-2'
        ? {
            ...chat,
            status: 'stopped' as const,
            lastActivity: '1 min',
            summary: 'O chat parou',
            request: {
              kind: 'crashed' as const,
              title: 'O chat parou',
              detail:
                'O processo do Claude Code encerrou sem aviso.\nA conversa está salva até a última resposta.',
              context: 'há 1 min',
            },
          }
        : chat,
    ),
  }),

  deslogado: (base) => ({ ...base, claudeLoggedIn: false }),

  'primeiro-uso': (base) => ({
    ...base,
    chats: [],
    notices: [],
    setup: { claude: 'done', workFolder: 'done', brain: 'pending', obsidian: 'pending' },
  }),

  'sem-claude': (base) => ({
    ...base,
    chats: [],
    notices: [],
    setup: { claude: 'error', workFolder: 'pending', brain: 'pending', obsidian: 'pending' },
  }),
}

const OFFLINE_SCENE = 'sem-servidor'

export const SCENE_NAMES = [...Object.keys(SCENES), OFFLINE_SCENE]

export function createDemoGateway(scene: string): TramaGateway {
  return {
    async loadWorkspace() {
      if (scene === OFFLINE_SCENE) throw new Error('O servidor não respondeu.')
      const build = SCENES[scene] ?? SCENES.padrao
      return build(demoWorkspace)
    },
  }
}

const OPENING_SCENE = 'forks'

export function sceneFromUrl(search: string): string {
  return new URLSearchParams(search).get('cena') ?? OPENING_SCENE
}
