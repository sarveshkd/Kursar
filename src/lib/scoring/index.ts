import { createOpenAIScorer } from "@/lib/scoring/openai"
import { scoreWithRubric } from "@/lib/scoring/rubric"
import type { ResumeScorer } from "@/lib/scoring/types"

export const rubricScorer: ResumeScorer = {
  engine: "rubric",
  score(resume) {
    return Promise.resolve(scoreWithRubric(resume))
  },
}

type ScorerEnv = {
  SCORER_PROVIDER?: string
  OPENAI_API_KEY?: string
  OPENAI_MODEL?: string
  [key: string]: string | undefined
}

export function createScorer(env: ScorerEnv = process.env): ResumeScorer {
  const provider = env.SCORER_PROVIDER?.trim().toLowerCase()
  const apiKey = env.OPENAI_API_KEY?.trim()
  if (provider === "openai" && apiKey) {
    return createOpenAIScorer(apiKey, env.OPENAI_MODEL?.trim() || "gpt-4o-mini")
  }
  return rubricScorer
}
