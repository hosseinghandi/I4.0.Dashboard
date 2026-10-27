import express, { type ErrorRequestHandler } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { OPCUAMachineService } from './backend/drivers/delta/opcuaMachineService.js'
import { MtConnectMachineService } from './backend/drivers/qgrind/mtConnectMachineService.js'
import { machinePaths } from './backend/paths/machinePaths.js'
import { openDatabase } from './backend/db/database.js'
import { createProductionArticleRoutes } from './backend/routes/productionArticleRoutes.js'
import { createDeltaAdapter } from './backend/tracking/adapters/deltaAdapter.js'
import { createQGrindAdapter } from './backend/tracking/adapters/qgrindAdapter.js'
import { ProductionTracker } from './backend/tracking/productionTracker.js'
import { createMachineRoutes } from './backend/routes/machineRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = 3000
const isProd = process.env.NODE_ENV === 'production'
const dataDirectory = process.env.DASHBOARD_DATA_DIR
  ? path.resolve(process.env.DASHBOARD_DATA_DIR)
  : path.join(__dirname, 'data')

export async function createFullApp() {
  const app = express()
  const delta = new OPCUAMachineService()
  const qgrind = new MtConnectMachineService()
  const database = openDatabase(dataDirectory)
  const tracker = new ProductionTracker(database, [createDeltaAdapter(delta), createQGrindAdapter(qgrind)])

  app.disable('x-powered-by')
  app.use(express.json({ limit: '16kb' }))

  // Health endpoint
  app.get(machinePaths.health, (_request, response) => {
    response.json({ running: true, service: 'ocima-dashboard-backend' })
  })

  // Machine & Production Article API routes
  app.use(createMachineRoutes(delta, qgrind))
  app.use(createProductionArticleRoutes(database))

  // In development, mount Vite's dev server middleware
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    // In production, serve built static files
    const distPath = path.resolve(__dirname, 'dist')
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath))
      app.get(/^(?!\/api\/).*/, (_request, response) => {
        response.sendFile(path.join(distPath, 'index.html'))
      })
    }
  }

  // 404 for unhandled API calls
  app.use('/api', (_request, response) => {
    response.status(404).json({ message: 'Endpoint non trovato.' })
  })

  // Global error handler
  const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
    console.error('Dashboard backend request failed:', error)
    if (response.headersSent) {
      next(error)
      return
    }
    const status = error instanceof SyntaxError ? 400 : 500
    response.status(status).json({
      success: false,
      message:
        error instanceof SyntaxError
          ? 'Il corpo della richiesta deve essere JSON valido.'
          : 'Errore interno del server.',
    })
  }
  app.use(errorHandler)

  return { app, delta, database, tracker }
}

export async function startServer() {
  const { app, delta, database, tracker } = await createFullApp()
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const instance = app.listen(port, '0.0.0.0', () => resolve(instance))
    instance.once('error', reject)
  })

  console.log(`OCIMA Dashboard in ascolto su http://0.0.0.0:${port}`)
  tracker.start()

  const close = async () => {
    tracker.stop()
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await delta.disconnect()
    database.close()
  }

  const shutdown = () => {
    void close().catch((error: unknown) => {
      console.error('Could not stop server cleanly:', error)
      process.exitCode = 1
    })
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)

  return { server, close }
}

const isEntry = process.argv[1] && (
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  process.argv[1].endsWith('server.ts')
)

if (isEntry) {
  void startServer()
}
