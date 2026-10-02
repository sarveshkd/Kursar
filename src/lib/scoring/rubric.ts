import { toExtracted, type ParsedResume } from "@/lib/resume/parse-sections"
import { clampScore, quoteMatch, wordCount } from "@/lib/resume/text"
import {
  PART_LABELS,
  SECTION_WEIGHTS,
  type Improvement,
  type PartId,
  type PartScore,
  type ScoreReport,
} from "@/lib/scoring/types"

interface DraftImprovement extends Improvement {
  priority: number
}

const MONTH =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}/
const MONTH_YEAR_RE = new RegExp(`\\b${MONTH}\\.?\\s+\\d{4}\\b`, "i")
const YEAR_RE = /\b(?:19|20)\d{2}\b/
const NUMERIC_DATE_RE = /\b\d{1,2}\/\d{4}\b/
const ISO_DATE_RE = /\b(?:19|20)\d{2}-\d{2}\b/
const METRIC_RE =
  /(?:\$\s?\d|\b\d+(?:\.\d+)?\s?%|\b\d+(?:\.\d+)?\s?(?:k|m)\b|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s*(?:hours?|days?|weeks?|months?|years?|minutes?|users?|customers?|tickets?|agents?|engineers?|people)\b|\b\d+\s*[-–—]\s*\d+\b)/i
const ROLE_RE =
  /\b(engineer|developer|designer|manager|analyst|lead|specialist|consultant|nurse|teacher|accountant|recruiter|writer|editor|coordinator|director|associate|intern|architect|administrator|representative|support|planner|technician|founder|programmer|scientist|researcher|marketer)\b/i
const SEEKING_RE =
  /seeking (?:a |an )?(?:challenging |rewarding )?(?:position|role|opportunity)|looking for (?:a |an )?(?:challenging |new )?(?:position|role|opportunity)|to utilize my skills/i
const WEAK_OPENER_RE =
  /^(?:responsible for|duties included|tasked with|helped(?: with| the)?|assisted(?: with| in)?|worked on|worked with|participated in|involved in|handled)\b/i
const ACTION_RE =
  /^(?:led|built|launched|designed|implemented|reduced|increased|grew|shipped|owned|migrated|automated|negotiated|mentored|analyzed|analysed|delivered|improved|cut|saved|generated|architected|spearheaded|streamlined|established|created|developed|introduced|managed|directed|produced|wrote|coached|resolved|trained|partnered|scaled|consolidated|overhauled|deployed|integrated|measured|hired|closed|won|published|presented|standardized|eliminated|shortened|raised|lowered|doubled|tripled|replaced|rewrote|deflected|lifted|removed)\b/i

const BUZZ_RES: { label: string; re: RegExp }[] = [
  { label: "results-driven", re: /results?[-\s]?driven/i },
  { label: "self-starter", re: /self[-\s]?starter/i },
  { label: "team player", re: /team\s?player/i },
  { label: "hard worker", re: /hard\s?worker/i },
  { label: "outside the box", re: /outside the box/i },
  { label: "go-getter", re: /go[-\s]?getter/i },
  { label: "synergy", re: /\bsynergy\b/i },
  { label: "passionate", re: /\bpassionate\b/i },
  { label: "dynamic", re: /\bdynamic\b/i },
  { label: "detail-oriented", re: /detail[-\s]?oriented/i },
  { label: "proven track record", re: /proven track record/i },
  { label: "world-class", re: /world[-\s]?class/i },
  { label: "guru", re: /\bguru\b/i },
  { label: "ninja", re: /\bninja\b/i },
  { label: "rockstar", re: /\brockstar\b/i },
  { label: "fast learner", re: /fast learner/i },
]

const GENERIC_SKILLS = new Set([
  "communication",
  "communications",
  "teamwork",
  "team work",
  "hardworking",
  "hard working",
  "hard worker",
  "leadership",
  "problem solving",
  "fast learner",
  "detail oriented",
  "microsoft office",
  "ms office",
  "microsoft word",
  "microsoft excel",
  "interpersonal",
  "interpersonal skills",
  "work ethic",
  "self motivated",
  "multitasking",
  "multi tasking",
  "time management",
  "organizational",
  "organizational skills",
  "people person",
  "creativity",
  "creative",
  "dedicated",
  "passionate",
  "flexible",
  "flexibility",
  "adaptability",
  "adaptable",
  "positive attitude",
  "punctual",
  "motivated",
  "team player",
  "responsible",
  "hardworking attitude",
])

