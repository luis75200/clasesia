import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import {
  archiveProjectHandler,
  createProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  restoreProjectHandler,
  updateProjectHandler,
} from '../modules/projects/projects.controller.js'

const router = Router()

router.get('/', authMiddleware, asyncHandler(listProjectsHandler))
router.get('/:id', authMiddleware, asyncHandler(getProjectHandler))
router.post('/', authMiddleware, asyncHandler(createProjectHandler))
router.patch('/:id', authMiddleware, asyncHandler(updateProjectHandler))
router.post('/:id/archive', authMiddleware, asyncHandler(archiveProjectHandler))
router.post('/:id/restore', authMiddleware, asyncHandler(restoreProjectHandler))

export default router
