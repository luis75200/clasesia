import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import { archiveCommentHandler, createCommentHandler, listCommentsHandler } from '../modules/comments/comments.controller.js'

const router = Router()

router.get('/', authMiddleware, asyncHandler(listCommentsHandler))
router.post('/', authMiddleware, asyncHandler(createCommentHandler))
router.post('/:id/archive', authMiddleware, asyncHandler(archiveCommentHandler))

export default router
