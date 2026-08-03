# Auditoria de Seguranca e Performance — Fase 24

Data: 2026-08-02

---

## Exposicao de API Keys

- Chaves de IA (DeepSeek, fal.ai) sao fornecidas pelo usuario via UI (`useAIStore`) e usadas apenas client-side nas chamadas `fetch` diretas aos providers; nao ha proxy de servidor nesta camada ainda.
- Novas chaves de infraestrutura (Sentry DSN, MinIO, Postgres, Redis) ficam em variaveis de ambiente documentadas em `.env.example`, nunca hardcoded.
- `.gitignore` atualizado para excluir `.env`, `.env.local` e `.env.*.local` alem de `deploy/.env`, prevenindo commit acidental de credenciais.
- `src/lib/observability/sentry.ts` remove headers de `Authorization` antes de enviar eventos, evitando vazamento de tokens em breadcrumbs de rede.

## Sanitizacao de HTML/SVG

Pontos que usam `dangerouslySetInnerHTML` — todos consomem saida de bibliotecas confiaveis (KaTeX, Shiki, Mermaid), nao HTML arbitrario de usuario final:

| Arquivo | Origem do HTML |
|---------|-----------------|
| `FormulaBlock.tsx` | `katex.renderToString()` |
| `BrandFormula.tsx` | Expressao pre-processada (ver nota abaixo) |
| `CodeBlock.tsx` | `shiki.codeToHtml()` |
| `MermaidRenderer.tsx` | `mermaid.render()` (via `innerHTML`, nao dangerouslySetInnerHTML) |
| `BrandView.tsx` | Conteudo estatico do guia de marca |

**Nota**: `BrandFormula` injeta a prop `expression` diretamente sem passar por KaTeX — deve ser usado apenas com HTML ja confiavel (ex.: saida previa de `FormulaBlock`/KaTeX), nunca com texto vindo diretamente de input de usuario ou IA sem sanitizacao.

## Bug Corrigido: `require()` em Contexto Browser

`FormulaBlock.tsx` usava `require('katex')` dentro de um componente React — isso funciona em Node mas nao existe em bundles ESM do Vite para o browser, causando erro em runtime ao renderizar qualquer formula. Corrigido para `import('katex')` dinamico (mesmo padrao usado em `CodeBlock.tsx` e `MermaidRenderer.tsx`), com carregamento assincrono via `useEffect`/`useState`. CSS do KaTeX (`katex/dist/katex.min.css`) tambem foi importado, que antes nao estava presente em nenhum lugar do projeto (formulas seriam renderizadas sem estilo).

## Uploads (MIME/Tamanho)

- Upload de imagens no cliente (`ImageUploadField.tsx`, `useSlotFilePicker.ts`) usa `react-dropzone` com filtro `accept` de tipos de imagem.
- Pipeline server-side (`imageProcessor.ts`) usa Sharp, que rejeita buffers invalidos/nao-imagem automaticamente ao processar.
- `validateImageForExport()` valida dimensoes minimas e formato antes de permitir exportacao.

## Code Splitting e Bundle

Build de producao (`vite build`) ja aplica code splitting automatico por rota/vendor:

```
vendor-react     174.76 kB (gzip 55.07 kB)
vendor-misc       281.70 kB (gzip 91.51 kB)
vendor-export     342.35 kB (gzip 90.83 kB)
vendor-forms       83.17 kB (gzip 23.57 kB)
vendor-dnd          55.18 kB (gzip 18.17 kB)
vendor-motion       32.65 kB (gzip 11.24 kB)
index               158.33 kB (gzip 40.39 kB)
```

Modulos pesados carregados sob demanda via `import()` dinamico:
- KaTeX (`FormulaBlock`)
- Shiki (`CodeBlock`)
- Mermaid (`MermaidRenderer`)
- ECharts (`BrandChart`)

Isso evita que usuarios que nunca usam diagramas/formulas/graficos paguem o custo dessas bibliotecas no bundle inicial.

## Validacao Final

- `npx tsc --noEmit` — 0 erros
- `npx vite build` — build limpo, ~5s
- `npx vitest run` — 72/72 testes passando em 14 arquivos