const STOP_WORDS = new Set([
  "that",
  "with",
  "this",
  "from",
  "have",
  "were",
  "your",
  "about",
  "their",
  "there",
  "which",
  "would",
  "could",
  "should",
  "into",
  "through",
  "across",
  "while",
  "using",
  "after",
  "before",
  "where",
  "these",
  "those",
  "been",
  "being",
  "also",
  "than",
  "then",
  "them",
  "they",
  "will",
  "just",
  "over",
  "under",
  "each",
  "other",
  "such",
  "only",
  "more",
  "most",
  "some",
  "many",
  "very",
  "when",
  "what",
  "work",
  "team",
  "role",
  "and",
  "the",
  "for",
  "per",
])

function top(drafts: DraftImprovement[], limit: number): Improvement[] {
  const seen = new Set<string>()
  const sorted = [...drafts].sort((a, b) => b.priority - a.priority)
  const picked: Improvement[] = []
  for (const draft of sorted) {
    if (seen.has(draft.excerpt)) continue
    seen.add(draft.excerpt)
    picked.push({ excerpt: draft.excerpt, issue: draft.issue, change: draft.change })
    if (picked.length >= limit) break
  }
  return picked
}

function quoteOr(text: string, pattern: RegExp, fallback: string): string {
  return quoteMatch(text, pattern) ?? fallback
}

function firstLine(resume: ParsedResume): string {
  return resume.lines[0] ?? resume.text.slice(0, 80)
}

function tagline(resume: ParsedResume): string {
  const lines = resume.preamble.split("\n").map((line) => line.trim()).filter(Boolean)
  return lines
    .slice(1)
    .filter((line) => !EMAIL_RE.test(line) && !PHONE_RE.test(line) && !/linkedin|github|portfolio/i.test(line))
    .join("\n")
}

function profileText(resume: ParsedResume): string {
  return [tagline(resume), resume.sections.summary].filter((part) => part.trim()).join("\n")
}

function hasMetric(text: string): boolean {
  return METRIC_RE.test(text)
}

interface Bullet {
  raw: string
  clean: string
}

function isBulletLine(line: string): boolean {
  return /^(?:[-•*▪◦]|\d+[.)])\s+\S/.test(line)
}

function isRoleLine(line: string): boolean {
  if (isBulletLine(line)) return false
  if (wordCount(line) > 24) return false
  return MONTH_YEAR_RE.test(line) || /[|—]/.test(line) || /\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present)\b/i.test(line)
}

function extractBullets(section: string): Bullet[] {
  const lines = section.split("\n").map((line) => line.trim()).filter(Boolean)
  const marked = lines.filter(isBulletLine)
  const chosen = marked.length
    ? marked
    : lines.filter((line) => !isRoleLine(line) && wordCount(line) >= 6)
  return chosen.map((raw) => ({
    raw,
    clean: raw.replace(/^(?:[-•*▪◦]|\d+[.)])\s+/, "").trim(),
  }))
}

function domainOf(text: string): "support" | "software" | "general" {
  if (/\b(ticket|customer|zendesk|support|inbox|help desk|helpdesk)\b/i.test(text)) return "support"
  if (/\b(code|software|api|javascript|typescript|python|react|backend|frontend|deployed)\b/i.test(text)) {
    return "software"
  }
  return "general"
}

function rewriteBullet(bullet: string, resumeText: string): string {
  const domain = domainOf(resumeText)
  if (/various tasks/i.test(bullet) || /day to day/i.test(bullet)) {
    if (domain === "support") {
      return "Name the queue and the result. Replace this line with something you can count, for example: \"Triaged the weekday returns queue (about 40 tickets a day) and rewrote the refund macro so handle time fell from 8 minutes to 6.\" Use your real counts."
    }
    if (domain === "software") {
      return "Name the system and the result. Replace \"various tasks\" with the thing you shipped and a measure, for example: \"Shipped the invoice export in the billing API, cutting manual close from 2 days to 4 hours for 30 accounts.\""
    }
    return "Replace \"various tasks\" and \"day to day operations\" with the actual work, how much of it, and what changed. Example shape: \"Reorganized the weekly intake (about 25 items) so turnaround fell from 4 days to 2.\""
  }
  if (/responsible for/i.test(bullet) || /other duties/i.test(bullet)) {
    if (/customer/i.test(bullet) || domain === "support") {
      return "Drop \"responsible for\" and \"other duties.\" State the channel, the volume, and what improved: \"Resolved billing and delivery issues by phone and email, closing 35 tickets a week and cutting repeat contacts by 12%.\" Swap in figures you can defend."
    }
    return "Drop \"responsible for\" and \"other duties.\" Start with a verb and add volume plus outcome, for example: \"Owned the monthly close checklist for 12 accounts and cut late filings from 6 to 1.\""
  }
  if (/participated in meetings/i.test(bullet) || /^participated in\b/i.test(bullet)) {
    return "Meetings are not impact. Replace this with the decision or artifact that came out of them, for example: \"Led a weekly 20-minute review that removed 3 recurring defects from the help center.\""
  }
  const topic = bullet
    .replace(/^(?:responsible for|worked on|helped with|assisted with|participated in)\s+/i, "")
    .replace(/\.$/, "")
  return `Lead with a verb and add a number. A stronger shape for this line: "Improved ${topic} by a measured amount for a named group." Replace the placeholder with figures from your own work.`
}

