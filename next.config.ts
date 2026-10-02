import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth"],
  // The dev server only trusts localhost. A public tunnel is a different host,
  // so the browser is blocked until that host is listed here.
  allowedDevOrigins: ["*.trycloudflare.com"],
}

export default nextConfig
