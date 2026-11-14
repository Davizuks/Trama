import { useEffect, useRef } from 'react'
import type { TranscriptLine } from '../../domain/model.ts'

const EMPTY_LINE = '\u200b'

export function Transcript({ lines }: { lines: TranscriptLine[] }) {
  const screen = useRef<HTMLDivElement>(null)

  // Mexe só no scrollTop: scrollIntoView rolaria também a página em volta.
  useEffect(() => {
    const element = screen.current
    if (element) element.scrollTop = element.scrollHeight
  }, [lines.length])

  return (
    <div ref={screen} className="tela rolagem t-terminal">
      {lines.map((line, i) => (
        <p key={i} className={line.strong ? 'c-1' : 'c-2'}>
          {line.text || EMPTY_LINE}
        </p>
      ))}
    </div>
  )
}
