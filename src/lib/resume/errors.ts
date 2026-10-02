export type UploadErrorCode = "empty" | "unsupported" | "unreadable" | "too_large"

export class UploadError extends Error {
  readonly code: UploadErrorCode

  constructor(code: UploadErrorCode, message: string) {
    super(message)
    this.name = "UploadError"
    this.code = code
  }
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const UPLOAD_MESSAGES = {
  empty: "This file is empty. Upload a PDF, DOCX, or text resume that contains text.",
  tooLarge: "This file is over 5 MB. Upload a smaller resume.",
  unsupported:
    "That file type is not supported. Upload a PDF, DOCX, or plain text file (.txt or .md).",
  legacyDoc:
    "Legacy .doc files cannot be read. Save the resume as .docx or PDF and upload that.",
  unreadablePdf:
    "This PDF has no readable text. It may be damaged, encrypted, or a scan without a text layer. Export a text-based PDF, or paste the resume.",
  unreadableDocx:
    "This DOCX could not be read. It may be damaged or not a Word file. Save it again as .docx, or paste the text.",
  emptyExtract:
    "No text came out of this file. If it is a scanned PDF, export a text-based file or paste the resume.",
  emptyPaste: "Paste the resume text before scoring.",
  unknownSample: "Unknown sample. Choose the weak draft or the stronger draft.",
} as const
