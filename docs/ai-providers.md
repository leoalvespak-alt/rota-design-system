# Providers de IA

## Arquitetura

`src/lib/ai/providers/types.ts` define 4 interfaces:

- **TextProvider** — Geracao de texto (chat completions)
- **ImageProvider** — Geracao de imagens
- **EmbeddingProvider** — Embeddings de texto
- **VisionProvider** — Analise de imagens

## Providers Implementados

### DeepSeekProvider (Texto)

`src/lib/ai/providers/DeepSeekProvider.ts`

- API OpenAI-compatible
- Suporte a `responseSchema` Zod para saida estruturada
- Validacao automatica da resposta

```typescript
const provider = new DeepSeekProvider({ apiKey, model: 'deepseek-chat' })
const result = await provider.generate({
  messages: [{ role: 'user', content: 'Gere um titulo...' }],
  responseSchema: titleSchema,
})
```

### FalImageProvider (Imagem)

`src/lib/ai/providers/FalImageProvider.ts`

- API fal.ai para FLUX/schnell
- Polling assincrono de fila
- Timeout configuravel

```typescript
const provider = new FalImageProvider({ apiKey })
const result = await provider.generate({
  prompt: 'Imagem para post sobre concurso fiscal',
  width: 1080,
  height: 1080,
})
```

## Seguranca

- API keys via variaveis de ambiente (nunca hardcoded)
- Headers de autorizacao removidos dos logs do Sentry
