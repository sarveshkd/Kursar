import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Fraunces, Outfit } from "next/font/google"
import Script from "next/script"
import { adsenseClient } from "@/lib/adsense"
import { analyticsId } from "@/lib/analytics"
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
  verification: googleSiteVerification() ? { google: googleSiteVerification()! } : undefined,
}

function googleSiteVerification(): string | null {
  const value = process.env.GOOGLE_SITE_VERIFICATION?.trim()
  if (!value || !/^[A-Za-z0-9_-]{8,}$/.test(value)) return null
  return value
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Resume Scorer",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Free resume checker. Upload a PDF, DOCX, or text resume and get section scores with the lines to rewrite.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  provider: { "@type": "Organization", name: "Kursar", url: SITE_URL },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#efe8d8] text-[#1a1714]" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {adsenseClient() ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient()}`}
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        ) : null}
        {analyticsId() ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId()}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analyticsId()}');`}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  )
}
