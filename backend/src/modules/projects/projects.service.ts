import { ApiError, Errors } from '../../http/api-error.js'
import { projectsRepository } from './projects.repository.js'
import type {
  CreateProjectInput,
  ListProjectsQuery,
  ListProjectsResult,
  ProjectDto,
  UpdateProjectInput,
} from './projects.types.js'

function mapProject(project: Awaited<ReturnType<typeof projectsRepository.getProjectById>>): ProjectDto {
  if (!project) {
    throw Errors.NOT_FOUND('Project')
  }

  return {
    id: project.id,
    name: project.name,
    key: project.key,
    description: project.description,
    status: project.status,
    owner: project.owner,
    archived_at: project.archived_at,
    created_at: project.created_at,
    updated_at: project.updated_at,
  }
}

export class ProjectsService {
  async listProjects(query: ListProjectsQuery): Promise<ListProjectsResult> {
    try {
      const { ids, total } = await projectsRepository.listProjects(query)
      const details = await Promise.all(ids.map((id) => projectsRepository.getProjectById(id)))

      return {
        data: details.filter((item): item is NonNullable<typeof item> => item !== null).map((item) => mapProject(item)),
        total,
        skip: query.skip,
        take: query.take,
      }
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[ProjectsService.listProjects]', error)
      throw Errors.INTERNAL_ERROR('Error al listar proyectos')
    }
  }

  async getProject(projectId: string): Promise<ProjectDto> {
    try {
      const project = await projectsRepository.getProjectById(projectId)
      if (!project) throw Errors.NOT_FOUND('Project')
      return mapProject(project)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[ProjectsService.getProject]', error)
      throw Errors.INTERNAL_ERROR('Error al obtener proyecto')
    }
  }

  async createProject(input: CreateProjectInput, ownerId: string): Promise<ProjectDto> {
    try {
      const exists = await projectsRepository.existsByKey(input.key)
      if (exists) throw Errors.CONFLICT('Project key ya existe')

      const id = await projectsRepository.createProject(input, ownerId)
      const created = await projectsRepository.getProjectById(id)
      return mapProject(created)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[ProjectsService.createProject]', error)
      throw Errors.INTERNAL_ERROR('Error al crear proyecto')
    }
  }

  async updateProject(projectId: string, input: UpdateProjectInput): Promise<ProjectDto> {
    try {
      const current = await projectsRepository.getProjectById(projectId)
      if (!current) throw Errors.NOT_FOUND('Project')

      if (input.key) {
        const keyExists = await projectsRepository.existsByKey(input.key, projectId)
        if (keyExists) throw Errors.CONFLICT('Project key ya existe')
      }

      await projectsRepository.updateProject(projectId, input)
      const updated = await projectsRepository.getProjectById(projectId)
      return mapProject(updated)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[ProjectsService.updateProject]', error)
      throw Errors.INTERNAL_ERROR('Error al actualizar proyecto')
    }
  }

  async archiveProject(projectId: string): Promise<ProjectDto> {
    try {
      const current = await projectsRepository.getProjectById(projectId)
      if (!current) throw Errors.NOT_FOUND('Project')

      await projectsRepository.archiveProject(projectId)
      const archived = await projectsRepository.getProjectById(projectId)
      return mapProject(archived)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[ProjectsService.archiveProject]', error)
      throw Errors.INTERNAL_ERROR('Error al archivar proyecto')
    }
  }

  async restoreProject(projectId: string): Promise<ProjectDto> {
    try {
      const current = await projectsRepository.getProjectById(projectId)
      if (!current) throw Errors.NOT_FOUND('Project')

      await projectsRepository.restoreProject(projectId)
      const restored = await projectsRepository.getProjectById(projectId)
      return mapProject(restored)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[ProjectsService.restoreProject]', error)
      throw Errors.INTERNAL_ERROR('Error al restaurar proyecto')
    }
  }
}

export const projectsService = new ProjectsService()
