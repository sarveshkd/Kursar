import { FileSearch } from "lucide-react"
import type { ScoreReport } from "@/lib/scoring/types"

export function ExtractPanel({ report }: { report: ScoreReport | null }) {
  if (!report) {
    return (
      <section className="border border-[#1a1714] bg-[#f7f3ea] p-4">
        <h2 className="flex items-center gap-2 text-sm font-medium text-[#1a1714]">
          <FileSearch className="size-4 text-[#6B7C3A]" aria-hidden="true" />
          Extracted text
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5c564c]">
          After a score, this is the text Resume Scorer read. If a heading or a bullet is missing here, it was not in the file.
        </p>
      </section>
    )
  }

  const { extracted } = report
  return (
    <section className="border border-[#1a1714] bg-[#f7f3ea] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-[#1a1714]">
          <FileSearch className="size-4 text-[#6B7C3A]" aria-hidden="true" />
          Extracted text
        </h2>
        <p className="text-xs text-[#5c564c]">{extracted.wordCount} words</p>
      </div>
      <p className="mt-1 truncate text-xs text-[#5c564c]">{extracted.filename}</p>
      <p className="mt-3 text-[11px] tracking-[0.16em] text-[#5c564c] uppercase">
        {extracted.headings.length ? `Headings: ${extracted.headings.join(" · ")}` : "No standard headings found"}
      </p>
      <div className="mt-3 max-h-72 overflow-auto border border-[#d9d0c0] bg-[#fbf8f2] p-3">
        <pre className="font-sans text-sm leading-6 whitespace-pre-wrap text-[#1a1714]">{extracted.text}</pre>
      </div>
      <div className="mt-4 space-y-3">
        {extracted.sections.map((section) => (
          <div key={section.id}>
            <h3 className="text-xs font-medium tracking-wide text-[#5c564c] uppercase">{section.label}</h3>
            <p className="text-xs text-[#8a5a12]">
              {section.heading ? `Heading read as “${section.heading}”` : "No heading found"}
            </p>
            <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-[#1a1714]">
              {section.text || "Nothing extracted for this part."}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
