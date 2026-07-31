import type { TemplateDefinition } from './types'

// ---- SQUARE (12) ----
import { SqCoverRender, SqCoverControls, sqCoverDefaults } from './square/SqCover'
import { SqTextImageRender, SqTextImageControls, sqTextImageDefaults } from './square/SqTextImage'
import { SqContentRender, SqContentControls, sqContentDefaults } from './square/SqContent'
import { SqQuoteRender, SqQuoteControls, sqQuoteDefaults } from './square/SqQuote'
import { SqTipRender, SqTipControls, sqTipDefaults } from './square/SqTip'
import { SqTwoImagesRender, SqTwoImagesControls, sqTwoImagesDefaults } from './square/SqTwoImages'
import { SqStepsRender, SqStepsControls, sqStepsDefaults } from './square/SqSteps'
import { SqStatsRender, SqStatsControls, sqStatsDefaults } from './square/SqStats'
import { SqProfileRender, SqProfileControls, sqProfileDefaults } from './square/SqProfile'
import { SqTweetRender, SqTweetControls, sqTweetDefaults } from './square/SqTweet'
import { SqTableRender, SqTableControls, sqTableDefaults } from './square/SqTable'
import { SqChecklistRender, SqChecklistControls, sqChecklistDefaults } from './square/SqChecklist'

// ---- PORTRAIT (6) ----
import { PtCoverRender, PtCoverControls, ptCoverDefaults } from './portrait/PtCover'
import { PtContentRender, PtContentControls, ptContentDefaults } from './portrait/PtContent'
import { PtImageRender, PtImageControls, ptImageDefaults } from './portrait/PtImage'
import { PtQuoteRender, PtQuoteControls, ptQuoteDefaults } from './portrait/PtQuote'
import { PtListRender, PtListControls, ptListDefaults } from './portrait/PtList'
import { PtCtaRender, PtCtaControls, ptCtaDefaults } from './portrait/PtCta'

// ---- CAROUSEL (8) ----
import { CrCoverRender, CrCoverControls, crCoverDefaults } from './carousel/CrCover'
import { CrCoverDarkRender, CrCoverDarkControls, crCoverDarkDefaults } from './carousel/CrCoverDark'
import { CrSlideRender, CrSlideControls, crSlideDefaults } from './carousel/CrSlide'
import { CrTextImageRender, CrTextImageControls, crTextImageDefaults } from './carousel/CrTextImage'
import { CrListRender, CrListControls, crListDefaults } from './carousel/CrList'
import { CrFactRender, CrFactControls, crFactDefaults } from './carousel/CrFact'
import { CrComparisonRender, CrComparisonControls, crComparisonDefaults } from './carousel/CrComparison'
import { CrCtaRender, CrCtaControls, crCtaDefaults } from './carousel/CrCta'

/**
 * Espelha o array TEMPLATES do Gerador/index.html original (linhas 2013-2043).
 * Mesmos 26 templates, mesmos ids, mesma categoria/filter/format/tags — fonte de
 * verdade única para galeria, seleção e thumbnails (resolve a dívida D1 da análise:
 * no HTML original 14/26 templates não tinham thumbnail real na galeria porque o
 * dicionário `buildThumbHtml` cobria só 12; aqui a Fase 6 usa o próprio `Render`
 * de cada template, em escala reduzida, então a cobertura é sempre 26/26).
 */
