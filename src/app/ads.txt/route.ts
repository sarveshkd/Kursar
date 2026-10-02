import { adsenseClient, adsensePublisherId } from "@/lib/adsense"

export function GET() {
  const client = adsenseClient()
  if (!client) {
    return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  }
  const body = `google.com, ${adsensePublisherId(client)}, DIRECT, f08c47fec0942fa0\n`
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  })
}
