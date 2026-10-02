const MEASUREMENT_RE = /^G-[A-Z0-9]+$/

export function analyticsId(): string | null {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  if (!value || !MEASUREMENT_RE.test(value)) return null
  return value
}
