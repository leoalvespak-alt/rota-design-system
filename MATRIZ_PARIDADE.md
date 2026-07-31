# Matriz de Paridade — Migração HTML → React

> **Status final: migração concluída em 2026-07-31.** Validação por diff visual automatizado
> (pixel a pixel, Puppeteer + pixelmatch, threshold 3%) contra o baseline gerado do
> `Gerador/index.html` original — ver `tests/visual/baseline/` e `tests/visual/diff/results.json`.
>
> **Resultado: 48/52 capturas (26 templates × light/dark) dentro do threshold.** As 4
> capturas fora do threshold (`sq-content` e `cr-slide`, light+dark) correspondem a uma
> única correção de conteúdo **intencional e aprovada pelo usuário** — não são regressões
> (ver nota no rodapé). Nenhum outro diff foi encontrado após as correções desta fase.

## Templates (26) — todos renderizam e reagem a light/dark corretamente

| id | Nome | Categoria | Diff visual light | Diff visual dark |
|---|---|---|---|---|
| sq-cover | Capa Principal | Posts Quadrados | ✅ 0.81% | ✅ 0.82% |
| sq-text-image | Texto + Imagem | Posts Quadrados | ✅ 1.20% | ✅ 1.17% |
| sq-content | Card de Conteúdo | Posts Quadrados | ⚠️ 7.48%* | ⚠️ 7.53%* |
| sq-quote | Citação / Destaque | Posts Quadrados | ✅ 0.00% | ✅ 0.00% |
| sq-tip | Dica Rápida | Posts Quadrados | ✅ 1.13% | ✅ 1.10% |
| sq-two-images | 2 Imagens + Texto | Posts Quadrados | ✅ 0.56% | ✅ 0.55% |
| sq-steps | Passo a Passo | Posts Quadrados | ✅ 1.73% | ✅ 2.15% |
| sq-stats | Estatísticas / Prova Social | Posts Quadrados | ✅ 1.19% | ✅ 1.72% |
| sq-profile | Testemunho / Depoimento | Posts Quadrados | ✅ 0.04% | ✅ 0.04% |
| sq-tweet | Estilo Tweet | Posts Quadrados | ✅ 1.36% | ✅ 1.85% |
| sq-table | Tabela Comparativa | Posts Quadrados | ✅ 1.05% | ✅ 1.05% |
| sq-checklist | Checklist de Revisão | Posts Quadrados | ✅ 1.87% | ✅ 2.46% |
| pt-cover | Story Capa | Stories & Retratos | ✅ 1.84% | ✅ 1.84% |
| pt-content | Story Conteúdo | Stories & Retratos | ✅ 0.95% | ✅ 0.96% |
| pt-image | Story com Imagem | Stories & Retratos | ✅ 0.78% | ✅ 0.79% |
| pt-quote | Story Citação | Stories & Retratos | ✅ 0.38% | ✅ 0.00% |
| pt-list | Story Lista / Tópicos | Stories & Retratos | ✅ 1.34% | ✅ 1.71% |
| pt-cta | Story CTA / Link | Stories & Retratos | ✅ 1.10% | ✅ 1.11% |
| cr-cover | Capa Carrossel | Carrosséis | ✅ 0.25% | ✅ 0.25% |
| cr-cover-dark | Capa Escura | Carrosséis | ✅ 2.20% | ✅ 2.20% |
| cr-slide | Slide Conteúdo | Carrosséis | ⚠️ 5.16%* | ⚠️ 5.19%* |
| cr-text-image | Slide Texto + Imagem | Carrosséis | ✅ 1.14% | ✅ 1.12% |
| cr-list | Slide Passos / Lista | Carrosséis | ✅ 1.04% | ✅ 1.02% |
| cr-fact | Slide Destaque / Fato | Carrosséis | ✅ 0.61% | ✅ 0.55% |
| cr-comparison | Slide Antes vs Depois | Carrosséis | ✅ 1.13% | ✅ 1.51% |
| cr-cta | CTA Final | Carrosséis | ✅ 1.27% | ✅ 1.28% |

**Total: 48/52 dentro do threshold de 3% de diferença de pixels.**

\* `sq-content` e `cr-slide` têm mismatch maior porque o texto padrão original continha
"nn" literal (bug de digitação no HTML — faltou escapar `\n\n`). Por decisão do usuário,
essa correção foi aplicada na migração (quebra de parágrafo real em vez de "nn" visível),
então o baseline (com o bug) diverge do React (corrigido) nesses 2 templates. **Não é uma
regressão** — é a única divergência de conteúdo intencional em toda a migração.

## Recursos transversais

