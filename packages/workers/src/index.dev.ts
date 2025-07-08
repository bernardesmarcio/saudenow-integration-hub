// Development mode - Mock workers for frontend testing
import express from 'express'
import { logger } from './lib/logger'

const app = express()
const PORT = 4000

// Basic Bull Dashboard mock endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Bull Dashboard - Development Mode</title></head>
      <body style="font-family: Arial; padding: 20px; background: #f5f5f5;">
        <h1>🎯 Bull Dashboard - Development Mode</h1>
        <p><strong>Status:</strong> <span style="color: green;">Mock Active</span></p>
        <p><strong>Redis:</strong> <span style="color: green;">Connected</span></p>
        <p><strong>Queues:</strong> retail-pro-integration (0 jobs)</p>
        <hr>
        <p><em>This is a development mock. Workers are simulated for frontend testing.</em></p>
        <p><strong>To enable real workers:</strong> Fix Redis configuration in workers/src/config/redis.ts</p>
      </body>
    </html>
  `)
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    redis: 'connected',
    queues: {
      'retail-pro-integration': {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0
      }
    }
  })
})

app.listen(PORT, () => {
  logger.info(`🎯 Bull Dashboard Mock running on http://localhost:${PORT}`)
  logger.info(`📊 Health endpoint: http://localhost:${PORT}/api/health`)
  logger.info(`🔧 This is a development mock for frontend testing`)
})