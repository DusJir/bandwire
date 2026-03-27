const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
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
  win.once('ready-to-show', () => { win.maximize(); win.show() })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

ipcMain.handle('load-icons', async () => {
  const results = []
  const scan = (baseDir) => {
    if (!fs.existsSync(baseDir)) return
    const entries = fs.readdirSync(baseDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const catDir = path.join(baseDir, entry.name)
        const files = fs.readdirSync(catDir).filter(f => f.endsWith('.svg'))
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
  const userDir = path.join(app.getPath('documents'), 'BandWire', 'icons')
  scan(userDir)
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
      filters: [{ name: 'BandWire Project', extensions: ['sflow'] }, { name: 'All Files', extensions: ['*'] }],
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
    filters: [{ name: 'BandWire Project', extensions: ['sflow'] }, { name: 'All Files', extensions: ['*'] }],
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
  const defaultNames = { png: 'signal-flow.png', html: 'bandwire-export.html', svg: 'signal-flow.svg' }
  const result = await dialog.showSaveDialog({
    title: 'Export Diagram',
    defaultPath: path.join(app.getPath('documents'), defaultNames[fmt] || 'bandwire-export.html'),
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

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
