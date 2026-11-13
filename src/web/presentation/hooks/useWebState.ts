import { useCallback, useEffect, useState } from 'react'
import type { WebState } from '../../../domain/model.ts'
import { fetchState } from '../../infrastructure/api-client.ts'

const REFRESH_MS = 2000

/** Mantém a fotografia da teia atualizada, consultando o servidor a cada dois segundos. */
export function useWebState() {
  const [state, setState] = useState<WebState | null>(null)
  const [offline, setOffline] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setState(await fetchState())
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }, [])

  useEffect(() => {
    const first = setTimeout(refresh, 0)
    const timer = setInterval(refresh, REFRESH_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [refresh])

  return { state, offline, refresh }
}
