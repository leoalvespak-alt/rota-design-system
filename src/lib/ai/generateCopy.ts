import type { AIModel } from '@/stores/useAIStore'

/**
 * Espelha generateCopy() do Gerador/index.html original (linha 4168) — mesmo
 * system prompt (tom tático da marca), mesmo mapeamento de campos disponíveis no
 * template ativo, mesmo parsing de JSON com limpeza de fences markdown.
 */
export async function generateCopy(params: {
  model: AIModel
  apiKey: string
  prompt: string
  career: 'fiscal' | 'policial' | 'tribunal' | 'geral'
  availableFields: string[]
}): Promise<Record<string, string>> {
  const { model, apiKey, prompt, career, availableFields } = params

  const careerDesc =
    career === 'fiscal'
      ? 'carreiras fiscais (SEFAZ, Receita Federal, Auditor)'
      : career === 'policial'
        ? 'carreiras policiais (PF, PRF, PC, PCDF)'
        : career === 'tribunal'
          ? 'tribunais (TRF, TCU, TCE, STJ)'
          : 'concursos públicos em geral'

  const systemPrompt = `Você é um copywriter tático da Rota de Ataque, plataforma de estudos para concursos públicos.
Tom da marca: direto, militar, sem rodeios. Verbos no imperativo. Nunca motivacional vazio.
Público: candidatos a ${careerDesc}.
Retorne APENAS um objeto JSON válido com as chaves: ${availableFields.map((f) => `"${f}"`).join(', ')}.
Sem markdown, sem texto fora do JSON. Valores em português. Textos curtos e impactantes.
Eyebrow/tag: 1-3 palavras em maiúsculas. Título: 4-8 palavras em maiúsculas. Body/subtitle: 1-2 frases diretas.`

  const userMsg = `Crie o copy para: ${prompt}. Adapte para o template com os campos: ${availableFields.join(', ')}.`

  const rawContent = await (async () => {
    if (model.provider === 'claude') {
      const resp = await fetch(model.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model.model,
          max_tokens: 400,
          messages: [{ role: 'user', content: `${systemPrompt}\n\n${userMsg}` }],
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error?.message || `HTTP ${resp.status}`)
      }
      const data = await resp.json()
      return data.content?.[0]?.text || ''
    }

    const resp = await fetch(model.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.model,
        max_tokens: 400,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
      }),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err?.error?.message || `HTTP ${resp.status}`)
    }
    const data = await resp.json()
    return data.choices?.[0]?.message?.content || ''
  })()

  const clean = rawContent.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)
  return parsed
}
