import express, { type ErrorRequestHandler } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { OPCUAMachineService } from './drivers/delta/opcuaMachineService.js'
import { MtConnectMachineService } from './drivers/qgrind/mtConnectMachineService.js'
import { machinePaths } from './paths/machinePaths.js'
import { createMachineRoutes } from './routes/machineRoutes.js'

const backendDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(backendDirectory, '..')
const staticDirectory = process.env.DASHBOARD_STATIC_DIR
  ? path.resolve(projectDirectory, process.env.DASHBOARD_STATIC_DIR)
  : null

export function createApp() {
  const app = express()
  const delta = new OPCUAMachineService()
  const qgrind = new MtConnectMachineService()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '16kb' }))
  app.get(machinePaths.health, (_request, response) => {
    response.json({ running: true, service: 'ocima-dashboard-backend' })
  })
  app.use(createMachineRoutes(delta, qgrind))

  if (staticDirectory) {
    if (!fs.existsSync(path.join(staticDirectory, 'index.html'))) {
      throw new Error(`Dashboard build directory does not exist: ${staticDirectory}`)
    }
    app.use(express.static(staticDirectory))
    app.get(/^(?!\/api\/).*/, (_request, response) => {
      response.sendFile(path.join(staticDirectory, 'index.html'))
    })
  }

  app.use((_request, response) => {
    response.status(404).json({ message: 'Endpoint non trovato.' })
  })

  const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
    console.error('Dashboard backend request failed:', error)
    if (response.headersSent) {
      next(error)
      return
    }
    const status = error instanceof SyntaxError ? 400 : 500
    response.status(status).json({
      success: false,
      message: error instanceof SyntaxError ? 'Il corpo della richiesta deve essere JSON valido.' : 'Errore interno del server.',
    })
  }
  app.use(errorHandler)

  return { app, delta }
}

export async function startServer() {
  const { app, delta } = createApp()
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const instance = app.listen(3000, '127.0.0.1', () => resolve(instance))
    instance.once('error', reject)
  })
  console.log('OCIMA backend in ascolto su http://127.0.0.1:3000')
  if (staticDirectory) console.log(`Dashboard servita da ${staticDirectory}`)

  return {
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
      await delta.disconnect()
    },
  }
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(path.resolve(entryPath)).href) {
  void startServer()
    .then((server) => {
      const shutdown = () => {
        void server.close().catch((error: unknown) => {
          console.error('Could not stop the backend cleanly:', error)
          process.exitCode = 1
        })
      }
      process.once('SIGINT', shutdown)
      process.once('SIGTERM', shutdown)
    })
    .catch((error: unknown) => {
      console.error('Could not start the backend:', error)
      process.exitCode = 1
    })
}
