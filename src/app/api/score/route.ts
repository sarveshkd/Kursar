import { UploadError } from "@/lib/resume/errors"
import { parseScoreJson, scoreUpload } from "@/lib/resume/score-upload"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? ""
    const input = contentType.includes("application/json")
      ? parseScoreJson(await request.json())
      : await fileInput(request)
    const report = await scoreUpload(input)
    return Response.json(report, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof UploadError) {
      return Response.json({ error: error.message, code: error.code }, { status: 400 })
    }
    console.error("Score request failed")
    return Response.json(
      { error: "The resume could not be scored. Try a text-based PDF, DOCX, or plain text file.", code: "unreadable" },
      { status: 500 },
    )
  }
}

async function fileInput(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    throw new UploadError("unsupported", "Upload a PDF, DOCX, or text file.")
  }
  const file = form.get("file")
  if (!(file instanceof File)) {
    throw new UploadError("unsupported", "Choose a resume file to upload.")
  }
  return { kind: "file" as const, file }
}
