import type { Production } from '@/payload-types'

export type RichTextContent = NonNullable<Production['content']>

export interface ParsedTemplateImage {
  bytes: Uint8Array
  fileName: string
  mimeType: string
  relationshipID: string
}

export interface ParsedProductDraft {
  categoryName: string
  content: string
  contentImages: ParsedTemplateImage[]
  contentRichText: RichTextContent
  intro: string
  keywords: string[]
  mainImages: ParsedTemplateImage[]
  model: string
  name: string
  rawFieldMap: Record<string, string>
  warnings: string[]
}
