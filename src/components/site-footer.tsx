import Link from "next/link"
import { Mail } from "lucide-react"
import { KsMark } from "@/components/ks-mark"
import { CONTACT_EMAIL } from "@/lib/contact"

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1a1714] bg-[#f6f1e6]">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm leading-6 text-[#3f3a33] sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-medium text-[#1a1714]">How a score reads</p>
          <p className="mt-2">80–100 strong. 65–79 solid. 45–64 uneven. 0–44 needs work.</p>
        </div>
        <div>
          <p className="font-medium text-[#1a1714]">What you can upload</p>
          <p className="mt-2">PDF, DOCX, or plain text, up to 5 MB. A photo or scan of a resume needs a text-based PDF.</p>
        </div>
        <div>
          <p className="font-medium text-[#1a1714]">What Resume Scorer looks at</p>
          <p className="mt-2">
            Summary, experience, skills, education, and formatting. It quotes lines from your file. It does not compare you to one job posting.
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-[#d9d0c0] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <KsMark className="size-9" />
          <div>
            <p className="font-display text-2xl leading-none text-[#1a1714]">Kursar</p>
            <p className="mt-1 text-sm text-[#5c564c]">
              Resume Scorer is a free resume checker. Uploads are scored in this session and are not stored.
            </p>
          </div>
        </div>
        <Link href="/contact" className="inline-flex items-center gap-2 text-sm text-[#234237]">
          <Mail className="size-4" aria-hidden="true" />
          {CONTACT_EMAIL}
        </Link>
      </div>
    </footer>
  )
}
