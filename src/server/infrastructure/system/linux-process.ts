import fs from 'node:fs'
import type { FileSystem, ProcessInspector } from '../../application/ports.ts'

interface ProcStat {
  parentPid: number
  startTime: string
}

/** Lê `/proc/<pid>/stat`. O nome do processo pode conter espaços, então parte do último `)`. */
function readProcStat(pid: number): ProcStat | null {
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8')
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ')
    return { parentPid: Number(fields[1]), startTime: fields[19] }
  } catch {
    return null
  }
}

/** O pid pode ter sido reaproveitado; o instante de início confirma que é o mesmo processo. */
export function isProcessAlive(pid: number, expectedStartTime?: string): boolean {
  const stat = readProcStat(pid)
  if (!stat) return false
  return expectedStartTime ? stat.startTime === expectedStartTime : true
}

export const linuxProcesses: ProcessInspector = {
  parentPid: (pid) => readProcStat(pid)?.parentPid ?? null,
}

export const localFiles: FileSystem = {
  isDirectory: (path) => {
    try {
      return fs.statSync(path).isDirectory()
    } catch {
      return false
    }
  },
}
