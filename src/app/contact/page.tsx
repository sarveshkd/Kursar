import type { Metadata } from "next"
import { Globe, Mail } from "lucide-react"
import { ContactNote } from "@/components/contact-note"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { LinkedInIcon } from "@/components/social-icons"
import { CONTACT_EMAIL, PORTFOLIO, SOCIALS } from "@/lib/contact"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Kursar about Resume Scorer, a free resume checker. Read the portfolio, reach out on LinkedIn, or send a note by email.",
}

export default function ContactPage() {
  const linkedIn = SOCIALS[0]

  return (
    <div className="min-h-full bg-[#efe8d8] text-[#1a1714]">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-[#5c564c] uppercase">Kursar</p>
          <h1 className="font-display mt-2 text-5xl leading-none tracking-tight">Contact</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#3f3a33]">
            Resume Scorer is a free resume checker. Use this page for the portfolio, LinkedIn, or a note about a score.
          </p>

          <a
            href={PORTFOLIO.href}
            className="mt-6 flex items-start gap-3 border border-[#1a1714] bg-[#f7f3ea] p-4 hover:bg-[#efe8d8]"
          >
            <Globe className="mt-0.5 size-4 shrink-0 text-[#6B7C3A]" aria-hidden="true" />
            <span>
              <span className="block text-[11px] tracking-[0.16em] text-[#5c564c] uppercase">Portfolio</span>
              <span className="mt-1 block text-base font-medium text-[#1a1714]">{PORTFOLIO.name}</span>
              <span className="mt-1 block text-sm leading-6 text-[#3f3a33]">{PORTFOLIO.detail}</span>
              <span className="mt-2 block text-sm text-[#234237] underline decoration-[#234237]/40 underline-offset-4">
                sarveshkd.github.io
              </span>
            </span>
          </a>

          <div className="mt-4 border border-[#1a1714] bg-[#f7f3ea] p-4">
            <p className="text-[11px] tracking-[0.16em] text-[#5c564c] uppercase">Reach out</p>
            <ul className="mt-3 space-y-2">
              <li>
                <a href={linkedIn.href} className="flex items-center gap-3 py-1 text-sm hover:text-[#234237]">
                  <LinkedInIcon className="size-4 text-[#6B7C3A]" />
                  <span>
                    <span className="block font-medium text-[#1a1714]">{linkedIn.label}</span>
                    <span className="text-[#5c564c]">{linkedIn.handle}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-3 py-1 text-sm hover:text-[#234237]">
                  <Mail className="size-4 text-[#6B7C3A]" aria-hidden="true" />
                  <span>
                    <span className="block font-medium text-[#1a1714]">Email</span>
                    <span className="text-[#5c564c]">{CONTACT_EMAIL}</span>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <ContactNote />
      </main>
      <SiteFooter />
    </div>
  )
}
