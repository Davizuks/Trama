import type { InputHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon.tsx'

export function Toggle(props: { on: boolean; label: string; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.on}
      aria-label={props.label}
      className={`alternador ${props.on ? 'alternador--ligado' : ''}`}
      onClick={() => props.onChange(!props.on)}
    >
      <span className="alternador__botao" />
    </button>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="segmentado" role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`segmentado__opcao ${selected ? 't-ui-13-forte' : 't-ui-13'}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  icon?: IconName
  mono?: boolean
}

export function Field({ label, icon, mono = false, ...rest }: FieldProps) {
  return (
    <label className="campo">
      <span className="so-leitor">{label}</span>
      {icon && <Icon name={icon} />}
      <input className={mono ? 't-terminal' : 't-ui-13'} {...rest} />
    </label>
  )
}

interface SelectProps<T extends string> {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}

export function Select<T extends string>({ label, value, options, onChange }: SelectProps<T>) {
  return (
    <label className="campo campo--escolha">
      <span className="so-leitor">{label}</span>
      <select
        className="t-ui-13"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name="baixo" />
    </label>
  )
}
