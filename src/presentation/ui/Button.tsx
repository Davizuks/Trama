import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon.tsx'

type NativeProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

interface ButtonProps extends NativeProps {
  kind?: 'primario' | 'secundario' | 'texto'
  danger?: boolean
  children: ReactNode
}

export function Button({ kind = 'secundario', danger = false, children, ...rest }: ButtonProps) {
  const classes = ['botao', `botao--${kind}`, danger && 'botao--perigo'].filter(Boolean).join(' ')
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}

interface IconButtonProps extends NativeProps {
  icon: IconName
  label: string
  size?: number
  tone?: 'neutro' | 'claro' | 'apagado'
}

export function IconButton({ icon, label, size = 16, tone = 'neutro', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`botao-icone botao-icone--${tone}`}
      aria-label={label}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}