export const TEMPLATES: TemplateDefinition<never>[] = [
  // ---- QUADRADO (filter:'square') ----
  {
    id: 'sq-cover',
    name: 'Capa Principal',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal', 'motivacao'],
    defaults: sqCoverDefaults,
    Render: SqCoverRender,
    Controls: SqCoverControls,
  },
  {
    id: 'sq-text-image',
    name: 'Texto + Imagem',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: sqTextImageDefaults,
    Render: SqTextImageRender,
    Controls: SqTextImageControls,
  },
  {
    id: 'sq-content',
    name: 'Card de Conteúdo',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: sqContentDefaults,
    Render: SqContentRender,
    Controls: SqContentControls,
  },
  {
    id: 'sq-quote',
    name: 'Citação / Destaque',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['motivacao'],
    defaults: sqQuoteDefaults,
    Render: SqQuoteRender,
    Controls: SqQuoteControls,
  },
  {
    id: 'sq-tip',
    name: 'Dica Rápida',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: sqTipDefaults,
    Render: SqTipRender,
    Controls: SqTipControls,
  },
  {
    id: 'sq-two-images',
    name: '2 Imagens + Texto',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: sqTwoImagesDefaults,
    Render: SqTwoImagesRender,
    Controls: SqTwoImagesControls,
  },
  {
    id: 'sq-steps',
    name: 'Passo a Passo',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: sqStepsDefaults,
    Render: SqStepsRender,
    Controls: SqStepsControls,
  },
  {
    id: 'sq-stats',
    name: 'Estatísticas / Prova Social',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal', 'motivacao'],
    defaults: sqStatsDefaults,
    Render: SqStatsRender,
    Controls: SqStatsControls,
  },
  {
    id: 'sq-profile',
    name: 'Testemunho / Depoimento',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal', 'motivacao'],
    defaults: sqProfileDefaults,
    Render: SqProfileRender,
    Controls: SqProfileControls,
  },
  {
    id: 'sq-tweet',
    name: 'Estilo Tweet',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['motivacao'],
    defaults: sqTweetDefaults,
    Render: SqTweetRender,
    Controls: SqTweetControls,
  },
  {
    id: 'sq-table',
    name: 'Tabela Comparativa',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'tribunal'],
    defaults: sqTableDefaults,
    Render: SqTableRender,
    Controls: SqTableControls,
  },
  {
    id: 'sq-checklist',
    name: 'Checklist de Revisão',
    category: 'Posts Quadrados',
    filter: 'square',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: sqChecklistDefaults,
    Render: SqChecklistRender,
    Controls: SqChecklistControls,
  },
  // ---- RETRATO / STORY (filter:'portrait') ----
  {
    id: 'pt-cover',
    name: 'Story Capa',
    category: 'Stories & Retratos',
    filter: 'portrait',
    format: 'portrait',
    tags: ['fiscal', 'policial', 'tribunal', 'motivacao'],
    defaults: ptCoverDefaults,
    Render: PtCoverRender,
    Controls: PtCoverControls,
  },
  {
    id: 'pt-content',
    name: 'Story Conteúdo',
    category: 'Stories & Retratos',
    filter: 'portrait',
    format: 'portrait',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: ptContentDefaults,
    Render: PtContentRender,
    Controls: PtContentControls,
  },
  {
    id: 'pt-image',
    name: 'Story com Imagem',
    category: 'Stories & Retratos',
    filter: 'portrait',
    format: 'portrait',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: ptImageDefaults,
    Render: PtImageRender,
    Controls: PtImageControls,
  },
  {
    id: 'pt-quote',
    name: 'Story Citação',
    category: 'Stories & Retratos',
    filter: 'portrait',
    format: 'portrait',
    tags: ['motivacao'],
    defaults: ptQuoteDefaults,
    Render: PtQuoteRender,
    Controls: PtQuoteControls,
  },
  {
    id: 'pt-list',
    name: 'Story Lista / Tópicos',
    category: 'Stories & Retratos',
    filter: 'portrait',
    format: 'portrait',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: ptListDefaults,
    Render: PtListRender,
    Controls: PtListControls,
  },
  {
    id: 'pt-cta',
    name: 'Story CTA / Link',
    category: 'Stories & Retratos',
    filter: 'portrait',
    format: 'portrait',
    tags: ['fiscal', 'policial', 'tribunal', 'motivacao'],
    defaults: ptCtaDefaults,
    Render: PtCtaRender,
    Controls: PtCtaControls,
  },
  // ---- CARROSSEL (filter:'carousel') ----
  {
    id: 'cr-cover',
    name: 'Capa Carrossel',
    category: 'Carrosséis',
    filter: 'carousel',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal', 'motivacao'],
    defaults: crCoverDefaults,
    Render: CrCoverRender,
    Controls: CrCoverControls,
  },
  {
    id: 'cr-cover-dark',
    name: 'Capa Escura',
    category: 'Carrosséis',
    filter: 'carousel',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal', 'motivacao'],
    defaults: crCoverDarkDefaults,
    Render: CrCoverDarkRender,
    Controls: CrCoverDarkControls,
  },
  {
    id: 'cr-slide',
    name: 'Slide Conteúdo',
    category: 'Carrosséis',
    filter: 'carousel',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: crSlideDefaults,
    Render: CrSlideRender,
    Controls: CrSlideControls,
  },
  {
    id: 'cr-text-image',
    name: 'Slide Texto + Imagem',
    category: 'Carrosséis',
    filter: 'carousel',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: crTextImageDefaults,
    Render: CrTextImageRender,
    Controls: CrTextImageControls,
  },
  {
    id: 'cr-list',
    name: 'Slide Passos / Lista',
    category: 'Carrosséis',
    filter: 'carousel',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal'],
    defaults: crListDefaults,
    Render: CrListRender,
    Controls: CrListControls,
  },
  {
    id: 'cr-fact',
    name: 'Slide Destaque / Fato',
    category: 'Carrosséis',
    filter: 'carousel',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal', 'motivacao'],
    defaults: crFactDefaults,
    Render: CrFactRender,
    Controls: CrFactControls,
  },
  {
    id: 'cr-comparison',
    name: 'Slide Antes vs Depois',
    category: 'Carrosséis',
    filter: 'carousel',
    format: 'square',
    tags: ['fiscal', 'tribunal'],
    defaults: crComparisonDefaults,
    Render: CrComparisonRender,
    Controls: CrComparisonControls,
  },
  {
    id: 'cr-cta',
    name: 'CTA Final',
    category: 'Carrosséis',
    filter: 'carousel',
    format: 'square',
    tags: ['fiscal', 'policial', 'tribunal', 'motivacao'],
    defaults: crCtaDefaults,
    Render: CrCtaRender,
    Controls: CrCtaControls,
  },
] as unknown as TemplateDefinition<never>[]

export function getTemplateById(id: string) {
  return TEMPLATES.find((t) => t.id === id)
}

export function getDefaultElements(id: string): Record<string, unknown> {
  const tpl = getTemplateById(id)
  return tpl ? (structuredClone(tpl.defaults) as Record<string, unknown>) : {}
}
