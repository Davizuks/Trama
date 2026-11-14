import { useEffect, type ReactNode } from 'react'

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}

interface DialogProps {
  title: string
  onClose: () => void
  children: ReactNode
  width?: number
}

export function Dialog({ title, onClose, children, width = 460 }: DialogProps) {
  useEscape(onClose)
  return (
    <div className="veu" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="dialogo anima-entrada"
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="t-titulo-18">{title}</h2>
        {children}
      </section>
    </div>
  )
}

interface PopoverProps {
  label: string
  onClose: () => void
  children: ReactNode
  className: string
}

export function Popover({ label, onClose, children, className }: PopoverProps) {
  useEscape(onClose)
  return (
    <>
      <div className="fora" onClick={onClose} />
      <section role="dialog" aria-label={label} className={`flutuante anima-entrada ${className}`}>
        {children}
      </section>
    </>
  )
}
