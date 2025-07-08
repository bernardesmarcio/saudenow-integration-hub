import { NextApiRequest, NextApiResponse } from 'next'
import {
  asyncHandler,
  sendSuccess,
  sendCreated,
  ValidationError,
  validateMethod,
  validateContentType,
  composeMiddleware,
} from '../../../../../../lib/middleware/errorMiddleware'
import {
  getCorsMiddleware,
  requestLogger,
} from '../../../../../../lib/middleware/corsMiddleware'
import { z } from 'zod'

// Validation schemas
const syncRequestSchema = z.object({
  store_id: z.string().min(1, 'Store ID é obrigatório'),
  type: z
    .enum(['full_sync', 'incremental_sync', 'stock_sync', 'product_sync'])
    .default('incremental_sync'),
  force: z.boolean().default(false),
  batch_size: z.number().min(10).max(500).default(100),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
})

const syncStatusSchema = z.object({
  store_id: z.string().min(1, 'Store ID é obrigatório'),
})

/**
 * @swagger
 * /api/v1/retail-pro/stores/{store_id}/sync:
 *   get:
 *     summary: Consultar status de sincronização
 *     description: Retorna o status atual da sincronização de uma loja Retail Pro
 *     tags: [Retail Pro]
 *     parameters:
 *       - in: path
 *         name: store_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da loja (ex: resende)
 *     responses:
 *       200:
 *         description: Status de sincronização retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         store_sid:
 *                           type: string
 *                         status:
 *                           type: string
 *                           enum: [idle, syncing, error, completed]
 *                         last_product_sync:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         last_stock_sync:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         products_synced:
 *                           type: integer
 *                         stock_synced:
 *                           type: integer
 *                         errors:
 *                           type: integer
 *                         current_job:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: string
 *                             type:
 *                               type: string
 *                             progress:
 *                               type: number
 *                             started_at:
 *                               type: string
 *                               format: date-time
 *             example:
 *               success: true
 *               data:
 *                 store_sid: "621769196001438846"
 *                 status: "completed"
 *                 last_product_sync: "2024-01-15T10:30:00Z"
 *                 last_stock_sync: "2024-01-15T11:45:00Z"
 *                 products_synced: 29875
 *                 stock_synced: 29875
 *                 errors: 12
 *                 current_job: null
 *   post:
 *     summary: Iniciar sincronização
 *     description: Inicia uma nova sincronização de uma loja Retail Pro
 *     tags: [Retail Pro]
 *     parameters:
 *       - in: path
 *         name: store_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da loja (ex: resende)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [full_sync, incremental_sync, stock_sync, product_sync]
 *                 default: incremental_sync
 *                 description: Tipo de sincronização
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: Forçar sincronização mesmo se outra estiver em andamento
 *               batch_size:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 500
 *                 default: 100
 *                 description: Tamanho do lote para processamento
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *                 description: Prioridade da sincronização
 *           example:
 *             type: "incremental_sync"
 *             force: false
 *             batch_size: 100
 *             priority: "medium"
 *     responses:
 *       201:
 *         description: Sincronização iniciada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         job_id:
 *                           type: string
 *                         type:
 *                           type: string
 *                         status:
 *                           type: string
 *                         priority:
 *                           type: string
 *                         estimated_duration:
 *                           type: string
 *                         message:
 *                           type: string
 *             example:
 *               success: true
 *               data:
 *                 job_id: "retail-pro-sync-1234567890"
 *                 type: "incremental_sync"
 *                 status: "queued"
 *                 priority: "medium"
 *                 estimated_duration: "5-10 minutes"
 *                 message: "Sincronização incremental iniciada para loja Resende"
 *       400:
 *         $ref: '#/components/responses/400'
 *       409:
 *         description: Sincronização já em andamento
 *       500:
 *         $ref: '#/components/responses/500'
 */

