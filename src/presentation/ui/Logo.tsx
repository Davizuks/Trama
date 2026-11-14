export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="logo"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M30 5V11" />
      <path d="M30 35V40C30 52 35 58 43 58C52 58 57 52 57 44C57 28 44 22 6 22" />
    </svg>
  )
}
