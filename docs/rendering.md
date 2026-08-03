# Rendering e Exportacao

## Rendering Server-Side (Playwright)

`src/server/render/playwrightRenderer.ts` usa Playwright + Chromium para renderizacao profissional.

### Funcoes

- `renderHtml(html, options)` — Renderiza HTML string para PNG/JPEG/PDF
- `renderUrl(url, options)` — Renderiza URL para PNG/JPEG/PDF
- `closeBrowser()` — Fecha instancia singleton do browser

### Opcoes

```typescript
{
  width: number
  height: number
  format: 'png' | 'jpeg' | 'pdf'
  quality?: number    // JPEG only (0-100)
  scale?: number      // Device pixel ratio
  waitForFonts?: boolean
}
```

### Gerenciamento de Browser

Usa padrao singleton — uma unica instancia de Chromium reutilizada entre renders. Chame `closeBrowser()` no shutdown.

## Rendering Client-Side (html-to-image)

Fallback para quando Playwright nao esta disponivel (client-side puro).

## Exportadores

`src/lib/export/exporters/` — registro de exportadores:

| Formato | Modulo | Tecnologia |
|---------|--------|-----------|
| PNG | PngExporter | html-to-image `toPng()` |
| JPEG | JpegExporter | html-to-image `toJpeg()` |
| HTML | HtmlExporter | HTML standalone com CSS inline |
| PPTX | PptxExporter | PptxGenJS com slide rasterizado |

### Uso

```typescript
import { getExporter, getAvailableFormats } from './exporters'

const formats = getAvailableFormats() // ['png', 'jpeg', 'html', 'pptx']
const exporter = getExporter('png')
const result = await exporter.export(element, { format: 'png', width: 1080, height: 1080 })
```

## Pipeline de Imagens (Sharp)

`src/server/images/imageProcessor.ts` — processamento server-side:

- `processImage()` — Resize/convert
- `cropImage()` — Crop com dimensoes
- `createThumbnail()` — Thumbnail automatico
- `applyBrandVariation()` — 5 variacoes: duotone, monochrome, high-contrast, editorial, dark
- `validateImageForExport()` — Valida dimensoes e formato
