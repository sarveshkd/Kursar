import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Fraunces, Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  title: "Kursar — Resume desk",
  description: "Score a resume section by section and see the exact lines to rewrite. No API key required.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#efe8d8] text-[#1a1714]">{children}</body>
    </html>
  )
}
