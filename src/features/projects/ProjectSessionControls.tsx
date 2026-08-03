import { useState } from 'react'
import { Check, ChevronDown, LoaderCircle, Plus, Save, TriangleAlert } from 'lucide-react'
import { createProject, stableId, type ProjectDocument } from '@/domain/documents'
import { ProjectRepository } from '@/domain/repositories'
import { editorToCard } from '@/domain/adapters'
import { useDecorStore } from '@/stores/useDecorStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useFeatureFlags } from '@/domain/featureFlags'
import { useProjectSessionStore } from '@/stores/useProjectSessionStore'

function fromEditor(name: string): ProjectDocument | undefined {
  const card = editorToCard(useEditorStore.getState(), useDecorStore.getState())
  if (!card) return undefined
  const project = createProject(name)
  project.campaigns = [{
    id: stableId('campaign'), name: 'Campanha padrão', status: 'draft', linkedComponents: [], featurePreferences: {},
    artifacts: [{ id: stableId('artifact'), kind: useEditorStore.getState().format === 'portrait' ? 'story' : 'post', cards: [card] }],
  }]
  return project
}

/** Creates, names and switches local documents without exposing AI configuration or secrets. */
export function ProjectSessionControls() {
  const enabled = useFeatureFlags((state) => state.flags.projects)
  const project = useProjectSessionStore((state) => state.project)
  const status = useProjectSessionStore((state) => state.status)
  const error = useProjectSessionStore((state) => state.error)
  const setProject = useProjectSessionStore((state) => state.setProject)
  const setStatus = useProjectSessionStore((state) => state.setStatus)
  const [projects, setProjects] = useState<ProjectDocument[]>([])
  const [open, setOpen] = useState(false)
  const repository = new ProjectRepository()

  const refresh = async () => {
    try { setProjects(await repository.list()) } catch (reason) { setStatus('error', reason instanceof Error ? reason.message : 'Não foi possível carregar projetos.') }
  }
  if (!enabled) return null

  const create = async () => {
    const name = window.prompt('Nome do projeto', 'Projeto sem nome')?.trim()
    if (!name) return
    const next = fromEditor(name)
    if (!next) return
    try { await repository.save(next); setProject(next); await refresh(); setOpen(false) } catch (reason) { setStatus('error', reason instanceof Error ? reason.message : 'Não foi possível criar o projeto.') }
  }
  const rename = async () => {
    if (!project) return create()
    const name = window.prompt('Nome do projeto', project.name)?.trim()
    if (!name || name === project.name) return
    const next = { ...project, name, updatedAt: Date.now() }
    try { await repository.save(next); setProject(next); await refresh() } catch (reason) { setStatus('error', reason instanceof Error ? reason.message : 'Não foi possível renomear o projeto.') }
  }

  return <div className="relative hidden min-w-0 items-center gap-1 lg:flex">
    <button aria-haspopup="menu" aria-expanded={open} onClick={() => { setOpen((value) => !value); if (!open) void refresh() }} className="flex max-w-44 items-center gap-1 rounded border border-ui-border bg-ui-panel2 px-2 py-1 text-xs text-ui-text hover:border-brand-red">
      <span className="truncate">{project?.name ?? 'Projeto local'}</span><ChevronDown className="size-3 shrink-0" />
    </button>
    <button title="Renomear projeto" aria-label="Renomear projeto" onClick={() => void rename()} className="rounded p-1 text-ui-muted hover:text-ui-text"><Save className="size-3.5" /></button>
    {status === 'saving' && <LoaderCircle aria-label="Salvando" className="size-3.5 animate-spin text-ui-muted" />}
    {status === 'ready' && <Check aria-label="Salvo localmente" className="size-3.5 text-emerald-500" />}
    {status === 'error' && <span title={error}><TriangleAlert aria-label={error ?? 'Erro de persistência'} className="size-3.5 text-brand-red" /></span>}
    {open && <div role="menu" className="absolute top-8 left-0 z-[80] w-72 rounded-lg border border-ui-border bg-ui-panel p-2 shadow-2xl">
      <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-ui-muted uppercase">Projetos locais</p>
      <div className="max-h-48 overflow-y-auto">{projects.map((item) => <button role="menuitem" key={item.id} onClick={() => { setProject(item); setOpen(false) }} className="flex w-full flex-col rounded px-2 py-2 text-left hover:bg-ui-panel2"><span className="truncate text-sm text-ui-text">{item.name}</span><span className="text-[11px] text-ui-muted">{new Date(item.updatedAt).toLocaleString('pt-BR')}</span></button>)}</div>
      <button role="menuitem" onClick={() => void create()} className="mt-1 flex w-full items-center gap-2 rounded bg-brand-red px-2 py-2 text-sm font-semibold text-white"><Plus className="size-4" />Novo projeto</button>
    </div>}
  </div>
}
