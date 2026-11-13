import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ROLES,
  type FolderOption,
  type OpenTerminalRequest,
  type Role,
} from '../../../domain/model.ts'
import { shortenPath } from '../format.ts'

const OTHER_FOLDER = '__other__'

const ROLE_HINTS: Record<Role, string> = {
  maestro: 'planeja, divide e acompanha',
  construtor: 'implementa uma tarefa',
  revisor: 'revisa sem ter visto a solução',
  redator: 'escreve conteúdo',
}

interface Props {
  open: boolean
  folders: FolderOption[]
  homeDir: string
  onCreate: (request: OpenTerminalRequest) => Promise<void>
  onClose: () => void
}

/** Pergunta onde o chat novo vai trabalhar e com qual papel. */
export function NewChatDialog({ open, folders, homeDir, onCreate, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [folder, setFolder] = useState('')
  const [customFolder, setCustomFolder] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  const chosenFolder = folder || folders[0]?.path || OTHER_FOLDER

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setCreating(true)
    try {
      await onCreate({
        cwd: chosenFolder === OTHER_FOLDER ? customFolder : chosenFolder,
        role: role || null,
      })
      onClose()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível abrir o chat.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <dialog ref={dialog} className="dialog" onClose={onClose}>
      <form onSubmit={submit}>
        <h2>Novo chat</h2>

        <label htmlFor="new-chat-folder">Pasta de trabalho</label>
        <select
          id="new-chat-folder"
          value={chosenFolder}
          onChange={(e) => setFolder(e.target.value)}
        >
          {folders.map((option) => (
            <option key={option.path} value={option.path}>
              {option.label === option.path
                ? shortenPath(option.path, homeDir)
                : `${option.label} (${shortenPath(option.path, homeDir)})`}
            </option>
          ))}
          <option value={OTHER_FOLDER}>Outra pasta…</option>
        </select>
        {chosenFolder === OTHER_FOLDER && (
          <input
            type="text"
            aria-label="Caminho da pasta"
            placeholder="~/Documentos/meu-projeto"
            value={customFolder}
            onChange={(e) => setCustomFolder(e.target.value)}
            required
          />
        )}

        <label htmlFor="new-chat-role">Papel na teia</label>
        <select
          id="new-chat-role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role | '')}
        >
          <option value="">Sem papel (chat livre)</option>
          {ROLES.map((option) => (
            <option key={option} value={option}>
              {option}: {ROLE_HINTS[option]}
            </option>
          ))}
        </select>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={creating}>
            {creating ? 'Abrindo…' : 'Abrir chat'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
