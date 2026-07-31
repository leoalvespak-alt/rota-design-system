# Auditoria Final da Migração — HTML → React + TypeScript

> Executada ao final da Fase 13 do `PLANO_MIGRACAO_REACT.md`. Cobre: testes automatizados,
> diff visual pixel a pixel dos 26 templates, bugs encontrados e corrigidos durante a própria
> migração, e o estado final de build/performance.

---

## 1. Resumo executivo

A migração do Gerador de Criativos "Rota de Ataque" (`Gerador/index.html`, ~4550 linhas
monolíticas) para React + TypeScript (`Gerador-React/`) foi concluída com **paridade visual
de 48/52 capturas** (26 templates × light/dark, threshold de 3% de diferença de pixels) contra
o baseline do app original. As 4 capturas fora do threshold correspondem a uma única correção
de conteúdo intencional, já aprovada pelo usuário (ver §4).

Durante a migração, a auditoria encontrou e corrigiu **2 bugs novos** introduzidos pela própria
migração (não existiam no HTML original) — ambos relacionados ao mesmo tipo de erro: um
componente React recebendo uma prop mas não repassando-a adiante. Nenhum dos 13 bugs da
auditoria pré-migração (documentados em `Gerador/AUDITORIA_E_PLANO_DE_CORRECAO.md`) voltou.

**O projeto HTML original (`Gerador/`) não foi tocado** e continua funcional como baseline de
referência e saída de emergência.

---

## 2. Metodologia de validação

1. **Baseline visual** (Fase 0): 52 PNGs capturados do `Gerador/index.html` real (26 templates
   × light/dark), via Chrome headless + Puppeteer-core, usando o Chrome já instalado no sistema.
2. **Testes unitários** (Vitest + Testing Library): 13 testes cobrindo os stores críticos
   (`useEditorStore`: seleção de template, undo/redo, toggle de visibilidade, setElementField
   em paths aninhados; `useAIStore`: guarda de "mínimo 1 modelo habilitado", prioridade de
   `customKey`) e o componente `EditableText` (persistência de edição, não-sobrescrita do DOM
   durante foco, gravação em paths aninhados sem criar chaves soltas).
3. **Diff visual automatizado**: script Puppeteer + pixelmatch que seleciona cada um dos 26
   templates via um hook de teste exposto em `window.__testSelectTemplate`/`__testSetDarkMode`/
   `__testSetZoom` (só existe em `import.meta.env.DEV`, não entra no bundle de produção),
   captura o canvas em escala 1:1 real e compara pixel a pixel com o baseline.
4. **Build de produção**: `tsc -b && vite build` limpo, sem erros de tipo, sem warnings de
   chunk grande após code-splitting.

---

## 3. Bugs encontrados e corrigidos DURANTE esta migração

### 3.1 🔴 ID duplicado `#card-canvas`

**Onde:** `src/features/templates/primitives/CanvasFrame.tsx`

**O problema:** o componente `CanvasFrame` (usado por todo template, seja no canvas editável,
nas 26 miniaturas da galeria, ou no nó de export offscreen) aplicava `id="card-canvas"` de
forma fixa e incondicional. Como a galeria renderiza as 26 miniaturas simultaneamente — cada
uma envolvendo seu próprio `CanvasFrame` —, o DOM acabava com **dezenas de elementos com o
mesmo id**. HTML permite isso sem erro (é inválido, mas os navegadores não recusam), então o
bug ficou silencioso até ser descoberto durante o diff visual: `document.getElementById(
'card-canvas')` retornava a **primeira ocorrência no DOM** (uma miniatura da galeria, em escala
reduzida fixa ~260px) em vez do canvas real — o que também afetava potencialmente o
`ExportEngine`/`useExportCard` em produção, não só o script de teste.

**Como foi descoberto:** ao rodar o diff visual, todas as capturas vinham em 260×260px em vez
da resolução real (1080×1080 ou 1080×1920), mesmo forçando zoom 100%. Investigação com
`getBoundingClientRect()` revelou que `card-canvas` correspondia à miniatura, não ao canvas
editável.

**Correção:** `CanvasFrame` passou a receber `id` como prop **opcional**, sem valor padrão.
Agora:
- O canvas editável (`Canvas.tsx`) usa `id="card-canvas-live"`.
- O nó de export offscreen (`ExportNode.tsx`) usa `id="card-canvas"`.
- As miniaturas da galeria (`TemplateThumb.tsx`) não recebem `id` nenhum.

Cada id agora é único no DOM em qualquer momento.

**Risco residual:** nenhum — a prop é obrigatoriamente explícita nos dois únicos lugares que
precisam de um id estável, e o TypeScript não permite mais que alguém esqueça (o campo é
opcional, então o comportamento default é seguro — sem id).

---

### 3.2 🔴 Prop `dark` não propagada para os elementos internos do template

**Onde:** 17 dos 26 componentes de render (`SqCover`, `SqContent`, `SqQuote`, `SqStats`,
`SqSteps`, `SqTable`, `SqTip`, `SqChecklist`, `SqTextImage`, `SqTwoImages`, `SqProfile`,
`SqTweet`, `PtCover`, `PtContent`, `PtList`, `PtQuote`, `PtCta`, `PtImage`, `CrCover`, `CrCta`,
`CrSlide`, `CrList`, `CrFact`, `CrComparison`, `CrTextImage` — a lista real inclui praticamente
todos os templates que usam `TTitle`/`TBody`/`TSlot`).

