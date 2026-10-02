export function wordCount(text: string): number {
  const words = text.trim().match(/\S+/g)
  return words ? words.length : 0
}

export function normalizeExtracted(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .replace(/\u0000/g, "")
    .replace(/\f/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

/** A verbatim line or sentence from `text` that matches `pattern`. */
export function quoteMatch(text: string, pattern: RegExp): string | null {
  const flags = pattern.flags.replace("g", "")
  const re = new RegExp(pattern.source, flags)

  for (const line of text.split("\n")) {
    re.lastIndex = 0
    if (!re.test(line)) continue
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.length <= 280) return trimmed
    return sentenceAround(trimmed, pattern) ?? trimmed.slice(0, 220).trim()
  }

  re.lastIndex = 0
  const match = text.match(re)
  if (!match?.[0]) return null
  return match[0].length <= 280 ? match[0] : match[0].slice(0, 220)
}

function sentenceAround(line: string, pattern: RegExp): string | null {
  const re = new RegExp(pattern.source, pattern.flags.replace("g", ""))
  const match = re.exec(line)
  if (!match) return null
  const startBreak = Math.max(line.lastIndexOf(". ", match.index), line.lastIndexOf("; ", match.index))
  const from = startBreak === -1 ? 0 : startBreak + 2
  const endDot = line.indexOf(".", match.index + match[0].length)
  const end = endDot === -1 ? Math.min(line.length, match.index + match[0].length + 160) : endDot + 1
  const sentence = line.slice(from, end).trim()
  return sentence || match[0]
}

export function looksBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 1200))
  if (sample.length === 0) return false
  let weird = 0
  for (const byte of sample) {
    if (byte === 0) return true
    if (byte < 9 || (byte > 13 && byte < 32)) weird += 1
  }
  return weird / sample.length > 0.08
}
