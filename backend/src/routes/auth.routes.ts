import { Router } from 'express'
import { asyncHandler } from '../middlewares/error.middleware.js'
import { loginHandler, logoutHandler, sessionHandler } from '../modules/auth/auth.controller.js'

const router = Router()

router.post('/login', asyncHandler(loginHandler))
router.get('/session', asyncHandler(sessionHandler))
router.post('/logout', asyncHandler(logoutHandler))

export default router
