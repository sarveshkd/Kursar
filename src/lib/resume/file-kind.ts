export type FileKind = "pdf" | "docx" | "txt" | "doc" | "unsupported"

export function fileKind(file: { name: string; type?: string }): FileKind {
  const name = file.name.toLowerCase()
  const extension = name.includes(".") ? (name.split(".").pop() ?? "") : ""
  if (extension === "pdf") return "pdf"
  if (extension === "docx") return "docx"
  if (extension === "doc") return "doc"
  if (extension === "txt" || extension === "text" || extension === "md") return "txt"

  const type = file.type ?? ""
  if (type === "application/pdf") return "pdf"
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "docx"
  }
  if (type.startsWith("text/")) return "txt"
  return "unsupported"
}
