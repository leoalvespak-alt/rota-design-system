# Design System — Rota de Ataque

## Tokens

Tokens sao gerados via Style Dictionary a partir de `src/tokens/`:

- **Primitivos**: cores, tipografia, espacamento, elevacao
- **Semanticos**: temas light/dark, UI tokens
- **Formato**: dimensoes por formato (square 1080x1080, portrait 1080x1920, slide 1920x1080, document A4)

### Build

```bash
npm run tokens:build
```

Gera:
- `src/tokens/build/tokens.css` — CSS custom properties
- `src/tokens/build/tokens.ts` — TypeScript exports
- `src/tokens/build/tokens.json` — JSON puro

## Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-red-primary` | #C1121F | Cor principal, CTAs, destaque |
| `--color-gold-primary` | #D4A017 | Acentos, badges premium |
| `--color-neutral-950` | #0A0A0A | Fundo dark |
| `--color-neutral-50` | #F5F5F0 | Fundo light |

## Tipografia

| Fonte | Uso |
|-------|-----|
| Rajdhani | Headings, numerais, badges |
| IBM Plex Sans | Corpo de texto |
| Space Grotesk | Codigo, dados tecnicos |

## CSS Cascade Layers

```css
@layer reset, tokens, base, utilities, components, templates, overrides;
```

Garante ordem de especificidade previsivel.

## Componentes Brand

17 componentes com suporte dark mode e tokens:

1. **BrandText** — 6 variantes (heading, body, eyebrow, caption, numeral, quote)
2. **BrandBadge** — 5 variantes
3. **BrandDivider** — 4 variantes (line, accent, dots, gradient)
4. **BrandImageFrame** — 5 variantes
5. **BrandCallout** — 7 variantes (info, warning, danger, success, tip, law, concept)
6. **BrandQuote** — Blockquote estilizado
7. **BrandTable** — Tabela com header brand
8. **BrandTimeline** — Timeline vertical
9. **BrandComparison** — Grid comparativo
10. **BrandProcess** — Passos numerados
11. **BrandFormula** — Exibicao de formulas
12. **BrandCodeBlock** — Bloco de codigo
13. **BrandChart** — Wrapper ECharts
14. **BrandDiagram** — Wrapper Mermaid
15. **CreativeCanvas** — Canvas de criativo
16. **SlideCanvas** — Canvas 1920x1080
17. **DocumentCanvas** — Canvas A4

## Storybook

```bash
npm run storybook
```

Stories para todos os componentes brand com controles de tema e variante.
