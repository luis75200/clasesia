import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import { exportMetricsCsvHandler, getMetricsSummaryHandler } from '../modules/metrics/metrics.controller.js'

const router = Router()

router.get('/summary', authMiddleware, asyncHandler(getMetricsSummaryHandler))
router.get('/export.csv', authMiddleware, asyncHandler(exportMetricsCsvHandler))

export default router
