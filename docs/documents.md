# Modulo de Documentos HTML

## Tipos de Documento

7 tipos em `src/features/documents/types.ts`:

resumo, apostila, revisao, roteiro, relatorio, guia, tecnico

## Tipos de Bloco

15 tipos de bloco de conteudo:

heading, paragraph, list, table, image, callout, formula, code, quote, divider, diagram, chart, reference, exercise, answer

## Modelo de Dados

```typescript
interface DocumentBlock {
  id: string
  type: BlockType
  content: string
  level?: number
  items?: string[]
  data?: Record<string, unknown>
}

interface DocumentPage {
  id: string
  blocks: DocumentBlock[]
}

interface DocumentData {
  id: string
  type: DocumentType
  title: string
  pages: DocumentPage[]
  dark?: boolean
  header?: string
  footer?: string
}
```

## Componentes

### DocumentRenderer

Renderiza documento completo com:
- Paginas no formato A4 (794x1123px)
- Numeracao de paginas
- Cabecalho e rodape
- Blocos renderizados com componentes brand

### DocumentCanvas

Canvas A4 com zoom automatico e suporte a multiplas paginas.

## Uso

```tsx
<DocumentRenderer document={docData} />
```