| Área | Item | Status |
|---|---|---|
| Templates | 26 templates renderizam | ✅ |
| Templates | Conteúdo padrão (`defaultContent`) idêntico (exceto a correção do "nn" acima) | ✅ |
| Templates | Thumbnails reais na galeria (26/26 — corrige D1) | ✅ |
| Edição | Texto simples persiste | ✅ testado (`EditableText.test.tsx`) |
| Edição | Campos de lista/tabela/stats persistem após re-render (corrige D4 / bugs 1-2) | ✅ testado |
| Edição | Toggles de elemento (eyebrow/subtitle/redline/autor/CTA) | ✅ |
| Edição | Cursor não pula ao digitar (contentEditable não-controlado) | ✅ testado |
| Canvas | Square 1080×1080 / Portrait 1080×1920 | ✅ |
| Canvas | Modo escuro (title/body/slot reagem em todos os 26 templates) | ✅ corrigido nesta fase (ver auditoria) |
| Canvas | 7 níveis de zoom (20/30/40/50/65/80/100%) | ✅ |
| Decoração | 3 texturas (orgânico/ruído/hatching) + opacidade 2-25% | ✅ |
| Decoração | Marca d'água (texto/3 posições/opacidade 20-100%) | ✅ |
| Decoração | 10 fundos da biblioteca (1 nenhum + 5 gradiente + 4 sólido) | ✅ |
| Imagens | Upload em slots + fundo dedicado | ✅ |
| Undo/Redo | 30 níveis + Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z | ✅ testado (zundo) |
| Export | PNG 2x idêntico ao baseline (timing determinístico) | ✅ (ExportEngine + ExportNode) |
| Export | Nome de arquivo `rota-de-ataque-{id}-{timestamp}.png` | ✅ |
| Série | Add/load/delete slide | ✅ |
| Série | Export ZIP (`slide-01..NN.png`) | ✅ |
| Série | 🆕 Reordenar slides via drag-and-drop (@dnd-kit) | ✅ |
| Renders | 4 categorias (Pessoas/Brasões/Objetos/Ícones) | ✅ |
| Renders | Upload/usar/excluir | ✅ |
| Renders | 🆕 Armazenamento em IndexedDB (corrige D2) | ✅ |
| Histórico | Salvar/carregar/excluir, limite 20 | ✅ |
| IA Copy | DeepSeek + Claude + custom (system prompt idêntico) | ✅ |
| IA Copy | Mapeamento de campos do template ativo | ✅ |
| IA Copy | 🆕 Chave própria por modelo customizado (corrige D6) | ✅ testado |
| IA Imagem | fal.ai flux/schnell com polling + preview | ✅ |
| Marca | 8 seções idênticas (00-07) | ✅ validado visualmente |
| Marca | Copiar hex + toast | ✅ |
| Marca | Grid de logos com download | ✅ |
| Marca | Tabela de tokens | ✅ |
| Dados | Chave `rda_ai_keys` preservada (mesmo nome de persistência) | ✅ |
| Abas | 5 abas (Criar Arte/Marca/AI/Renders/Histórico) | ✅ validado visualmente |
| Filtros | 4 formato + 4 tags na galeria | ✅ |
| Build | Code-splitting (chunk principal 1MB → 136KB) | ✅ |
| Testes | 13 testes unitários passando (stores + EditableText) | ✅ |

## Auditoria anterior (HTML → correções pré-migração) — confirmado que nenhum bug voltou

| # | Bug original (HTML) | Status no React |
|---|---|---|
| 1-2 | Perda de edição em campos de array | ✅ Impossível por construção (paths tipados + `setElementField`) |
| 3 | Toggles sem CSS | ✅ shadcn Switch usado em 100% dos toggles |
| 4 | Toggle "Mostrar Autor" com estado hardcoded | ✅ corrigido e testado |
| 5 | Texto de carrossel contraditório | ✅ corrigido (orienta o Modo Série) |
| 6-7 | Paleta duplicada / arquivos legados confusos | N/A — projeto novo, uma única fonte de tokens |
| 8 | Cor Gold não usada | Mantido como estava (decisão do usuário) |
| 9 | Duplicação de `baseTexture()` | N/A — `CanvasFrame` é o único componente que desenha textura/accent |
| 10 | IA custom sem chave própria | Mantido como estava (decisão do usuário) — campo `customKey` implementado mas não exigido |
| 11 | `toggleElement` sem guarda null | N/A — tipagem torna o cenário impossível |
| 12 | Transform morto em `saveCurrentArt` | N/A — `ExportEngine` usa `scale` real do html2canvas |
| 13 | `getEls()` indireção morta | N/A — sem equivalente (leitura direta da store) |

## Bugs novos encontrados e corrigidos durante ESTA migração

Ver `AUDITORIA_MIGRACAO.md` para o detalhamento completo. Resumo:

1. **ID duplicado `#card-canvas`** — o `CanvasFrame` usava um `id` fixo, reaproveitado tanto
   pelo canvas editável quanto pelas 26 miniaturas da galeria e pelo nó de export. Causava
   ambiguidade em qualquer `document.getElementById('card-canvas')` (inclusive na exportação
   real). Corrigido: `id` agora é uma prop opcional, usada apenas pelo canvas editável
   (`card-canvas-live`) e pelo nó de export (`card-canvas`); miniaturas não têm id.
2. **Prop `dark` não propagada** — 17 dos 26 componentes de render não repassavam a prop
   `dark` recebida para `TTitle`/`TBody`/`TSlot`, fazendo o modo escuro não ter efeito visual
   nesses templates (texto permanecia com a cor de modo claro, às vezes invisível sobre fundo
   escuro). Corrigido em todos os 17 arquivos, com nota de fidelidade nos casos em que o HTML
   original também tinha elementos "sempre light" por design (não confundir com o bug).
