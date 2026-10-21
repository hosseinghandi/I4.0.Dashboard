import { app, BrowserWindow, dialog } from 'electron'
import { spawn } from 'node:child_process'
import path from 'node:path'

const backendUrl = 'http://127.0.0.1:3000'
const devServerUrl = 'http://127.0.0.1:5173'
let mainWindow
let devServer
let backendServer
let serverError

function spawnNodeScript(scriptPath, args, extraEnv = {}) {
  return spawn(process.execPath, [scriptPath, ...args], {
    cwd: app.getAppPath(),
    stdio: 'ignore',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', ...extraEnv },
  })
}

function startBackend(production) {
  if (backendServer && backendServer.exitCode === null) return
  const backendEntry = path.join(app.getAppPath(), 'backend-dist', 'server.js')
  backendServer = spawnNodeScript(backendEntry, [], production
    ? { DASHBOARD_STATIC_DIR: 'dist' }
    : {})
  backendServer.on('error', (error) => {
    serverError = error
  })
}

function startDevServer() {
  if (devServer && devServer.exitCode === null) return
  const viteEntry = path.join(app.getAppPath(), 'node_modules', 'vite', 'bin', 'vite.js')
  devServer = spawnNodeScript(viteEntry, ['--host', '127.0.0.1', '--port', '5173', '--strictPort'])
  devServer.on('error', (error) => {
    serverError = error
  })
}

async function waitForServer(url, child, serverName) {
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    if (serverError) throw serverError
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error(`${serverName} exited before it was ready (code ${child.exitCode}).`)
    }

    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }

  throw new Error(`${serverName} did not start within 30 seconds.`)
}

function openWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#f5f7f5',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  return mainWindow.loadURL(url)
}

async function createWindow() {
  const production = app.isPackaged || process.argv.includes('--production')
  serverError = undefined
  startBackend(production)
  await waitForServer(`${backendUrl}/health`, backendServer, 'Backend')
  if (production) return openWindow(backendUrl)

  startDevServer()
  await waitForServer(devServerUrl, devServer, 'Vite')
  return openWindow(devServerUrl)
}

app.whenReady()
  .then(createWindow)
  .catch((error) => {
    dialog.showErrorBox('OCIMA Dashboard could not start', error.message)
    app.quit()
  })

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((error) => {
      dialog.showErrorBox('OCIMA Dashboard could not start', error.message)
      app.quit()
    })
  }
})

app.on('before-quit', () => {
  for (const server of [devServer, backendServer]) {
    if (server && server.exitCode === null) server.kill()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
