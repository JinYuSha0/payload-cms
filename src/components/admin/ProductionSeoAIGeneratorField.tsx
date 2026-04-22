'use client'

import { useCallback, useMemo, useState } from 'react'
import { useField, useFormFields, useLocale } from '@payloadcms/ui'

const resolveFieldPath = (
  formFieldState: Record<string, unknown>,
  basePath: string,
  localeCode?: string,
): string => {
  const keys = Object.keys(formFieldState || {})

  if (localeCode && keys.includes(`${basePath}.${localeCode}`)) {
    return `${basePath}.${localeCode}`
  }

  if (keys.includes(basePath)) {
    return basePath
  }

  const localizedPath = keys.find(
    (key) => key.startsWith(`${basePath}.`) && key.split('.').length === 2,
  )

  return localizedPath || basePath
}

const normalizeString = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

const extractFirstText = (value: unknown): string => {
  if (typeof value === 'string') {
    return normalizeString(value)
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ''
  }

  for (const candidate of Object.values(value as Record<string, unknown>)) {
    const text = extractFirstText(candidate)
    if (text) {
      return text
    }
  }

  return ''
}

const normalizeKeywords = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(item))
      .filter(Boolean)
      .slice(0, 12)
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n，；;]+/)
      .map((item) => normalizeString(item))
      .filter(Boolean)
      .slice(0, 12)
  }

  return []
}

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const json = (await response.json()) as {
      errors?: Array<{ message?: string }>
      message?: string
    }
    const firstError = json.errors?.[0]?.message
    return firstError || json.message || `请求失败 (${response.status})`
  } catch {
    return `请求失败 (${response.status})`
  }
}

export default function ProductionSeoAIGeneratorField() {
  const locale = useLocale()
  const localeCode = typeof locale?.code === 'string' ? locale.code : undefined
  const formFieldState = useFormFields(([fields]) => fields) as Record<string, unknown>

  const namePath = useMemo(
    () => resolveFieldPath(formFieldState, 'name', localeCode),
    [formFieldState, localeCode],
  )
  const introPath = useMemo(
    () => resolveFieldPath(formFieldState, 'intro', localeCode),
    [formFieldState, localeCode],
  )
  const keywordsPath = useMemo(
    () => resolveFieldPath(formFieldState, 'keywords', localeCode),
    [formFieldState, localeCode],
  )
  const seoTitlePath = useMemo(
    () => resolveFieldPath(formFieldState, 'seoTitle', localeCode),
    [formFieldState, localeCode],
  )
  const seoDescriptionPath = useMemo(
    () => resolveFieldPath(formFieldState, 'seoDescription', localeCode),
    [formFieldState, localeCode],
  )

  const nameField = useField<string | Record<string, unknown> | null>({ path: namePath })
  const introField = useField<string | Record<string, unknown> | null>({ path: introPath })
  const keywordsField = useField<string[] | string | null>({ path: keywordsPath })
  const slugField = useField<string>({ path: 'slug' })
  const seoTitleField = useField<string>({ path: seoTitlePath })
  const seoDescriptionField = useField<string>({ path: seoDescriptionPath })
  const seoAIGeneratedAtField = useField<string>({ path: 'seoAIGeneratedAt' })
  const seoAIModelField = useField<string>({ path: 'seoAIModel' })

  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [status, setStatus] = useState('')

  const onGenerate = useCallback(async () => {
    setIsGenerating(true)
    setErrorMessage('')
    setStatus('')

    try {
      const response = await fetch('/api/productions/generate-seo', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          locale: localeCode,
          name: extractFirstText(nameField.value),
          intro: extractFirstText(introField.value),
          keywords: normalizeKeywords(keywordsField.value),
        }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      const data = (await response.json()) as {
        slug?: string
        seoTitle?: string
        seoDescription?: string
        generatedAt?: string
        model?: string
      }

      if (normalizeString(data.slug)) {
        slugField.setValue(normalizeString(data.slug))
      }
      if (normalizeString(data.seoTitle)) {
        seoTitleField.setValue(normalizeString(data.seoTitle))
      }
      if (normalizeString(data.seoDescription)) {
        seoDescriptionField.setValue(normalizeString(data.seoDescription))
      }
      if (normalizeString(data.generatedAt)) {
        seoAIGeneratedAtField.setValue(normalizeString(data.generatedAt))
      }
      if (normalizeString(data.model)) {
        seoAIModelField.setValue(normalizeString(data.model))
      }

      setStatus('AI 已生成 SEO 字段')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'AI 生成失败')
    } finally {
      setIsGenerating(false)
    }
  }, [
    introField.value,
    keywordsField.value,
    localeCode,
    nameField.value,
    seoAIGeneratedAtField,
    seoAIModelField,
    seoDescriptionField,
    seoTitleField,
    slugField,
  ])

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '8px',
        padding: '10px',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>SEO AI 生成</div>
      <button
        onClick={onGenerate}
        type="button"
        disabled={isGenerating}
        style={{
          border: '1px solid var(--theme-elevation-300)',
          borderRadius: '4px',
          background: 'var(--theme-elevation-0)',
          color: 'var(--theme-text)',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          opacity: isGenerating ? 0.6 : 1,
          padding: '7px 10px',
          width: '100%',
        }}
      >
        {isGenerating ? '生成中...' : '用AI 生成 SEO信息'}
      </button>

      {status ? (
        <div style={{ color: 'var(--theme-success-500)', fontSize: '12px', marginTop: '8px' }}>
          {status}
        </div>
      ) : null}
      {errorMessage ? (
        <div style={{ color: 'var(--theme-error-500)', fontSize: '12px', marginTop: '8px' }}>
          {errorMessage}
        </div>
      ) : null}
    </div>
  )
}
