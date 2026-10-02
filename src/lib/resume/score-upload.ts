import { UploadError, UPLOAD_MESSAGES } from "@/lib/resume/errors"
import { extractResumeFile } from "@/lib/resume/extract-file"
import { parseResumeText, type ParsedResume } from "@/lib/resume/parse-sections"
import { isSampleId, SAMPLES, type SampleId } from "@/lib/resume/samples"
import { createScorer } from "@/lib/scoring"
import { scoreWithRubric } from "@/lib/scoring/rubric"
import type { ScoreReport } from "@/lib/scoring/types"

const MAX_PASTE_CHARS = 50_000

export type ScoreInput =
  | { kind: "sample"; sample: SampleId }
  | { kind: "text"; text: string }
  | { kind: "file"; file: File }

export async function scoreUpload(input: ScoreInput): Promise<ScoreReport> {
  const resume = await resumeFrom(input)
  const scorer = createScorer()
  try {
    return await scorer.score(resume)
  } catch (error) {
    if (scorer.engine !== "openai") throw error
    const report = scoreWithRubric(resume)
    report.note =
      "OpenAI scoring was turned on but did not return a usable review, so this result used the local rubric."
    return report
  }
}

async function resumeFrom(input: ScoreInput): Promise<ParsedResume> {
  if (input.kind === "file") return extractResumeFile(input.file)
  if (input.kind === "sample") {
    const sample = SAMPLES[input.sample]
    return parseResumeText(sample.text, {
      filename: sample.filename,
      fileType: "sample",
      source: { kind: "sample", label: sample.title, sampleId: sample.id },
    })
  }
  const text = input.text.trim()
  if (!text) throw new UploadError("empty", UPLOAD_MESSAGES.emptyPaste)
  if (text.length > MAX_PASTE_CHARS) {
    throw new UploadError("too_large", "Pasted text is too long. Keep it under 50,000 characters.")
  }
  return parseResumeText(text, {
    filename: "pasted-resume.txt",
    fileType: "txt",
    source: { kind: "paste", label: "Pasted text", sampleId: null },
  })
}

export function parseScoreJson(body: unknown): ScoreInput {
  if (!body || typeof body !== "object") {
    throw new UploadError("unsupported", "Send a sample name or resume text.")
  }
  const record = body as { sample?: unknown; text?: unknown }
  if (record.sample !== undefined) {
    if (!isSampleId(record.sample)) throw new UploadError("unsupported", UPLOAD_MESSAGES.unknownSample)
    return { kind: "sample", sample: record.sample }
  }
  if (typeof record.text === "string") return { kind: "text", text: record.text }
  throw new UploadError("unsupported", "Send a sample name or resume text.")
}
