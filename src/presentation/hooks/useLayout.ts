import { useEffect, useState } from 'react'
import { layoutFor, type Layout } from '../../domain/layout.ts'

const currentLayout = () => layoutFor(window.innerWidth, window.innerHeight)

export function useLayout(): Layout {
  const [layout, setLayout] = useState(currentLayout)

  useEffect(() => {
    const update = () => setLayout(currentLayout())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return layout
}
