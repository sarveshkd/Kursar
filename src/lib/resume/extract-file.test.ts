import { PDFDocument, StandardFonts } from "pdf-lib"
import JSZip from "jszip"
import { describe, expect, it } from "vitest"
import { UploadError } from "@/lib/resume/errors"
import { extractResumeFile } from "@/lib/resume/extract-file"
import { scoreUpload } from "@/lib/resume/score-upload"

async function textPdf(lines: string[]): Promise<File> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([612, 792])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  lines.forEach((line, index) => {
    page.drawText(line, { x: 54, y: 740 - index * 22, size: 12, font })
  })
  const bytes = await pdf.save()
  return new File([Uint8Array.from(bytes)], "jordan.pdf", { type: "application/pdf" })
}

async function textDocx(paragraphs: string[]): Promise<File> {
  const zip = new JSZip()
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  )
  const body = paragraphs
    .map((paragraph) => `<w:p><w:r><w:t xml:space="preserve">${paragraph}</w:t></w:r></w:p>`)
    .join("")
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}</w:body>
</w:document>`,
  )
  const bytes = await zip.generateAsync({ type: "uint8array" })
  const copy = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(copy).set(bytes)
  return new File([copy], "jordan.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
}

describe("resume file extraction", () => {
  it("reads text out of a PDF rather than treating it as UTF-8", async () => {
    const file = await textPdf([
      "Jordan Lee",
      "jordan@example.com",
      "Experience",
      "Built a queue that cut wait time 30%.",
    ])
    const parsed = await extractResumeFile(file)
    expect(parsed.fileType).toBe("pdf")
    expect(parsed.text).toContain("Jordan Lee")
    expect(parsed.text).toContain("30%")
    expect(parsed.text.includes("%PDF")).toBe(false)
  })

  it("reads paragraphs out of a DOCX", async () => {
    const file = await textDocx([
      "Jordan Lee",
      "Experience",
      "Built a queue that cut wait time 30%.",
    ])
    const parsed = await extractResumeFile(file)
    expect(parsed.fileType).toBe("docx")
    expect(parsed.text).toContain("Built a queue that cut wait time 30%.")
    const report = await scoreUpload({ kind: "file", file })
    expect(report.parts).toHaveLength(6)
  })

  it("rejects empty, legacy, unsupported, and unreadable uploads", async () => {
    await expect(extractResumeFile(new File([], "empty.pdf", { type: "application/pdf" }))).rejects.toBeInstanceOf(UploadError)
    await expect(extractResumeFile(new File([], "empty.pdf"))).rejects.toMatchObject({ code: "empty" })
    await expect(extractResumeFile(new File(["old"], "resume.doc"))).rejects.toMatchObject({ code: "unsupported" })
    await expect(extractResumeFile(new File([Uint8Array.from([1, 2, 3])], "photo.png", { type: "image/png" }))).rejects.toMatchObject({
      code: "unsupported",
    })
    await expect(
      extractResumeFile(new File([new TextEncoder().encode("%PDF-1.4 not a real document")], "broken.pdf")),
    ).rejects.toMatchObject({ code: "unreadable" })
  })
})
