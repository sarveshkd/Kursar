const CLIENT_RE = /^ca-pub-\d+$/
const SITE_ADSENSE_CLIENT = "ca-pub-1371580539332544"

export function adsenseClient(): string | null {
  const value = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || SITE_ADSENSE_CLIENT
  if (!CLIENT_RE.test(value)) return null
  return value
}

export function adsensePublisherId(client: string): string {
  return client.slice(3)
}
