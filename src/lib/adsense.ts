const CLIENT_RE = /^ca-pub-\d+$/

export function adsenseClient(): string | null {
  const value = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim()
  if (!value || !CLIENT_RE.test(value)) return null
  return value
}

export function adsensePublisherId(client: string): string {
  return client.slice(3)
}
