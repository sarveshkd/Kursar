"use client"

import { useRef, useState } from "react"
import { ExtractPanel } from "@/components/extract-panel"
import { ScoreSheet } from "@/components/score-sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MAX_UPLOAD_BYTES, UPLOAD_MESSAGES } from "@/lib/resume/errors"
import { fileKind } from "@/lib/resume/file-kind"
import { SAMPLES, type SampleId } from "@/lib/resume/samples"
import type { ScoreReport } from "@/lib/scoring/types"

export function ReviewDesk() {
  const [report, setReport] = useState<ScoreReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [paste, setPaste] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function receive(response: Response) {
    const payload = (await response.json()) as ScoreReport | { error?: string }
    if (!response.ok || !("parts" in payload)) {
      setReport(null)
      setError("error" in payload && payload.error ? payload.error : "The resume could not be scored.")
      return
    }
    setError(null)
    setReport(payload)
  }

  async function post(body: BodyInit, headers?: HeadersInit) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/score", { method: "POST", body, headers })
      await receive(response)
    } catch {
      setReport(null)
      setError("The review could not be completed. Start the dev server and try the file again.")
    } finally {
      setLoading(false)
    }
  }

  function scoreSample(sample: SampleId) {
    void post(JSON.stringify({ sample }), { "Content-Type": "application/json" })
  }

  function scorePaste() {
    void post(JSON.stringify({ text: paste }), { "Content-Type": "application/json" })
  }

  function scoreFile(file: File | undefined) {
    if (!file) return
    const problem = clientFileError(file)
    if (problem) {
      setReport(null)
      setError(problem)
      return
    }
    const form = new FormData()
    form.append("file", file)
    void post(form)
  }

  return (
    <div className="min-h-full bg-[#efe8d8] text-[#1a1714]">
      <header className="border-b border-[#1a1714] bg-[#f6f1e6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-[11px] font-medium tracking-[0.28em] text-[#5c564c] uppercase">Resume desk</p>
            <h1 className="font-display text-5xl leading-none tracking-tight sm:text-6xl">Kursar</h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#3f3a33]">
            A line-level read of the resume you upload. Scores quote the weak spot, then say what to change. No API key required.
          </p>
        </div>
      </header>

      {error ? (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <p role="alert" className="border border-[#9c341f] bg-[#f8ebe6] px-4 py-3 text-sm leading-6 text-[#6e2618]">
            {error}
          </p>
        </div>
      ) : null}

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="order-1 space-y-4 lg:col-start-1 lg:row-start-1">
          <section className="border border-[#1a1714] bg-[#f7f3ea] p-4">
            <h2 className="text-sm font-medium">Put a resume on the desk</h2>
            <label
              className={`mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-6 text-center ${
                dragOver ? "border-[#234237] bg-[#e7f0ea]" : "border-[#234237] bg-[#fbf8f2]"
              }`}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOver(false)
                scoreFile(event.dataTransfer.files[0])
              }}
            >
              <span className="font-display text-2xl">Drop a file</span>
              <span className="mt-1 text-sm text-[#5c564c]">PDF, DOCX, or plain text · up to 5 MB</span>
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept=".pdf,.docx,.txt,.text,.md,application/pdf,text/plain"
                aria-label="Upload a resume"
                onChange={(event) => {
                  scoreFile(event.target.files?.[0])
                  event.target.value = ""
                }}
              />
            </label>
            <div className="mt-4 grid gap-2">
              {(Object.keys(SAMPLES) as SampleId[]).map((id) => (
                <Button
                  key={id}
                  type="button"
                  variant={id === "strong" ? "default" : "outline"}
                  className="h-auto justify-start rounded-none px-3 py-2 text-left whitespace-normal"
                  disabled={loading}
                  onClick={() => scoreSample(id)}
                >
                  <span>
                    <span className="block text-sm">{SAMPLES[id].title}</span>
                    <span className="block text-xs font-normal opacity-80">{SAMPLES[id].detail}</span>
                  </span>
                </Button>
              ))}
            </div>
            <details className="mt-4 border border-[#d9d0c0]">
              <summary className="cursor-pointer px-3 py-2 text-sm">Paste plain text instead</summary>
              <div className="space-y-2 border-t border-[#d9d0c0] p-3">
                <Textarea
                  value={paste}
                  onChange={(event) => setPaste(event.target.value)}
                  placeholder="Paste the resume here"
                  aria-label="Resume text"
                  className="min-h-32 rounded-none bg-[#fbf8f2] text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-none"
                  disabled={loading || !paste.trim()}
                  onClick={scorePaste}
                >
                  Score pasted text
                </Button>
              </div>
            </details>
          </section>
        </div>

        <div className="order-3 lg:col-start-1 lg:row-start-2">
          <ExtractPanel report={report} />
        </div>

        <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <ScoreSheet report={loading ? null : report} loading={loading} onSample={scoreSample} />
          <p className="mt-4 text-xs leading-5 text-[#5c564c]">
            80–100 strong · 65–79 solid · 45–64 uneven · 0–44 needs work. Scanned PDFs and legacy .doc files are rejected.
            The rubric does not see a job posting, so it cannot judge fit for one role.
          </p>
        </div>
      </main>
    </div>
  )
}

function clientFileError(file: File): string | null {
  if (file.size === 0) return UPLOAD_MESSAGES.empty
  if (file.size > MAX_UPLOAD_BYTES) return UPLOAD_MESSAGES.tooLarge
  const kind = fileKind(file)
  if (kind === "doc") return UPLOAD_MESSAGES.legacyDoc
  if (kind === "unsupported") return UPLOAD_MESSAGES.unsupported
  return null
}
