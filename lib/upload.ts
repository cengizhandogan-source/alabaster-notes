import { uploadFile } from "@/actions/upload"

export async function uploadAndGetMarkdown(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  const { url, name, isImage } = await uploadFile(formData)
  return isImage ? `![${name}](${url})` : `[${name}](${url})`
}
