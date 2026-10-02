import Link from "next/link"
import { KsMark } from "@/components/ks-mark"

export function SiteHeader() {
  return (
    <header className="border-b border-[#1a1714] bg-[#f6f1e6]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <KsMark className="size-11 shrink-0 sm:size-12" />
          <span className="min-w-0">
            <span className="font-display block text-3xl leading-none tracking-tight sm:text-4xl">Kursar</span>
            <span className="mt-1 block text-sm text-[#5c564c]">Resume Scorer</span>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-4 text-sm sm:gap-5">
          <Link
            href="/#how-to-use"
            className="text-[#234237] underline decoration-[#234237]/40 underline-offset-4 hover:decoration-[#234237]"
          >
            How to use
          </Link>
          <Link
            href="/contact"
            className="text-[#234237] underline decoration-[#234237]/40 underline-offset-4 hover:decoration-[#234237]"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
}