const corsMiddleware = getCorsMiddleware()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply CORS
  corsMiddleware(req, res, () => {})

  // Apply request logging
  requestLogger(req, res, () => {})

  // Validate HTTP method
  validateMethod(['GET', 'POST'])(req, res, () => {})

  if (req.method === 'GET') {
    return await handleGetSyncStatus(req, res)
  } else if (req.method === 'POST') {
    return await handleStartSync(req, res)
  }
}

async function handleGetSyncStatus(req: NextApiRequest, res: NextApiResponse) {
  // Validate parameters
  const validation = syncStatusSchema.safeParse({
    store_id: req.query.store_id,
  })

  if (!validation.success) {
    throw new ValidationError('Parâmetros inválidos', validation.error.errors.map(e => e.message))
  }

  const { store_id } = validation.data

  // Validate store exists
  const supportedStores = ['resende']
  if (!supportedStores.includes(store_id)) {
    throw new ValidationError(`Loja '${store_id}' não encontrada`)
  }

  try {
    // Mock sync status - in real implementation this would query the RetailProService
    const mockSyncStatus = {
      store_sid: '621769196001438846',
      status: 'completed',
      last_product_sync: new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ).toISOString(), // 2 hours ago
      last_stock_sync: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      products_synced: 29875,
      stock_synced: 29875,
      errors: 12,
      current_job: null,
      health_check: {
        status: 'healthy',
        last_check: new Date().toISOString(),
        response_time: 145,
      },
    }

    sendSuccess(res, mockSyncStatus)
  } catch (error) {
    throw new Error(
      `Erro ao consultar status de sincronização da loja ${store_id}: ${(error as Error).message}`
    )
  }
}

async function handleStartSync(req: NextApiRequest, res: NextApiResponse) {
  // Validate content type for POST requests
  validateContentType(req, res, () => {})

  // Validate parameters and body
  const validation = syncRequestSchema.safeParse({
    store_id: req.query.store_id,
    ...req.body,
  })

  if (!validation.success) {
    throw new ValidationError('Parâmetros inválidos', validation.error.errors.map(e => e.message))
  }

  const { store_id, type, force, batch_size, priority } = validation.data

  // Validate store exists
  const supportedStores = ['resende']
  if (!supportedStores.includes(store_id)) {
    throw new ValidationError(`Loja '${store_id}' não encontrada`)
  }

  try {
    // Check if sync is already running (unless force is true)
    if (!force) {
      // This would check the actual sync status in real implementation
      const isRunning = false // Mock check
      if (isRunning) {
        res.status(409).json({
          success: false,
          error:
            'Sincronização já em andamento. Use force=true para forçar nova sincronização.',
        })
        return
      }
    }

    // Generate job ID
    const jobId = `retail-pro-sync-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // In real implementation, this would queue the job using RetailProWorker
    const jobData = {
      job_id: jobId,
      type,
      status: 'queued',
      priority,
      store_sid: '621769196001438846',
      options: {
        batch_size,
        force,
      },
      estimated_duration: getEstimatedDuration(type),
      message: `Sincronização ${type} iniciada para loja ${getStoreName(store_id)}`,
      created_at: new Date().toISOString(),
    }

    sendCreated(res, jobData, `Sincronização ${type} iniciada com sucesso`)
  } catch (error) {
    throw new Error(
      `Erro ao iniciar sincronização da loja ${store_id}: ${(error as Error).message}`
    )
  }
}

// Helper functions
function getEstimatedDuration(type: string): string {
  switch (type) {
    case 'full_sync':
      return '30-60 minutes'
    case 'incremental_sync':
      return '5-15 minutes'
    case 'stock_sync':
      return '5-10 minutes'
    case 'product_sync':
      return '10-20 minutes'
    default:
      return '5-15 minutes'
  }
}

function getStoreName(storeId: string): string {
  const storeNames: Record<string, string> = {
    resende: 'Resende',
  }
  return storeNames[storeId] || storeId
}

export default asyncHandler(handler)
