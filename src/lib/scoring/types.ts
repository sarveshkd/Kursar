import type { ExtractedSection, ParsedResume } from "@/lib/resume/parse-sections"

export type PartId = "overall" | "summary" | "experience" | "skills" | "education" | "ats"

export type ScorerEngine = "rubric" | "openai"

export interface Improvement {
  excerpt: string
  issue: string
  change: string
}

export interface PartScore {
  id: PartId
  label: string
  score: number
  reason: string
  improvements: Improvement[]
}

export interface ScoreReport {
  engine: ScorerEngine
  note: string | null
  overall: number
  parts: PartScore[]
  source: {
    kind: "sample" | "upload" | "paste"
    label: string
    sampleId: "weak" | "strong" | null
  }
  extracted: {
    filename: string
    fileType: ParsedResume["fileType"]
    wordCount: number
    text: string
    headings: string[]
    sections: ExtractedSection[]
  }
}

export interface ResumeScorer {
  readonly engine: ScorerEngine
  score(resume: ParsedResume): Promise<ScoreReport>
}

export const PART_LABELS: Record<PartId, string> = {
  overall: "Overall",
  summary: "Summary / profile",
  experience: "Experience & impact",
  skills: "Skills",
  education: "Education",
  ats: "ATS / formatting",
}

export const SECTION_WEIGHTS = {
  summary: 0.16,
  experience: 0.34,
  skills: 0.18,
  education: 0.12,
  ats: 0.2,
} as const

export function bandFor(score: number): {
  label: string
  tone: "poor" | "mixed" | "good" | "strong"
} {
  if (score >= 80) return { label: "Strong", tone: "strong" }
  if (score >= 65) return { label: "Solid", tone: "good" }
  if (score >= 45) return { label: "Uneven", tone: "mixed" }
  return { label: "Needs work", tone: "poor" }
}
