import { ApiError, Errors } from '../../http/api-error.js';
import { AssignProjectInput, CreateTaskInput, ListTasksFilters, ListTasksResult, TaskDetails } from './tasks.types.js';
import { tasksRepository } from './tasks.repository.js';

export class TasksService {
  async listTasks(filters: ListTasksFilters): Promise<ListTasksResult> {
    try {
      const { ids, total } = await tasksRepository.listTaskIds(filters);
      const details = await Promise.all(ids.map((id) => tasksRepository.getTaskDetails(id)));
      const tasks = details.filter((task): task is TaskDetails => task !== null);

      return {
        data: tasks,
        total,
        skip: filters.skip,
        take: filters.take,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('[TasksService.listTasks]', error);
      throw Errors.INTERNAL_ERROR('Error al obtener tareas');
    }
  }

  async createTask(input: CreateTaskInput, userId: string): Promise<TaskDetails> {
    try {
      const validAssignees = await tasksRepository.validateAssignees(input.assignees);
      if (!validAssignees) {
        throw Errors.BAD_REQUEST('Uno o más assignees no existen o están inactivos');
      }

      const taskId = await tasksRepository.createTask(input, userId);

      await Promise.all([
        tasksRepository.attachAssignees(taskId, input.assignees),
        tasksRepository.attachLabels(taskId, input.labels),
      ]);

      const task = await tasksRepository.getTaskDetails(taskId);
      if (!task) throw Errors.INTERNAL_ERROR('No se pudo recuperar la tarea creada');

      return task;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('[TasksService.createTask]', error);
      throw Errors.INTERNAL_ERROR('Error al crear tarea');
    }
  }

  async assignProject(taskId: string, input: AssignProjectInput): Promise<TaskDetails> {
    try {
      const current = await tasksRepository.getTaskDetails(taskId);
      if (!current) throw Errors.NOT_FOUND('Task');

      await tasksRepository.assignProject(taskId, input.project_id);

      const updated = await tasksRepository.getTaskDetails(taskId);
      if (!updated) throw Errors.INTERNAL_ERROR('No se pudo recuperar la tarea actualizada');

      return updated;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('[TasksService.assignProject]', error);
      throw Errors.INTERNAL_ERROR('Error al asignar proyecto a la tarea');
    }
  }
}

export const tasksService = new TasksService();
