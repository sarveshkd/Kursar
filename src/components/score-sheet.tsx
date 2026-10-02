import { Briefcase, GraduationCap, Quote, ScanText, TextAlignStart, Wrench } from "lucide-react"
import { bandFor, type PartId, type PartScore, type ScoreReport } from "@/lib/scoring/types"

const TONE_CLASS = {
  poor: "text-[#9c341f]",
  mixed: "text-[#8a5a12]",
  good: "text-[#1f4d3a]",
  strong: "text-[#1f4d3a]",
} as const

export function ScoreSheet({
  report,
  loading,
  onSample,
}: {
  report: ScoreReport | null
  loading: boolean
  onSample: (sample: "weak" | "strong") => void
}) {
  if (loading) {
    return (
      <section className="sheet-shadow border border-[#1a1714] bg-[#f7f3ea] p-6 sm:p-8" aria-busy="true">
        <p className="text-[11px] tracking-[0.22em] text-[#5c564c] uppercase">Resume Scorer</p>
        <p className="font-display mt-3 text-4xl text-[#1a1714]">Reading the resume…</p>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#3f3a33]">
          Extracting the text, then scoring the summary, experience, skills, education, and ATS shape.
        </p>
        <div className="mt-8 h-px w-full bg-[#1a1714]" />
        <div className="mt-4 h-px w-2/3 bg-[#cfc6b6]" />
      </section>
    )
  }

  if (!report) {
    return (
      <section className="sheet-shadow border border-[#1a1714] bg-[#f7f3ea] p-6 sm:p-8">
        <p className="text-[11px] tracking-[0.22em] text-[#5c564c] uppercase">Resume Scorer</p>
        <h2 className="font-display mt-3 text-4xl leading-tight text-[#1a1714]">Your score will show here.</h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#3f3a33]">
          Upload a resume, or open a John Doe example, and the score will appear here.
        </p>
        <dl className="mt-8 divide-y divide-[#d9d0c0] border-y border-[#1a1714]">
          {BLANK_ROWS.map((row) => (
            <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
              <dt className="text-sm font-medium text-[#1a1714]">{row.label}</dt>
              <dd className="text-sm leading-6 text-[#3f3a33]">{row.detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    )
  }

  const overall = report.parts.find((part) => part.id === "overall") ?? report.parts[0]
  const sections = report.parts.filter((part) => part.id !== "overall")
  const overallBand = bandFor(report.overall)
  const otherSample = report.source.sampleId === "weak" ? "strong" : report.source.sampleId === "strong" ? "weak" : null

  return (
    <section className="sheet-shadow border border-[#1a1714] bg-[#f7f3ea]" aria-live="polite">
      <div className="border-b border-[#1a1714] px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-[#5c564c] uppercase">Overall</p>
            <p
              data-overall-score={report.overall}
              className={`font-display mt-1 text-7xl leading-none tracking-tight sm:text-8xl ${TONE_CLASS[overallBand.tone]}`}
            >
              {report.overall}
            </p>
          </div>
          <div className="sm:text-right">
            <p className={`font-display text-3xl ${TONE_CLASS[overallBand.tone]}`}>{overallBand.label}</p>
            <p className="mt-1 text-xs tracking-wide text-[#5c564c] uppercase">out of 100</p>
            <p className="mt-3 text-sm text-[#1a1714]">{report.source.label}</p>
            <p className="text-xs text-[#5c564c]">
              {report.extracted.wordCount} words extracted · {fileTypeLabel(report.extracted.fileType)}
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#3f3a33]">{overall?.reason}</p>
        {report.note ? <p className="mt-2 text-sm text-[#8a5a12]">{report.note}</p> : null}
        {otherSample ? (
          <button
            type="button"
            className="mt-4 text-sm text-[#234237] underline decoration-[#234237]/40 underline-offset-4 hover:decoration-[#234237]"
            onClick={() => onSample(otherSample)}
          >
            {otherSample === "strong" ? "Compare John Doe’s stronger example" : "Compare John Doe’s weak example"}
          </button>
        ) : null}
      </div>

      <ul className="grid grid-cols-2 gap-px border-b border-[#1a1714] bg-[#1a1714] sm:grid-cols-3 lg:grid-cols-5">
        {sections.map((part) => {
          const band = bandFor(part.score)
          return (
            <li key={part.id} className="bg-[#f7f3ea]">
              <a href={`#part-${part.id}`} className="block px-3 py-3 hover:bg-[#efe8d8] focus-visible:bg-[#efe8d8]">
                <span className="flex items-center gap-1.5 text-[11px] tracking-wide text-[#5c564c] uppercase">
                  <PartIcon id={part.id} />
                  {part.label}
                </span>
                <span className={`font-display text-3xl leading-none ${TONE_CLASS[band.tone]}`} data-part-score={part.id}>
                  {part.score}
                </span>
                <span className="mt-1 block text-xs text-[#3f3a33]">{band.label}</span>
              </a>
            </li>
          )
        })}
      </ul>

      <div className="space-y-8 px-5 py-6 sm:px-8">
        {report.parts.map((part) => (
          <PartBlock key={part.id} part={part} />
        ))}
      </div>
    </section>
  )
}

function PartBlock({ part }: { part: PartScore }) {
  const band = bandFor(part.score)
  return (
    <article id={`part-${part.id}`} className="scroll-mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#1a1714] pb-2">
        <h3 className="flex items-center gap-2 font-display text-2xl text-[#1a1714]">
          <PartIcon id={part.id} />
          {part.label}
        </h3>
        <p className={`text-sm ${TONE_CLASS[band.tone]}`}>
          <span className="font-display text-2xl">{part.score}</span>
          <span className="ml-2">{band.label}</span>
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#3f3a33]">{part.reason}</p>
      <ol className="mt-4 space-y-4">
        {part.improvements.map((item, index) => (
          <li key={`${part.id}-${index}`} className="border border-[#d9d0c0] bg-[#fbf8f2] p-4">
            <p className="flex items-center gap-1.5 text-[11px] tracking-[0.18em] text-[#9c341f] uppercase">
              <Quote className="size-3.5" aria-hidden="true" />
              From the resume
            </p>
            <blockquote className="font-display mt-2 text-xl leading-snug text-[#1a1714]">“{item.excerpt}”</blockquote>
            <p className="mt-3 text-sm leading-6 text-[#3f3a33]">{item.issue}</p>
            <p className="mt-2 text-sm leading-6 text-[#1a1714]">
              <span className="font-medium">Change it. </span>
              {item.change}
            </p>
          </li>
        ))}
      </ol>
    </article>
  )
}

function PartIcon({ id }: { id: PartId }) {
  if (!(id in PART_ICONS)) return null
  const Icon = PART_ICONS[id as keyof typeof PART_ICONS]
  return <Icon className="size-3.5 text-[#6B7C3A]" aria-hidden="true" />
}

const PART_ICONS = {
  summary: TextAlignStart,
  experience: Briefcase,
  skills: Wrench,
  education: GraduationCap,
  ats: ScanText,
} as const

function fileTypeLabel(fileType: ScoreReport["extracted"]["fileType"]): string {
  if (fileType === "sample") return "example resume"
  if (fileType === "pdf") return "PDF"
  if (fileType === "docx") return "DOCX"
  return "plain text"
}

const BLANK_ROWS = [
  {
    label: "Overall",
    detail: "A weighted blend: experience 34%, ATS 20%, skills 18%, summary 16%, education 12%.",
  },
  {
    label: "Summary / profile",
    detail: "Whether the opening names a role and a result, or only asks for a job.",
  },
  {
    label: "Experience & impact",
    detail: "Action verbs, numbers, dates, and bullets that say what changed.",
  },
  {
    label: "Skills",
    detail: "Tools versus traits, and whether the job bullets mention those tools.",
  },
  {
    label: "Education",
    detail: "A degree, a school, and a year, or a line too thin to verify.",
  },
  {
    label: "ATS / formatting",
    detail: "Contact info, standard headings, length, and date consistency in the extract.",
  },
]
