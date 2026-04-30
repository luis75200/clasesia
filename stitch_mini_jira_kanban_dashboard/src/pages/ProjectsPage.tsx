import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveProject,
  createProject,
  getProjects,
  restoreProject,
  updateProject,
  type ApiProject,
} from '../lib/api'
import { Sidebar } from '../shared/ui/Sidebar'
import { Topbar } from '../shared/ui/Topbar'

const projectsQueryKey = ['projects', 'list'] as const

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: projectsQueryKey,
    queryFn: () => getProjects({ take: 200 }),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createProject({
        name: newName.trim(),
        key: newKey.trim().toUpperCase(),
        description: newDescription.trim() || null,
      }),
    onSuccess: () => {
      setNewName('')
      setNewKey('')
      setNewDescription('')
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; name: string; description: string | null }) =>
      updateProject(payload.id, {
        name: payload.name,
        description: payload.description,
      }),
    onSuccess: () => {
      setEditingId(null)
      setEditName('')
      setEditDescription('')
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
    },
  })

  const filteredProjects = useMemo(() => {
    const projects = data?.data ?? []
    if (!search.trim()) return projects

    const normalized = search.trim().toLowerCase()
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(normalized) ||
        project.key.toLowerCase().includes(normalized) ||
        (project.description ?? '').toLowerCase().includes(normalized)
      )
    })
  }, [data?.data, search])

  const beginEdit = (project: ApiProject) => {
    setEditingId(project.id)
    setEditName(project.name)
    setEditDescription(project.description ?? '')
  }

  const submitCreate = () => {
    if (!newName.trim() || !newKey.trim()) return
    createMutation.mutate()
  }

  const submitEdit = (projectId: string) => {
    if (!editName.trim()) return
    updateMutation.mutate({
      id: projectId,
      name: editName.trim(),
      description: editDescription.trim() || null,
    })
  }

  const mutationError =
    createMutation.error ?? updateMutation.error ?? archiveMutation.error ?? restoreMutation.error

  return (
    <div className="min-h-screen bg-surface text-inverse_surface">
      <Sidebar />
      <main className="ml-64 flex min-h-screen flex-col">
        <Topbar />

        <section className="flex flex-1 flex-col gap-6 p-8">
          <header className="flex items-end justify-between">
            <div>
              <h1 className="text-[2.2rem] font-bold tracking-[-0.02em]">Projects</h1>
              <p className="text-sm text-outline_variant">Listado real desde API, sin mock data.</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o key"
              className="w-72 rounded-xl bg-surface_container_low px-4 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
            />
          </header>

          <section className="rounded-2xl bg-surface_container_low p-4 shadow-air">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-outline_variant">Crear proyecto</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Nombre"
                className="rounded-xl bg-surface px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              />
              <input
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                placeholder="Key (ej: ALPHA)"
                className="rounded-xl bg-surface px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              />
              <input
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Descripción"
                className="rounded-xl bg-surface px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              />
              <button
                type="button"
                onClick={submitCreate}
                disabled={createMutation.isPending || !newName.trim() || !newKey.trim()}
                className="rounded-xl bg-gradient-to-br from-primary to-primary_dim px-4 py-2 text-sm font-semibold text-surface_container_lowest disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </section>

          {mutationError instanceof Error ? (
            <p className="rounded-xl bg-error_container px-3 py-2 text-sm text-on_error_container">
              {mutationError.message}
            </p>
          ) : null}

          {isLoading ? <p className="text-sm text-outline_variant">Cargando proyectos...</p> : null}

          {isError ? (
            <p className="rounded-xl bg-error_container px-3 py-2 text-sm text-on_error_container">
              {error instanceof Error ? error.message : 'Error al cargar proyectos'}
            </p>
          ) : null}

          {!isLoading && !isError ? (
            <div className="space-y-3">
              {filteredProjects.map((project) => {
                const isEditing = editingId === project.id
                return (
                  <article key={project.id} className="rounded-2xl bg-surface_container_low p-4 shadow-air">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        {isEditing ? (
                          <>
                            <input
                              value={editName}
                              onChange={(event) => setEditName(event.target.value)}
                              className="w-full rounded-xl bg-surface px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                            />
                            <input
                              value={editDescription}
                              onChange={(event) => setEditDescription(event.target.value)}
                              className="w-full rounded-xl bg-surface px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                            />
                          </>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold">{project.name}</h3>
                            <p className="text-sm text-outline_variant">{project.description || 'Sin descripción'}</p>
                          </>
                        )}
                        <div className="flex items-center gap-3 text-xs text-outline_variant">
                          <span className="rounded-md bg-surface px-2 py-1 font-semibold">{project.key}</span>
                          <span>Owner: {project.owner.name}</span>
                          <span>{project.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => submitEdit(project.id)}
                              disabled={updateMutation.isPending || !editName.trim()}
                              className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-surface_container_lowest disabled:opacity-50"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-xl bg-surface px-3 py-2 text-xs font-semibold"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => beginEdit(project)}
                            className="rounded-xl bg-surface px-3 py-2 text-xs font-semibold"
                          >
                            Editar
                          </button>
                        )}

                        {project.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => archiveMutation.mutate(project.id)}
                            disabled={archiveMutation.isPending}
                            className="rounded-xl bg-error_container px-3 py-2 text-xs font-semibold text-on_error_container disabled:opacity-50"
                          >
                            Archivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => restoreMutation.mutate(project.id)}
                            disabled={restoreMutation.isPending}
                            className="rounded-xl bg-primary_container px-3 py-2 text-xs font-semibold text-on_primary_fixed disabled:opacity-50"
                          >
                            Restaurar
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}

              {filteredProjects.length === 0 ? (
                <p className="rounded-2xl bg-surface_container_low p-4 text-sm text-outline_variant shadow-air">
                  No hay proyectos para mostrar.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
