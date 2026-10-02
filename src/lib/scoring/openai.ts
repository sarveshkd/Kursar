import { toExtracted, type ParsedResume } from "@/lib/resume/parse-sections"
import { clampScore } from "@/lib/resume/text"
import {
  PART_LABELS,
  type PartId,
  type PartScore,
  type ResumeScorer,
  type ScoreReport,
} from "@/lib/scoring/types"

const PART_IDS: PartId[] = ["overall", "summary", "experience", "skills", "education", "ats"]

const SYSTEM_PROMPT = `You score resumes. Return JSON only.
Score these parts from 0 to 100: overall, summary, experience, skills, education, ats.
Each part needs a short reason and 1 to 4 improvements.
Every improvement must include:
- excerpt: an EXACT substring copied from the resume (a weak line or phrase)
- issue: what is wrong with that excerpt
- change: the specific rewrite, using nouns from the excerpt
Do not give advice that would fit any resume. If a section is missing, excerpt a real line that is present and say what to add.
Overall is a judgment of the whole page, not an average you have to compute.
Use this shape:
{"overall": number, "parts": [{"id": "overall"|"summary"|"experience"|"skills"|"education"|"ats", "score": number, "reason": string, "improvements": [{"excerpt": string, "issue": string, "change": string}]}]}`

interface ModelImprovement {
  excerpt?: unknown
  issue?: unknown
  change?: unknown
}

interface ModelPart {
  id?: unknown
  score?: unknown
  reason?: unknown
  improvements?: ModelImprovement[]
}

interface ModelPayload {
  parts?: ModelPart[]
}

export function reportFromModel(raw: unknown, resume: ParsedResume): ScoreReport {
  if (!raw || typeof raw !== "object") {
    throw new Error("The model response was not an object.")
  }
  const payload = raw as ModelPayload
  if (!Array.isArray(payload.parts)) {
    throw new Error("The model response did not include parts.")
  }

  const parts: PartScore[] = PART_IDS.map((id) => {
    const found = payload.parts?.find((part) => part.id === id)
    if (!found) throw new Error(`The model response missed the ${id} score.`)
    const improvements = (found.improvements ?? []).flatMap((item) => {
      if (typeof item.excerpt !== "string" || typeof item.issue !== "string" || typeof item.change !== "string") {
        return []
      }
      if (!resume.text.includes(item.excerpt) || !item.excerpt.trim()) return []
      return [{ excerpt: item.excerpt, issue: item.issue.trim(), change: item.change.trim() }]
    })
    if (!improvements.length) {
      throw new Error(`The model did not quote the resume for ${id}.`)
    }
    const reason = typeof found.reason === "string" ? found.reason.trim() : ""
    if (!reason) throw new Error(`The model gave no reason for ${id}.`)
    return {
      id,
      label: PART_LABELS[id],
      score: clampScore(Number(found.score)),
      reason,
      improvements: improvements.slice(0, 4),
    }
  })

  return {
    engine: "openai",
    note: null,
    overall: parts[0]?.score ?? 0,
    parts,
    source: resume.source,
    extracted: toExtracted(resume),
  }
}

export function createOpenAIScorer(apiKey: string, model = "gpt-4o-mini"): ResumeScorer {
  return {
    engine: "openai",
    async score(resume) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Score this resume:\n\n${resume.text}`,
            },
          ],
        }),
      })
      if (!response.ok) {
        throw new Error(`OpenAI request failed (${response.status}).`)
      }
      const body = (await response.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      const content = body.choices?.[0]?.message?.content
      if (!content) throw new Error("OpenAI returned an empty score.")
      return reportFromModel(JSON.parse(content) as unknown, resume)
    },
  }
}
