const MEASUREMENT_RE = /^G-[A-Z0-9]+$/
const SITE_MEASUREMENT_ID = "G-B8Y8983V45"

export function analyticsId(): string | null {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || SITE_MEASUREMENT_ID
  if (!MEASUREMENT_RE.test(value)) return null
  return value
}
