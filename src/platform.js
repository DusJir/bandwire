/**
 * Platform abstraction layer.
 * Provides a unified API for both Electron and PWA/browser environments.
 * Components and store should never call window.electronAPI directly.
 */

const isElectron = () => !!window.electronAPI

// ── IndexedDB helpers (PWA storage) ─────────────────────────────
const DB_NAME    = 'bandwire'
const DB_VERSION = 2

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv')
      }
      if (!db.objectStoreNames.contains('library')) {
        const store = db.createObjectStore('library', { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

// ── Library CRUD ────────────────────────────────────────────────
async function libGetAll() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('library', 'readonly')
    const req = tx.objectStore('library').index('updatedAt').getAll()
    req.onsuccess = () => resolve([...req.result].reverse()) // newest first
    req.onerror   = () => reject(req.error)
  })
}

async function libGet(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('library', 'readonly')
    const req = tx.objectStore('library').get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror   = () => reject(req.error)
  })
}

async function libPut(entry) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('library', 'readwrite')
    const req = tx.objectStore('library').put(entry)
    req.onsuccess = () => resolve(entry)
    req.onerror   = () => reject(req.error)
  })
}

async function libDelete(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('library', 'readwrite')
    const req = tx.objectStore('library').delete(id)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

async function dbGet(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('kv', 'readonly')
    const req = tx.objectStore('kv').get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function dbSet(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('kv', 'readwrite')
    const req = tx.objectStore('kv').put(value, key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ── File picker helpers ──────────────────────────────────────────
function downloadFile(content, filename, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function pickFile(accept) {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type   = 'file'
    input.accept = accept
    input.onchange = () => resolve(input.files[0] || null)
    input.click()
  })
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

// ── PWA icon scanning ────────────────────────────────────────────
// In PWA mode, icons are bundled under /icons/. We scan a known
// manifest JSON that lists all icons.
async function loadIconsFromManifest() {
  try {
    const resp = await fetch('./icon-manifest.json')
    if (!resp.ok) return []
    const entries = await resp.json()
    // Fetch SVG content for each icon (PWA needs content, not just path)
    const results = await Promise.all(entries.map(async entry => {
      try {
        const r = await fetch('./' + entry.path)
        const content = r.ok ? await r.text() : ''
        return { ...entry, content }
      } catch {
        return { ...entry, content: '' }
      }
    }))
    return results.filter(e => e.content)
  } catch {
    return []
  }
}

// ── Platform API ─────────────────────────────────────────────────
export const platform = {

  // Load SVG icons from disk (Electron) or fetch from /icons/ (PWA)
  loadIcons: async () => {
    if (isElectron()) return window.electronAPI.loadIcons()

    // PWA: fetch icon-manifest.json listing all bundled icons
    const entries = await loadIconsFromManifest()
    return entries // [{ category, name, content }]
  },

  openIconsFolder: () => {
    if (isElectron()) return window.electronAPI.openIconsFolder()
    // PWA: no filesystem access — show info toast instead
    alert('In the browser version, add your SVG icons to the app folder before building.\nCustom icons can be added via the device library.')
  },

  // Project save/load
  saveProject: async (content, currentFilePath) => {
    if (isElectron()) return window.electronAPI.saveProject(content, currentFilePath)
    // PWA: save to IndexedDB + offer download
    const name = 'bandwire-project'
    await dbSet('current-project', content)
    await dbSet('current-project-name', name)
    downloadFile(content, name + '.sflow', 'application/json')
    return name + '.sflow'
  },

  loadProject: async () => {
    if (isElectron()) return window.electronAPI.loadProject()
    // PWA: open file picker
    const file = await pickFile('.sflow,.json')
    if (!file) return null
    const content = await readFileAsText(file)
    return { content, filePath: file.name }
  },

  // Auto-save to IndexedDB (PWA only — Electron uses the file path)
  autoSave: async (content) => {
    if (!isElectron()) {
      await dbSet('autosave', content)
    }
  },

  loadAutoSave: async () => {
    if (isElectron()) return null
    return await dbGet('autosave') || null
  },

  // Device library
  saveDeviceLibrary: async (content) => {
    if (isElectron()) return window.electronAPI.saveDeviceLibrary(content)
    await dbSet('device-library', content)
    return true
  },

  loadDeviceLibrary: async () => {
    if (isElectron()) return window.electronAPI.loadDeviceLibrary()
    return await dbGet('device-library') || null
  },

  // SVG file picker for custom device icons
  readSvgFile: async () => {
    if (isElectron()) return window.electronAPI.readSvgFile()
    const file = await pickFile('.svg,image/svg+xml')
    if (!file) return null
    return await readFileAsText(file)
  },

  // Export
  exportImage: async (dataUrl, opts) => {
    if (isElectron()) return window.electronAPI.exportImage(dataUrl, opts)
    // PWA: direct download
    const ext  = opts?.format === 'svg' ? 'svg' : 'html'
    downloadFile(dataUrl, 'bandwire-export.' + ext, ext === 'html' ? 'text/html' : 'image/svg+xml')
    return true
  },

  // Settings persistence
  saveSettings: async (content) => {
    if (isElectron()) return window.electronAPI.saveSettings(content)
    await dbSet('settings', content)
    return true
  },

  loadSettings: async () => {
    if (isElectron()) return window.electronAPI.loadSettings()
    return await dbGet('settings') || null
  },

  // ── Project Library ─────────────────────────────────────────
  // IndexedDB is used for library in BOTH Electron and PWA.
  // Electron renderer has full IndexedDB access — no IPC needed.
  // Electron gets extra exportFile/importFile via file system.
  library: {
    getAll:  async ()      => await libGetAll(),
    get:     async (id)    => await libGet(id),
    put:     async (entry) => await libPut(entry),
    delete:  async (id)    => await libDelete(id),

    // Export entry data to .sflow file (works in both, Electron uses native save)
    exportFile: async (entry) => {
      const data     = entry.data
      const filename = (entry.filename || 'project').replace(/\.sflow$/i, '') + '.sflow'
      if (isElectron()) return window.electronAPI.saveProject(data, null)
      downloadFile(data, filename, 'application/json')
      return true
    },

    // Import .sflow file from disk into library
    importFile: async () => {
      const file = await pickFile('.sflow,.json')
      if (!file) return null
      const content = await readFileAsText(file)
      return { content, filename: file.name }
    },
  },

  // Feature flags
  isElectron: isElectron,
  isPWA: () => !isElectron() && 'serviceWorker' in navigator,
  isBrowser: () => !isElectron(),
}
