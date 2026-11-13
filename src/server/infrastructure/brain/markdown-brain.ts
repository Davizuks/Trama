import fs from 'node:fs'
import path from 'node:path'
import type { Board, BrainNote } from '../../../domain/model.ts'
import type { BrainSource } from '../../application/ports.ts'
import { parseBoard, parseNote } from './brain-parser.ts'

/** O cérebro: uma pasta de notas Markdown interligadas, a mesma que o Obsidian abre. */
export class MarkdownBrain implements BrainSource {
  readonly #dir: string

  constructor(brainDir: string) {
    this.#dir = brainDir
  }

  board(): Board {
    try {
      return parseBoard(fs.readFileSync(path.join(this.#dir, 'quadro.md'), 'utf8'))
    } catch {
      return { rows: [], queue: [], messages: [] }
    }
  }

  notes(): BrainNote[] {
    return this.#markdownFiles(this.#dir).map((file) => {
      const parsed = parseNote(fs.readFileSync(file, 'utf8'))
      const name = path.basename(file, '.md')
      const folder = path.dirname(path.relative(this.#dir, file))
      return {
        id: name.toLowerCase(),
        title: parsed.title ?? name,
        group: folder === '.' ? '' : folder,
        path: file,
        projectDir: parsed.projectDir,
        links: parsed.links,
      }
    })
  }

  #markdownFiles(dir: string): string[] {
    let entries: fs.Dirent[] = []
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return []
    }
    return entries
      .filter((entry) => !entry.name.startsWith('.'))
      .flatMap((entry) => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return this.#markdownFiles(full)
        return entry.name.endsWith('.md') ? [full] : []
      })
  }
}
