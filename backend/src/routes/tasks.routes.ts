import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import {
	assignTaskProjectHandler,
	createTaskHandler,
	listTasksHandler,
} from '../modules/tasks/tasks.controller.js';

const router = Router();

router.get('/', asyncHandler(listTasksHandler));
router.post('/', authMiddleware, asyncHandler(createTaskHandler));
router.post('/:id/assign-project', authMiddleware, asyncHandler(assignTaskProjectHandler));

export default router;