function normalizeSkill(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[-/]/g, " ")
    .replace(/[^a-z0-9+#.\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function parseSkills(section: string): string[] {
  const items: string[] = []
  for (const rawLine of section.split("\n")) {
    const line = rawLine.replace(/^(?:[-•*▪◦]|\d+[.)])\s+/, "").trim()
    if (!line) continue
    const body = line.includes(":") ? line.split(":").slice(1).join(":") : line
    for (const part of body.split(/[,;|/]/)) {
      const item = part.trim().replace(/\.+$/, "")
      if (item && wordCount(item) <= 6 && item.length > 1) items.push(item)
    }
  }
  return items
}

function skillMentioned(skill: string, haystack: string): boolean {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?:^|[^A-Za-z0-9])${escaped}(?:$|[^A-Za-z0-9])`, "i").test(haystack)
}

function isToolLike(skill: string): boolean {
  const words = skill.trim().split(/\s+/)
  if (words.length === 1) return true
  return /salesforce|google|microsoft|power bi|visual studio|service cloud|adobe/i.test(skill)
}

function repeatedWords(text: string): { word: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const word of text.toLowerCase().match(/\b[a-z][a-z+]{3,}\b/g) ?? []) {
    if (STOP_WORDS.has(word)) continue
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 8)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
}

function dateStyleClashes(text: string): { left: string; right: string } | null {
  const numeric = text.match(NUMERIC_DATE_RE)?.[0]
  const iso = text.match(ISO_DATE_RE)?.[0]
  const month = text.match(MONTH_YEAR_RE)?.[0]
  if (numeric && month) return { left: numeric, right: month }
  if (iso && month) return { left: iso, right: month }
  if (numeric && iso) return { left: numeric, right: iso }
  return null
}

function scoreSummary(resume: ParsedResume): { score: number; reason: string; drafts: DraftImprovement[] } {
  const profile = profileText(resume)
  const drafts: DraftImprovement[] = []
  if (!profile.trim()) {
    const excerpt = firstLine(resume)
    return {
      score: 22,
      reason: `No summary, profile, or objective was extracted. The file opens with "${excerpt}" and then moves on.`,
      drafts: [
        {
          priority: 90,
          excerpt,
          issue: "Nothing under the name tells a reader what role this is or what you have already done.",
          change: `Add 2–4 lines under ${excerpt} that name the role, the years, and one result. Shape: "Customer support lead with 6 years ... Cut repeat contacts 18% ..." Use your own facts, not traits.`,
        },
      ],
    }
  }

  let score = 46
  const summaryWords = wordCount(resume.sections.summary || profile)
  const buzzHits = BUZZ_RES.filter((buzz) => buzz.re.test(profile))
  const role = ROLE_RE.test(profile)
  const metric = hasMetric(profile)
  const seeking = SEEKING_RE.test(profile)

  if (summaryWords >= 22 && summaryWords <= 120) score += 14
  else if (summaryWords < 14) {
    score -= 12
    const excerpt = quoteOr(resume.text, new RegExp(profile.split("\n")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), profile.split("\n")[0])
    drafts.push({
      priority: 60,
      excerpt,
      issue: `This opening is only ${summaryWords} words, so it never reaches a result.`,
      change: "Add one sentence with a number: years, people, revenue, time, or volume. Keep it under about 80 words total.",
    })
  } else if (summaryWords > 140) {
    score -= 10
    const excerpt = quoteMatch(resume.text, /.{80,}/) ?? profile.split("\n")[0]
    drafts.push({
      priority: 50,
      excerpt,
      issue: `The summary runs about ${summaryWords} words. Screeners will not read a paragraph this long.`,
      change: "Cut it to two sentences: the role with years, then one measured result. Delete the adjectives.",
    })
  } else {
    score += 4
  }

  if (role) score += 12
  else {
    score -= 10
    const excerpt = quoteOr(resume.text, /^(?!$).+/m, profile.split("\n")[0])
    const opening = resume.sections.summary.split("\n").find(Boolean) ?? excerpt
    drafts.push({
      priority: 75,
      excerpt: quoteMatch(resume.text, new RegExp(opening.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")) ?? opening,
      issue: "The opening never names the job. \"Position\" and \"professional\" are not a role.",
      change: "Start with the title you want and the work you have done, for example \"Support specialist with N years handling billing tickets.\"",
    })
  }

  if (metric) score += 14
  else {
    score -= 8
    const excerpt = resume.sections.summary.split("\n").find(Boolean) ?? profile.split("\n")[0]
    drafts.push({
      priority: 70,
      excerpt: quoteMatch(resume.text, new RegExp(excerpt.slice(0, 48).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))) ?? excerpt,
      issue: "The summary has no number, so the claim has no scale.",
      change: "Add one proof point you can explain in an interview: a percentage, a volume, a time saved, or a team size.",
    })
  }

  if (seeking) {
    score -= 18
    const excerpt = quoteOr(resume.text, SEEKING_RE, profile.split("\n")[0])
    drafts.push({
      priority: 88,
      excerpt,
      issue: "This is an objective about what you want from an employer. It does not say what you have done.",
      change: "Delete the \"seeking a position\" sentence. Replace it with the role, the years, and one result a hiring manager can picture.",
    })
  }

  if (buzzHits.length) {
    score -= Math.min(22, buzzHits.length * 6)
    const excerpt = quoteOr(resume.text, buzzHits[0].re, profile.split("\n")[0])
    const labels = buzzHits.slice(0, 3).map((hit) => hit.label).join(", ")
    drafts.push({
      priority: 86,
      excerpt,
      issue: `This line leans on empty labels (${labels}) instead of work.`,
      change: `Delete ${labels}. In their place, write the tool, the volume, and the outcome. Labels do not survive a screen.`,
    })
  }

  const slogan = tagline(resume).split("\n").find(Boolean)
  if (slogan && BUZZ_RES.some((buzz) => buzz.re.test(slogan))) {
    const sloganHits = BUZZ_RES.filter((buzz) => buzz.re.test(slogan)).map((buzz) => buzz.label)
    drafts.push({
      priority: 89,
      excerpt: slogan,
      issue: `The line under the name is a slogan (${sloganHits.join(", ")}), not a title.`,
      change: "Replace it with the role, for example \"Support specialist\". Delete the slogan.",
    })
  }

  const scoreOut = clampScore(score)
  const reason = summaryReason({ role, metric, seeking, buzzHits: buzzHits.map((hit) => hit.label), words: summaryWords })
  if (drafts.length === 0) {
    const excerpt = resume.sections.summary.split("\n").find(Boolean) ?? profile.split("\n")[0]
    drafts.push({
      priority: 15,
      excerpt,
      issue: "The summary already names a role and a result.",
      change: "Optional skim polish: if you tailor this for one posting, mirror two phrases from that posting in this same sentence without dropping the number.",
    })
  }
  return { score: scoreOut, reason, drafts }
}

function summaryReason(input: {
  role: boolean
  metric: boolean
  seeking: boolean
  buzzHits: string[]
  words: number
}): string {
  if (input.seeking && input.buzzHits.length) {
    return `The profile asks for a job and stacks labels (${input.buzzHits.slice(0, 3).join(", ")}) instead of naming a result.`
  }
  if (!input.role && !input.metric) {
    return `The opening is about ${input.words} words and never names a role or a number.`
  }
  if (input.role && input.metric && input.buzzHits.length === 0) {
    return "The summary names the role and includes a measured result, which is what a first screen looks for."
  }
  if (!input.metric) return "The summary describes the person but does not include a number."
  return "The summary is partly specific, with a few labels still doing the work of evidence."
}

function scoreExperience(resume: ParsedResume): { score: number; reason: string; drafts: DraftImprovement[] } {
  const section = resume.sections.experience.trim()
  const drafts: DraftImprovement[] = []
  if (!section) {
    const excerpt = firstLine(resume)
    return {
      score: 18,
      reason: "No experience section was extracted, so there are no roles or bullets to judge.",
      drafts: [
        {
          priority: 95,
          excerpt,
          issue: "A resume without an experience section gives a screener nothing to verify.",
          change: `Under a heading that says Experience, add each role with dates and 3–5 bullets. Start from the work hinted at near "${excerpt}" and attach a result to each bullet.`,
        },
      ],
    }
  }

  const bullets = extractBullets(section)
  const dated = MONTH_YEAR_RE.test(section) || /\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present)\b/i.test(section) || NUMERIC_DATE_RE.test(section)
  const roleLine = section.split("\n").map((line) => line.trim()).find((line) => line && !isBulletLine(line))

  if (bullets.length === 0) {
    const excerpt = roleLine ?? section.split("\n")[0]
    return {
      score: 28,
      reason: "The experience section has role lines but no bullets a reader can scan.",
      drafts: [
        {
          priority: 84,
          excerpt,
          issue: "This block never breaks the work into outcomes.",
          change: "Under this role, add bullets that start with a verb and end with a number. One role usually needs three.",
        },
      ],
    }
  }

  const withMetric = bullets.filter((bullet) => hasMetric(bullet.clean))
  const withAction = bullets.filter((bullet) => ACTION_RE.test(bullet.clean))
  const weak = bullets.filter((bullet) => WEAK_OPENER_RE.test(bullet.clean) || /\b(various|day[- ]to[- ]day|other duties)\b/i.test(bullet.clean))
  const n = bullets.length
  let score = 38
  score += (withMetric.length / n) * 28
  score += (withAction.length / n) * 16
  score += dated ? 8 : 0
  score -= (weak.length / n) * 26
  if (n >= 4) score += 6
  else if (n >= 3) score += 3

  weak.slice(0, 3).forEach((bullet, index) => {
    drafts.push({
      priority: 92 - index,
      excerpt: bullet.raw,
      issue: WEAK_OPENER_RE.test(bullet.clean)
        ? "This bullet opens like a job description and never says what changed."
        : "This bullet stays vague: the reader cannot tell the volume or the result.",
      change: rewriteBullet(bullet.clean, resume.text),
    })
  })

  if (!dated && roleLine) {
    drafts.push({
      priority: 78,
      excerpt: roleLine,
      issue: "This role line has no start or end, and the experience section has no other dates.",
      change: `Add a month and year on this line, for example: "${roleLine} | Jun 2022 – Aug 2023". Use the real dates.`,
    })
    score -= 4
  }

  const bare = bullets.filter((bullet) => !hasMetric(bullet.clean) && !weak.includes(bullet))
  bare.slice(0, 2).forEach((bullet) => {
    drafts.push({
      priority: 64,
      excerpt: bullet.raw,
      issue: "The verb is fine, but the bullet still has no measure.",
      change: "Add the scale: how many, how long, how much money, or how the metric moved. If you cannot count it, the bullet is probably a task, not an accomplishment.",
    })
  })

  if (drafts.length === 0) {
    const longest = [...bullets].sort((a, b) => b.clean.length - a.clean.length)[0]
    drafts.push({
      priority: 18,
      excerpt: longest.raw,
      issue: "This bullet already has an action and a number.",
      change: "Optional skim polish: lead with the result so the number is the first thing a recruiter sees, and keep the tool in the same sentence.",
    })
  }

  const reason = dated
    ? `${withMetric.length} of ${n} bullets include a number, ${withAction.length} start with an action verb, and the roles include dates.`
    : `${withMetric.length} of ${n} bullets include a number, ${withAction.length} start with an action verb, and no role has a date.`

  return { score: clampScore(score), reason, drafts }
}

function scoreSkills(resume: ParsedResume): { score: number; reason: string; drafts: DraftImprovement[] } {
  const section = resume.sections.skills.trim()
  const drafts: DraftImprovement[] = []
  if (!section) {
    const excerpt = firstLine(resume)
    return {
      score: 30,
      reason: "No skills section was extracted.",
      drafts: [
        {
          priority: 72,
          excerpt,
          issue: "Without a skills block, an ATS has to guess tools from prose, and it often misses them.",
          change: "Add a Skills heading and list the tools that already appear in your bullets. Group them, for example \"Analysis: Excel, SQL\". Leave off traits such as teamwork.",
        },
      ],
    }
  }

  const items = parseSkills(section)
  const generic = items.filter((item) => GENERIC_SKILLS.has(normalizeSkill(item)))
  const specific = items.filter((item) => !GENERIC_SKILLS.has(normalizeSkill(item)))
  const categorized = section.split("\n").some((line) => line.includes(":"))
  const body = `${resume.sections.summary}\n${resume.sections.experience}`
  const missingTools = specific.filter((item) => isToolLike(item) && !skillMentioned(item, body))

  let score = 48
  score += Math.min(specific.length, 7) * 6
  score -= Math.min(generic.length, 4) * 7
  if (specific.length === 0) score -= 12
  if (categorized && specific.length > 0) score += 4
  score -= Math.min(missingTools.length, 3) * 4
  if (items.length > 30) score -= 10

  const skillsLine = section.split("\n").find((line) => line.trim()) ?? section

  if (generic.length && specific.length === 0) {
    drafts.push({
      priority: 85,
      excerpt: skillsLine,
      issue: `These read as traits (${generic.slice(0, 4).join(", ")}), not tools a screen can match to a job.`,
      change: "Replace the trait list with the systems you actually used. If this work was support, that might be a helpdesk and one analysis tool, written as \"Zendesk, Excel (pivot tables)\". If it was something else, name those tools instead.",
    })
  } else if (generic.length) {
    drafts.push({
      priority: 55,
      excerpt: skillsLine,
      issue: `Trait words are mixed in with tools: ${generic.slice(0, 3).join(", ")}.`,
      change: "Delete the traits. Keep only tools and methods you could be asked to demo.",
    })
  }

  if (missingTools.length) {
    const missingLine =
      section
        .split("\n")
        .find((line) => missingTools.some((tool) => line.toLowerCase().includes(tool.toLowerCase()))) ?? skillsLine
    drafts.push({
      priority: 68,
      excerpt: missingLine,
      issue: `${missingTools.slice(0, 3).join(", ")} ${missingTools.length === 1 ? "is" : "are"} listed as a skill but never show up in the experience bullets.`,
      change: `Either add ${missingTools[0]} to the bullet where you used it, or remove it. A skills list that the jobs do not back up looks padded.`,
    })
  }

  if (items.length > 30) {
    drafts.push({
      priority: 74,
      excerpt: skillsLine,
      issue: `This section lists about ${items.length} items. That is stuffing, not a skills profile.`,
      change: "Cut to the tools you have used in the last few years, grouped on two or three lines. Aim for under 15.",
    })
  }

  if (drafts.length === 0) {
    drafts.push({
      priority: 16,
      excerpt: skillsLine,
      issue: "The skills listed here are concrete, and the job bullets back them up.",
      change: "When you apply to one role, move the three tools that posting repeats to the front of this list. Leave the rest.",
    })
  }

  const reason =
    specific.length === 0
      ? `The skills block is ${generic.length} trait${generic.length === 1 ? "" : "s"} and no concrete tools.`
      : `${specific.length} concrete item${specific.length === 1 ? "" : "s"} and ${generic.length} trait${generic.length === 1 ? "" : "s"}. ${missingTools.length ? `${missingTools.slice(0, 2).join(" and ")} ${missingTools.length === 1 ? "is" : "are"} not mentioned in the jobs.` : "The tools also show up in the experience."}`

  return { score: clampScore(score), reason, drafts }
}

function scoreEducation(resume: ParsedResume): { score: number; reason: string; drafts: DraftImprovement[] } {
  const section = resume.sections.education.trim()
  const drafts: DraftImprovement[] = []
  const degree = /\b(ph\.?d\.?|m\.?b\.?a\.?|b\.?s\.?c?\.?|m\.?s\.?c?\.?|b\.?a\.?|m\.?a\.?|bachelor(?:'s)?|master(?:'s)?|associate(?:'s)?|doctorate|diploma)\b/i
  const school = /\b(university|college|institute|school|academy)\b/i

  if (!section) {
    const excerpt = firstLine(resume)
    return {
      score: 40,
      reason: "No education section was extracted.",
      drafts: [
        {
          priority: 48,
          excerpt,
          issue: "There is no degree, school, or year anywhere under an Education heading.",
          change: "If you have a credential, add it as \"B.A. Subject, University, Year\". If you are leaving it off on purpose, the experience bullets have to carry every proof point.",
        },
      ],
    }
  }

  const hasDegree = degree.test(section)
  const hasSchool = school.test(section)
  const hasYear = YEAR_RE.test(section)
  const thin = wordCount(section) <= 3 && !hasDegree
  let score = thin ? 30 : 28
  if (!thin) {
    if (hasDegree) score += 26
    if (hasSchool) score += 18
    if (hasYear) score += 16
  }

  const excerpt = section.split("\n").find(Boolean) ?? section
  if (!hasDegree || thin) {
    drafts.push({
      priority: 80,
      excerpt,
      issue: "This does not name a degree, a field, a school, and a year. A reader cannot verify it.",
      change: "Rewrite it the way a registrar would: \"B.A. Communication Studies, San Jose State University, 2018\". Use your real credential. If the line is only a word like \"College\", replace that word rather than decorating it.",
    })
  } else if (!hasYear || !hasSchool) {
    drafts.push({
      priority: 58,
      excerpt,
      issue: hasYear ? "The school name is missing." : "The year is missing.",
      change: "Complete the line with degree, school, and year on one row.",
    })
  } else {
    drafts.push({
      priority: 14,
      excerpt,
      issue: "Degree, school, and year are all present.",
      change: "Only add more if a course, honor, or campus job connects to the work above. Otherwise leave this line alone and spend the space on experience.",
    })
  }

  const reason = thin
    ? `Education is only "${excerpt.trim()}".`
    : hasDegree && hasSchool && hasYear
      ? "Education names a degree, a school, and a year."
      : "Education is present but incomplete."

  return { score: clampScore(score), reason, drafts }
}

function scoreAts(resume: ParsedResume): { score: number; reason: string; drafts: DraftImprovement[] } {
  const drafts: DraftImprovement[] = []
  let score = 28
  const email = resume.text.match(EMAIL_RE)?.[0]
  const phone = resume.text.match(PHONE_RE)?.[0]
  const headingIds = new Set(resume.headingsFound.map((heading) => heading.id))
  const expected = ["summary", "experience", "skills", "education"] as const
  const present = expected.filter((id) => headingIds.has(id))
  const missing = expected.filter((id) => !headingIds.has(id))
  score += present.length * 5
  if (email) score += 16
  if (phone) score += 8
  if (/linkedin\.com|github\.com/i.test(resume.text)) score += 4

  const words = resume.wordCount
  if (words >= 160 && words <= 900) score += 14
  else if (words >= 110 && words < 160) score += 6
  else if (words > 900 && words <= 1200) score += 6

  const experience = resume.sections.experience
  const clash = dateStyleClashes(experience)
  const hasDates = MONTH_YEAR_RE.test(experience) || NUMERIC_DATE_RE.test(experience) || ISO_DATE_RE.test(experience)
  if (hasDates && !clash) score += 6
  if (clash) score -= 8

  const stuffed = repeatedWords(resume.text)
  if (stuffed.length) score -= 12

  const longLine = resume.lines.find((line) => line.length > 400)
  if (longLine) score -= 8

  if (!email || !phone) {
    const missingContact = !email && !phone ? "No email or phone number" : !email ? "No email address" : "No phone number"
    drafts.push({
      priority: 84,
      excerpt: firstLine(resume),
      issue: `${missingContact} was found in the extracted text, so an application system has no reliable way to reach you.`,
      change: `Put a plain email and a phone number on the line under ${firstLine(resume)}. Example shape: name@email.com | (415) 555-0148. Skip icons and text boxes.`,
    })
  }

  if (words < 160) {
    const skillsLine = resume.sections.skills.split("\n").find(Boolean) ?? firstLine(resume)
    drafts.push({
      priority: 66,
      excerpt: skillsLine,
      issue: `The extract is ${words} words. A one-page resume with real bullets usually lands around 300–700 words. This one is short because the lines are labels.`,
      change: "Do not pad with adjectives. Lengthen the experience bullets with scope and results. The skills line can stay short.",
    })
  } else if (words > 1000) {
    drafts.push({
      priority: 60,
      excerpt: firstLine(resume),
      issue: `The extract is ${words} words, which is long for a standard application resume.`,
      change: "Cut roles older than about 10–15 years down to one line each, and delete bullets that repeat the same achievement.",
    })
  }

  if (missing.length) {
    drafts.push({
      priority: 76,
      excerpt: firstLine(resume),
      issue: `Standard headings not found: ${missing.join(", ")}. Unusual or missing headings are a common reason an ATS files the text in the wrong field.`,
      change: "Use plain headings on their own lines: Summary, Experience, Skills, Education. Avoid tables and text boxes for those labels.",
    })
  }

  if (clash) {
    const left = quoteMatch(resume.text, new RegExp(clash.left.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))) ?? clash.left
    drafts.push({
      priority: 52,
      excerpt: left,
      issue: `Dates switch styles (${clash.left} and ${clash.right}). Inconsistent dates are a small ATS and reader snag.`,
      change: "Pick one style, such as Mar 2021 – Present, and use it on every role.",
    })
  }

  if (stuffed[0]) {
    const excerpt = quoteOr(resume.text, new RegExp(`\\b${stuffed[0].word}\\b`, "i"), firstLine(resume))
    drafts.push({
      priority: 73,
      excerpt,
      issue: `"${stuffed[0].word}" appears ${stuffed[0].count} times. Repeating a keyword does not make the resume more relevant.`,
      change: `Keep "${stuffed[0].word}" where it is true, and delete the extra copies. Use the space for a result.`,
    })
  }

  if (longLine) {
    drafts.push({
      priority: 70,
      excerpt: longLine.slice(0, 180),
      issue: "A very long extracted line usually means a text box, table, or column layout collapsed into one stream.",
      change: "Rebuild the resume as a single column with normal paragraphs and bullets, then re-export.",
    })
  }

  if (drafts.length === 0) {
    const contact = resume.lines.find((line) => EMAIL_RE.test(line)) ?? firstLine(resume)
    drafts.push({
      priority: 12,
      excerpt: contact,
      issue: "Contact details, standard headings, and a readable length are all in the extract.",
      change: "Keep this contact line as plain text. When you tailor the resume, add a few exact phrases from the posting into the summary you already have.",
    })
  }

  const reasonParts = [
    email ? "an email" : "no email",
    phone ? "a phone number" : "no phone number",
    `${present.length} of 4 standard headings`,
    `${words} words`,
  ]
  return {
    score: clampScore(score),
    reason: `The extract has ${reasonParts.join(", ")}.`,
    drafts,
  }
}

function partFrom(
  id: Exclude<PartId, "overall">,
  result: { score: number; reason: string; drafts: DraftImprovement[] },
  limit: number,
): PartScore & { drafts: DraftImprovement[] } {
  return {
    id,
    label: PART_LABELS[id],
    score: result.score,
    reason: result.reason,
    improvements: top(result.drafts, limit),
    drafts: result.drafts,
  }
}

export function scoreWithRubric(resume: ParsedResume): ScoreReport {
  const summary = partFrom("summary", scoreSummary(resume), 3)
  const experience = partFrom("experience", scoreExperience(resume), 4)
  const skills = partFrom("skills", scoreSkills(resume), 3)
  const education = partFrom("education", scoreEducation(resume), 2)
  const ats = partFrom("ats", scoreAts(resume), 3)

  const weighted =
    summary.score * SECTION_WEIGHTS.summary +
    experience.score * SECTION_WEIGHTS.experience +
    skills.score * SECTION_WEIGHTS.skills +
    education.score * SECTION_WEIGHTS.education +
    ats.score * SECTION_WEIGHTS.ats
  const overallScore = clampScore(weighted)
  const sections = [summary, experience, skills, education, ats]
  const lowest = [...sections].sort((a, b) => a.score - b.score)[0]
  const highest = [...sections].sort((a, b) => b.score - a.score)[0]
  const overallDrafts = sections.flatMap((section) =>
    [...section.drafts].sort((a, b) => b.priority - a.priority).slice(0, 1),
  )

  const overall: PartScore = {
    id: "overall",
    label: PART_LABELS.overall,
    score: overallScore,
    reason: `Weighted blend: experience 34%, ATS 20%, skills 18%, summary 16%, education 12%. Lowest is ${lowest.label} at ${lowest.score}. Highest is ${highest.label} at ${highest.score}.`,
    improvements: top(overallDrafts, 3),
  }

  const parts = [overall, summary, experience, skills, education, ats].map((part) => ({
    id: part.id,
    label: part.label,
    score: part.score,
    reason: part.reason,
    improvements: part.improvements,
  }))

  return {
    engine: "rubric",
    note: null,
    overall: overallScore,
    parts,
    source: resume.source,
    extracted: toExtracted(resume),
  }
}
