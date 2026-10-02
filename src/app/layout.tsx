import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Fraunces, Outfit } from "next/font/google"
import { SITE_URL } from "@/lib/contact"
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Free Resume Checker · Kursar",
    template: "%s · Kursar",
  },
  description:
    "Resume Scorer is a free resume checker from Kursar. Upload a PDF, DOCX, or text resume and get a score for the summary, experience, skills, education, and ATS formatting, with the lines to rewrite.",
  openGraph: {
    title: "Free Resume Checker · Kursar",
    description:
      "Upload a resume and see a score for each section, with the exact lines to rewrite. A free Kursar product.",
    url: SITE_URL,
    siteName: "Kursar",
    type: "website",
  },
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
