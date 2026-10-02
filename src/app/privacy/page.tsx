import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { CONTACT_EMAIL } from "@/lib/contact"

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Kursar Resume Scorer handles an uploaded resume, email notes, and advertising cookies.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-full bg-[#efe8d8] text-[#1a1714]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-[11px] font-medium tracking-[0.22em] text-[#5c564c] uppercase">Kursar</p>
        <h1 className="font-display mt-2 text-5xl leading-none tracking-tight">Privacy</h1>
        <div className="mt-6 space-y-4 text-sm leading-6 text-[#3f3a33]">
          <p>
            Resume Scorer reads the file you upload in that request, scores the text, and sends the score back to your browser. The upload is not saved, and there is no account.
          </p>
          <p>
            A note on the contact page opens your own email app. It is sent only if you press send there. That message goes to {CONTACT_EMAIL}.
          </p>
          <p>
            When traffic measurement is turned on, Google Analytics records the page, the rough location, and how someone arrived. The resume text is not sent there. Measurement stays off until a measurement id is configured. When advertising is turned on, Google AdSense may place a cookie to choose and measure ads. Google describes that in its{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              className="text-[#234237] underline decoration-[#234237]/40 underline-offset-4"
            >
              advertising technologies policy
            </a>
            . Ads stay off until a publisher id is configured for this site.
          </p>
          <p>
            Questions go to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#234237] underline decoration-[#234237]/40 underline-offset-4">
              {CONTACT_EMAIL}
            </a>{" "}
            or the <Link href="/contact" className="text-[#234237] underline decoration-[#234237]/40 underline-offset-4">contact page</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
