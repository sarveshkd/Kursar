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
  title: "Resume Scorer · Kursar",
  description: "Resume Scorer is a Kursar product. Upload a resume and see a score for each section, with the exact lines to rewrite.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#efe8d8] text-[#1a1714]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
