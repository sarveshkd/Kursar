import mammoth from "mammoth"
import { extractText, getDocumentProxy } from "unpdf"
import { MAX_UPLOAD_BYTES, UploadError, UPLOAD_MESSAGES } from "@/lib/resume/errors"
import { fileKind } from "@/lib/resume/file-kind"
import { parseResumeText, type ParsedResume } from "@/lib/resume/parse-sections"
import { looksBinary } from "@/lib/resume/text"

export async function extractResumeFile(file: File): Promise<ParsedResume> {
  if (file.size === 0) {
    throw new UploadError("empty", UPLOAD_MESSAGES.empty)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("too_large", UPLOAD_MESSAGES.tooLarge)
  }

  const kind = fileKind(file)
  if (kind === "doc") {
    throw new UploadError("unsupported", UPLOAD_MESSAGES.legacyDoc)
  }
  if (kind === "unsupported") {
    throw new UploadError("unsupported", UPLOAD_MESSAGES.unsupported)
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const text = await readKind(kind, bytes)
  return parseResumeText(text, {
    filename: file.name || "resume",
    fileType: kind,
    source: { kind: "upload", label: file.name || "Uploaded resume", sampleId: null },
  })
}

async function readKind(kind: "pdf" | "docx" | "txt", bytes: Uint8Array): Promise<string> {
  if (kind === "pdf") return readPdf(bytes)
  if (kind === "docx") return readDocx(bytes)
  return readPlainText(bytes)
}

async function readPdf(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes)
    const { text } = await extractText(pdf, { mergePages: true })
    const joined = Array.isArray(text) ? text.join("\n") : text
    if (!joined.trim()) {
      throw new UploadError("unreadable", UPLOAD_MESSAGES.unreadablePdf)
    }
    return joined
  } catch (error) {
    if (error instanceof UploadError) throw error
    throw new UploadError("unreadable", UPLOAD_MESSAGES.unreadablePdf)
  }
}

async function readDocx(bytes: Uint8Array): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
    if (!result.value.trim()) {
      throw new UploadError("unreadable", UPLOAD_MESSAGES.unreadableDocx)
    }
    return result.value
  } catch (error) {
    if (error instanceof UploadError) throw error
    throw new UploadError("unreadable", UPLOAD_MESSAGES.unreadableDocx)
  }
}

function readPlainText(bytes: Uint8Array): string {
  if (looksBinary(bytes)) {
    throw new UploadError(
      "unreadable",
      "This file looks like binary data, not plain text. Upload a .txt, .md, PDF, or DOCX resume.",
    )
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
  if (!text.trim()) {
    throw new UploadError("empty", UPLOAD_MESSAGES.emptyExtract)
  }
  return text
}
