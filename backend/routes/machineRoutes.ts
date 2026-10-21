import { Router } from 'express'
import { OPCUAMachineService } from '../drivers/delta/opcuaMachineService.js'
import { MtConnectMachineService } from '../drivers/qgrind/mtConnectMachineService.js'
import { machinePaths } from '../paths/machinePaths.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createMachineRoutes(
  delta: OPCUAMachineService,
  qgrind: MtConnectMachineService,
): Router {
  const router = Router()

  router.post(machinePaths.delta.connect, async (request, response) => {
    const body: unknown = request.body
    const input = isRecord(body) ? body : {}
    const result = await delta.connect(input.ip, input.port)
    response.status(result.success ? 200 : 502).json(result)
  })

  router.post(machinePaths.delta.disconnect, async (_request, response) => {
    try {
      await delta.disconnect()
      response.json({ success: true })
    } catch (error) {
      response.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  })

  router.post(machinePaths.delta.read, async (_request, response) => {
    const result = await delta.readData()
    response.status(result.success ? 200 : 502).json(result)
  })

  router.post(machinePaths.delta.write, async (request, response) => {
    const result = await delta.writeData(request.body)
    response.status(result.success ? 200 : 502).json(result)
  })

  router.post(machinePaths.qgrind.agent, (request, response) => {
    const body: unknown = request.body
    const input = isRecord(body) ? body : {}
    const result = qgrind.setAgentAddress(input.manualIpSetup)
    response.status(result.success ? 200 : 400).json(result)
  })

  router.get(machinePaths.qgrind.status, async (_request, response) => {
    const result = await qgrind.readStatus()
    response.status(result.success ? 200 : 502).json(result)
  })

  return router
}
