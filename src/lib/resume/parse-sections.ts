import { UploadError, UPLOAD_MESSAGES } from "@/lib/resume/errors"
import { normalizeExtracted, wordCount } from "@/lib/resume/text"

export type SectionId = "summary" | "experience" | "skills" | "education" | "other"

export type ResumeFileType = "pdf" | "docx" | "txt" | "sample"

export interface ResumeSource {
  kind: "sample" | "upload" | "paste"
  label: string
  sampleId: "weak" | "strong" | null
}

export interface ExtractedSection {
  id: "opening" | SectionId
  label: string
  heading: string | null
  text: string
}

export interface ParsedResume {
  filename: string
  fileType: ResumeFileType
  source: ResumeSource
  text: string
  wordCount: number
  lines: string[]
  preamble: string
  sections: Record<SectionId, string>
  headingsFound: { id: SectionId; label: string }[]
}

const HEADING_RULES: { id: SectionId; re: RegExp }[] = [
  {
    id: "summary",
    re: /^(?:professional\s+|career\s+|personal\s+)?(?:summary|profile|objective|about(?:\s+me)?)$/i,
  },
  {
    id: "experience",
    re: /^(?:(?:work|professional|relevant)\s+)?experience$|^work\s+history$|^employment(?:\s+history)?$/i,
  },
  {
    id: "skills",
    re: /^(?:(?:technical|core|key|professional)\s+)?skills$|^(?:core\s+)?competencies$|^technologies$|^technical\s+expertise$/i,
  },
  {
    id: "education",
    re: /^education(?:\s+(?:and|&)\s+training)?$|^academic\s+background$|^academics$/i,
  },
  {
    id: "other",
    re: /^(?:projects?|certifications?|licenses?|awards?|honors?|volunteer(?:ing)?|publications?|interests|activities|references)$/i,
  },
]

export function matchHeading(line: string): { id: SectionId; label: string } | null {
  const cleaned = line
    .replace(/^#{1,6}\s+/, "")
    .replace(/[:：]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned || cleaned.length > 48 || /[.!?]/.test(cleaned)) return null
  for (const rule of HEADING_RULES) {
    if (rule.re.test(cleaned)) return { id: rule.id, label: line.trim() }
  }
  return null
}

export function parseResumeText(
  raw: string,
  meta: { filename: string; fileType: ResumeFileType; source: ResumeSource },
): ParsedResume {
  const text = normalizeExtracted(raw)
  if (!text) {
    throw new UploadError("empty", UPLOAD_MESSAGES.emptyExtract)
  }

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  const buckets: Record<"preamble" | SectionId, string[]> = {
    preamble: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
    other: [],
  }
  const headingsFound: { id: SectionId; label: string }[] = []
  let current: "preamble" | SectionId = "preamble"

  for (const line of lines) {
    const heading = matchHeading(line)
    if (heading) {
      current = heading.id
      headingsFound.push(heading)
      continue
    }
    buckets[current].push(line)
  }

  const sections: Record<SectionId, string> = {
    summary: buckets.summary.join("\n"),
    experience: buckets.experience.join("\n"),
    skills: buckets.skills.join("\n"),
    education: buckets.education.join("\n"),
    other: buckets.other.join("\n"),
  }

  return {
    filename: meta.filename,
    fileType: meta.fileType,
    source: meta.source,
    text,
    wordCount: wordCount(text),
    lines,
    preamble: buckets.preamble.join("\n"),
    sections,
    headingsFound,
  }
}

const SECTION_DISPLAY: { id: ExtractedSection["id"]; label: string }[] = [
  { id: "opening", label: "Opening lines" },
  { id: "summary", label: "Summary / profile" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "other", label: "Other sections" },
]

export function extractedSections(resume: ParsedResume): ExtractedSection[] {
  return SECTION_DISPLAY.map((section) => {
    if (section.id === "opening") {
      return {
        id: section.id,
        label: section.label,
        heading: null,
        text: resume.preamble,
      }
    }
    const heading = resume.headingsFound.find((item) => item.id === section.id)
    return {
      id: section.id,
      label: section.label,
      heading: heading?.label ?? null,
      text: resume.sections[section.id],
    }
  }).filter((section) => section.id !== "other" || section.text || section.heading)
}

export function toExtracted(resume: ParsedResume) {
  return {
    filename: resume.filename,
    fileType: resume.fileType,
    wordCount: resume.wordCount,
    text: resume.text,
    headings: resume.headingsFound.map((heading) => heading.label),
    sections: extractedSections(resume),
  }
}
