const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs   = require('fs')

const isDev = process.env.NODE_ENV === 'development'

// Auto-updater — only in packaged app
let autoUpdater = null
if (!isDev) {
  try { autoUpdater = require('electron-updater').autoUpdater } catch (e) {}
}

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0a0a12',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.once('ready-to-show', () => { mainWindow.maximize(); mainWindow.show() })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function setupAutoUpdater() {
  if (!autoUpdater) return

  autoUpdater.autoDownload    = true   // download in background
  autoUpdater.autoInstallOnAppQuit = true  // install when user quits

  autoUpdater.on('checking-for-update',  () => sendUpdate('checking'))
  autoUpdater.on('update-not-available', () => sendUpdate('not-available'))
  autoUpdater.on('update-available',     (info) => sendUpdate('available', info))
  autoUpdater.on('download-progress',    (p)    => sendUpdate('progress', { percent: Math.round(p.percent) }))
  autoUpdater.on('update-downloaded',    (info) => sendUpdate('downloaded', info))
  autoUpdater.on('error',                (err)  => sendUpdate('error', { message: err.message }))

  // Check 5 seconds after launch, then every 4 hours
  setTimeout(() => autoUpdater.checkForUpdates(), 5000)
  setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000)
}

function sendUpdate(event, data = {}) {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('updater', { event, ...data })
  }
}

// IPC: renderer can trigger install
ipcMain.handle('updater-install', () => {
  if (autoUpdater) autoUpdater.quitAndInstall()
})

// ── File system handlers ─────────────────────────────────────────

ipcMain.handle('load-icons', async () => {
  const results = []
  const scan = (baseDir) => {
    if (!fs.existsSync(baseDir)) return
    const entries = fs.readdirSync(baseDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const catDir = path.join(baseDir, entry.name)
        const files  = fs.readdirSync(catDir).filter(f => f.endsWith('.svg'))
        for (const file of files) {
          const content = fs.readFileSync(path.join(catDir, file), 'utf8')
          results.push({ category: entry.name, name: file.replace('.svg', ''), content })
        }
      }
    }
  }
  const builtinDir = isDev
    ? path.join(__dirname, '../public/icons')
    : path.join(process.resourcesPath, 'icons')
  scan(builtinDir)
  scan(path.join(app.getPath('documents'), 'BandWire', 'icons'))
  return results
})

ipcMain.handle('open-icons-folder', async () => {
  const userDir = path.join(app.getPath('documents'), 'BandWire', 'icons')
  fs.mkdirSync(userDir, { recursive: true })
  shell.openPath(userDir)
})

ipcMain.handle('save-project', async (_, content, filePath) => {
  let savePath = filePath
  if (!savePath) {
    const result = await dialog.showSaveDialog({
      title: 'Save Project',
      defaultPath: path.join(app.getPath('documents'), 'untitled.sflow'),
      filters: [{ name: 'BandWire Project', extensions: ['sflow'] }],
    })
    if (result.canceled) return null
    savePath = result.filePath
  }
  fs.writeFileSync(savePath, content, 'utf8')
  return savePath
})

ipcMain.handle('load-project', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Project',
    filters: [{ name: 'BandWire Project', extensions: ['sflow'] }],
    properties: ['openFile'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  const content = fs.readFileSync(result.filePaths[0], 'utf8')
  return { content, filePath: result.filePaths[0] }
})

ipcMain.handle('export-image', async (_, content, options) => {
  const fmt = options.format || 'png'
  const filters = {
    png:  [{ name: 'PNG Image',   extensions: ['png']  }],
    html: [{ name: 'HTML Export', extensions: ['html'] }],
    svg:  [{ name: 'SVG Image',   extensions: ['svg']  }],
  }
  const defaults = { png: 'signal-flow.png', html: 'bandwire-export.html', svg: 'signal-flow.svg' }
  const result = await dialog.showSaveDialog({
    title: 'Export Diagram',
    defaultPath: path.join(app.getPath('documents'), defaults[fmt] || 'bandwire-export.html'),
    filters: filters[fmt] || filters.html,
  })
  if (result.canceled) return false
  if (fmt === 'png') {
    const base64 = content.replace(/^data:image\/png;base64,/, '')
    fs.writeFileSync(result.filePath, Buffer.from(base64, 'base64'))
  } else {
    fs.writeFileSync(result.filePath, content, 'utf8')
  }
  shell.showItemInFolder(result.filePath)
  return true
})

ipcMain.handle('save-device-library', async (_, content) => {
  const p = path.join(app.getPath('documents'), 'BandWire', 'custom-devices.json')
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content, 'utf8')
  return true
})

ipcMain.handle('load-device-library', async () => {
  const p = path.join(app.getPath('documents'), 'BandWire', 'custom-devices.json')
  if (!fs.existsSync(p)) return null
  return fs.readFileSync(p, 'utf8')
})

ipcMain.handle('read-svg-file', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select SVG Icon',
    filters: [{ name: 'SVG', extensions: ['svg'] }],
    properties: ['openFile'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  return fs.readFileSync(result.filePaths[0], 'utf8')
})

ipcMain.handle('save-settings', async (_, content) => {
  const p = path.join(app.getPath('documents'), 'BandWire', 'settings.json')
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content, 'utf8')
  return true
})

ipcMain.handle('load-settings', async () => {
  const p = path.join(app.getPath('documents'), 'BandWire', 'settings.json')
  if (!fs.existsSync(p)) return null
  return fs.readFileSync(p, 'utf8')
})

app.whenReady().then(() => {
  createWindow()
  setupAutoUpdater()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