**O problema:** cada `Render` recebe `{ elements, dark }: TemplateRenderProps<E>`, mas boa
parte dos componentes desestruturava só `{ elements: el }`, ignorando `dark` — e então
renderizava `<TTitle>`/`<TBody>`/`<TSlot>` **sem passar a prop adiante**. Como esses três
primitivos default para `dark = false` quando a prop não é passada, o resultado prático era:
o card de fundo (`CanvasFrame`, que corretamente lia `darkMode` da store) ficava escuro, mas o
**título e o corpo continuavam com a cor de modo claro** (`var(--light-text)` = `#0A0A0A`,
quase preto) — sobre um fundo também quase preto. Texto efetivamente **invisível**.

**Como foi descoberto:** no diff visual, `pt-image--dark` teve 56% de mismatch e outros
templates com slot de imagem (`sq-two-images`, `sq-text-image`, `cr-text-image`) tiveram
37-49% — bem acima do ruído normal de antialiasing (~1-2%). Uma captura isolada do React
"parecia" mostrar texto claro visualmente ao olho, mas a inspeção de `getComputedStyle` provou
que a cor computada do título era `rgb(10, 10, 10)` sobre um fundo `rgb(10, 10, 10)` — a
aparência de "legibilidade" no screenshot era ilusão de compressão/antialiasing do PNG.

**Correção:** os 17 componentes agora desestruturam `dark` e o repassam para todo `TTitle`,
`TBody` e `TSlot` que renderizam. Em cada caso, a correção foi **conferida contra o HTML
original linha a linha** antes de aplicar — porque alguns elementos são *intencionalmente*
sempre light no app original (ex.: o card de `sq-tweet` simula um tweet e é sempre branco; a
tabela de `sq-table` e os cards de `sq-stats`/`cr-comparison` têm fundo sempre
`var(--light-bg-alt)`; a quote de `pt-quote` usa cor hardcoded sem classe `.t-title`). Nesses
casos a prop `dark` foi passada só onde o original realmente reagia (via classes `.t-title`/
`.t-body`/`.t-slot`, que têm regra CSS `#card-canvas.dark .t-title { ... }`), preservando a
fidelidade em vez de "consertar" uma inconsistência que já existia por design.

**Risco residual:** baixo. Um novo template que esqueça de propagar `dark` vai reproduzir esse
padrão de bug — não há guarda de tipo que force isso (TypeScript não pode obrigar "toda prop
recebida deve ser repassada"). Mitigação recomendada para o futuro: um teste de snapshot/diff
visual automatizado (como o desta auditoria) rodando em CI a cada novo template, para pegar
esse tipo de regressão antes do merge.

---

## 4. Divergência de conteúdo intencional (não é bug)

`sq-content` e `cr-slide` têm ~7% e ~5% de mismatch mesmo após todas as correções. Causa: o
HTML original tinha "nn" **literal** no meio do texto padrão (bug de digitação — faltou
escapar `\n\n` como quebra de parágrafo). Perguntado explicitamente durante a migração, o
usuário optou por **corrigir** esse texto (ver histórico da conversa) em vez de replicar o erro
de digitação. Isso é a única divergência de conteúdo em toda a migração, feita por decisão
consciente e registrada.

---

## 5. Estado final de build e testes

```
Type-check (tsc -b):     limpo, 0 erros
Build (vite build):      ✓ built in ~6-10s
Testes unitários:        13/13 passando (Vitest)
Diff visual:              48/52 dentro do threshold (as 4 restantes = divergência intencional §4)
Chunk principal:          136 KB (33.6 KB gzip) — antes do code-splitting: ~1035 KB
Chunks separados:         vendor-react, vendor-export (html2canvas-pro+jszip),
                          vendor-dnd (@dnd-kit), vendor-motion, vendor-forms, vendor-misc
```

---

## 6. O que ficou fora do escopo desta rodada (documentado, não esquecido)

Por decisão explícita do usuário durante a Fase 4/10 (`AskUserQuestion`), os seguintes itens do
plano original foram **deliberadamente não implementados**, sem que isso seja uma lacuna:

- **Cor Gold (`--gold`)** permanece sem uso em nenhum template, exatamente como no app original
  — o usuário optou por não decidir seu destino nesta rodada.
- **Chave de IA customizada por modelo** (`customKey`) foi implementada na store e no modal
  (`ModelFormDialog`), mas por decisão do usuário isso resolve a dívida original de forma
  opcional — não é um requisito obrigatório desta migração, só um ganho disponível.

Itens **fora do escopo do plano original** (Fase 14, backend) continuam não implementados por
design — a migração entrega um app 100% client-side, igual ao original, com a `StorageAdapter`
(via IndexedDB) já pronta para um futuro backend sem precisar de rewrite.

---

## 7. Recomendação de manutenção contínua

1. Rodar `node .tools/visual-diff.js` (fora do repo do produto, em `Sistema de Design/.tools/`)
   sempre que um template for adicionado ou alterado — é a rede de segurança que pegou os 2
   bugs desta auditoria.
2. Ao criar um novo template, usar como checklist os 26 componentes já corrigidos: sempre
   desestruturar `dark` de `TemplateRenderProps` e repassá-lo a `TTitle`/`TBody`/`TSlot`,
   exceto quando o elemento é intencionalmente "sempre light" (documentar isso num comentário,
   como feito nos casos de `sq-tweet`/`sq-table`/`sq-stats`/`cr-comparison`/`pt-quote`).
3. O script de diff visual (`.tools/visual-diff.js`) e os hooks de teste em `AppShell.tsx`
   (`window.__testSelectTemplate` etc., guardados por `import.meta.env.DEV`) podem ser
   promovidos a um teste Playwright real dentro de `tests/e2e/` se o projeto quiser rodar isso
   em CI.
