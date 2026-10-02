import { describe, expect, it } from "vitest"
import { parseResumeText } from "@/lib/resume/parse-sections"
import { SAMPLES } from "@/lib/resume/samples"
import { scoreUpload } from "@/lib/resume/score-upload"
import { createScorer } from "@/lib/scoring"
import { reportFromModel } from "@/lib/scoring/openai"
import { scoreWithRubric } from "@/lib/scoring/rubric"
import type { PartId, ScoreReport } from "@/lib/scoring/types"

function scoreSample(id: "weak" | "strong") {
  const sample = SAMPLES[id]
  return scoreWithRubric(
    parseResumeText(sample.text, {
      filename: sample.filename,
      fileType: "sample",
      source: { kind: "sample", label: sample.title, sampleId: sample.id },
    }),
  )
}

function part(report: ScoreReport, id: PartId) {
  const found = report.parts.find((item) => item.id === id)
  if (!found) throw new Error(`missing ${id}`)
  return found
}

describe("rubric scorer", () => {
  const weak = scoreSample("weak")
  const strong = scoreSample("strong")

  it("scores the stronger draft well above the weak draft", () => {
    expect(weak.overall).toBeLessThan(50)
    expect(strong.overall).toBeGreaterThan(80)
    expect(strong.overall - weak.overall).toBeGreaterThanOrEqual(30)
    expect(part(strong, "experience").score).toBeGreaterThan(part(weak, "experience").score)
    expect(part(strong, "skills").score).toBeGreaterThan(part(weak, "skills").score)
  })

  it("returns every requested part with a quote from the resume", () => {
    for (const report of [weak, strong]) {
      expect(report.engine).toBe("rubric")
      expect(report.parts.map((item) => item.id)).toEqual([
        "overall",
        "summary",
        "experience",
        "skills",
        "education",
        "ats",
      ])
      for (const item of report.parts) {
        expect(item.reason.length).toBeGreaterThan(10)
        expect(item.improvements.length).toBeGreaterThan(0)
        for (const improvement of item.improvements) {
          expect(report.extracted.text.includes(improvement.excerpt)).toBe(true)
          expect(improvement.change.length).toBeGreaterThan(10)
        }
      }
    }
  })

  it("ties weak-draft advice to the uploaded lines", () => {
    expect(part(weak, "experience").improvements.some((item) => item.excerpt.includes("Responsible for handling customer issues"))).toBe(true)
    expect(part(weak, "skills").improvements.some((item) => item.excerpt.includes("Microsoft Office"))).toBe(true)
    expect(part(weak, "education").improvements.some((item) => item.excerpt === "College")).toBe(true)
    expect(
      part(weak, "summary").improvements.some((item) => /Hard worker and team player|results-driven|Seeking a challenging/i.test(item.excerpt)),
    ).toBe(true)
    expect(part(weak, "ats").improvements.some((item) => item.excerpt === "JOHN DOE")).toBe(true)
  })

  it("flags a skill the stronger draft lists but never uses", () => {
    expect(part(strong, "skills").improvements.some((item) => item.excerpt.includes("Gorgias"))).toBe(true)
    expect(part(strong, "skills").reason.toLowerCase()).toContain("gorgias")
  })

  it("recognizes standard headings and leaves the raw text intact", () => {
    expect(weak.extracted.headings).toEqual(["Objective", "Experience", "Skills", "Education"])
    expect(weak.extracted.sections.find((section) => section.id === "experience")?.text).toContain("Retail Helper, Some Store")
    expect(strong.extracted.text).toContain("Cut repeat contacts 18%")
  })

  it("penalizes mixed date styles and repeated keywords", () => {
    const text = `Mina Cho
mina@example.com | (415) 555-0199

Summary
Operations analyst with 4 years in billing.

Experience
North Office | 01/2020 - 01/2022
- Built a billing checklist that cut close time 20%.
Acme | Mar 2022 - Present
- Automated the same billing billing billing billing billing billing billing billing export.

Skills
Excel, SQL

Education
B.A. Economics, State University, 2019
`
    const report = scoreWithRubric(
      parseResumeText(text, {
        filename: "mina.txt",
        fileType: "txt",
        source: { kind: "paste", label: "Pasted text", sampleId: null },
      }),
    )
    const ats = part(report, "ats")
    expect(ats.improvements.some((item) => item.excerpt.includes("01/2020") || item.issue.includes("01/2020"))).toBe(true)
    expect(ats.improvements.some((item) => item.issue.toLowerCase().includes("billing"))).toBe(true)
    for (const item of ats.improvements) {
      expect(report.extracted.text.includes(item.excerpt)).toBe(true)
    }
  })
})

describe("scorer selection", () => {
  it("stays on the rubric unless OpenAI is explicitly selected", () => {
    expect(createScorer({}).engine).toBe("rubric")
    expect(createScorer({ OPENAI_API_KEY: "sk-test" }).engine).toBe("rubric")
    expect(createScorer({ OPENAI_API_KEY: "sk-test", SCORER_PROVIDER: "openai" }).engine).toBe("openai")
  })

  it("rejects a model score that invents a quote", () => {
    const resume = parseResumeText(SAMPLES.strong.text, {
      filename: "strong.txt",
      fileType: "txt",
      source: { kind: "paste", label: "Pasted text", sampleId: null },
    })
    const base = {
      score: 70,
      reason: "Specific to this resume.",
      improvements: [{ excerpt: "Cut repeat contacts 18%", issue: "Fine.", change: "Keep it." }],
    }
    expect(() =>
      reportFromModel(
        {
          parts: [
            { id: "overall", ...base },
            { id: "summary", ...base },
            { id: "experience", ...base, improvements: [{ excerpt: "Invented line that is not on the page", issue: "No.", change: "No." }] },
            { id: "skills", ...base },
            { id: "education", ...base },
            { id: "ats", ...base },
          ],
        },
        resume,
      ),
    ).toThrow(/experience/)
  })
})

describe("score upload", () => {
  it("scores a pasted resume and a text file", async () => {
    const pasted = await scoreUpload({ kind: "text", text: SAMPLES.weak.text })
    expect(pasted.source.kind).toBe("paste")
    expect(pasted.overall).toBeLessThan(50)

    const file = new File([SAMPLES.strong.text], "strong.txt", { type: "text/plain" })
    const uploaded = await scoreUpload({ kind: "file", file })
    expect(uploaded.extracted.text).toContain("Zendesk")
    expect(uploaded.overall).toBeGreaterThan(80)
  })
})
