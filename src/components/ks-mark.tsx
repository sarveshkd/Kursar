export function KsMark({ className = "size-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" fill="#6B7C3A" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="Georgia, 'Palatino Linotype', Palatino, serif"
        fontSize="26"
        letterSpacing="-1"
        fill="#F3EFE2"
      >
        KS
      </text>
      <rect x="18" y="48" width="28" height="2" fill="#F3EFE2" />
    </svg>
  )
}
