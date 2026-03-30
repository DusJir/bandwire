import { create } from 'zustand'
import { platform } from '../platform'
import { FACTORY_DEVICE_META } from '../constants/factoryDeviceMeta'
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow'

// ── Scene helpers ────────────────────────────────────────────────
const emptyScene = (id = 'main', label = 'Main') => ({
  id, label,
  nodes: [], edges: [],
})

const useStore = create((set, get) => ({

  // ── Scenes (scene stack for rack drill-down) ─────────────────
  // scenes: { [sceneId]: { id, label, nodes, edges } }
  scenes: { main: emptyScene() },
  // sceneStack: array of sceneIds — last = current
  sceneStack: ['main'],

  currentSceneId: () => {
    const { sceneStack } = get()
    return sceneStack[sceneStack.length - 1]
  },

  currentScene: () => {
    const { scenes, sceneStack } = get()
    return scenes[sceneStack[sceneStack.length - 1]]
  },

  // Enter a rack's inner scene — sync port gateway nodes from rack data
  enterRackScene: (rackNodeId, rackLabel) => {
    const sceneId = 'rack-' + rackNodeId
    const state   = get()

    // Find rack node data to get its defined ports
    const mainScene = state.scenes.main
    let rackNode = null
    for (const scene of Object.values(state.scenes)) {
      const found = scene?.nodes?.find(n => n.id === rackNodeId)
      if (found) { rackNode = found; break }
    }

    const rackInputs  = rackNode?.data?.inputs  || []
    const rackOutputs = rackNode?.data?.outputs || []

    set(prevState => {
      const scenes = { ...prevState.scenes }
      if (!scenes[sceneId]) scenes[sceneId] = emptyScene(sceneId, rackLabel || 'Rack')

      // Build port gateway nodes — preserve existing non-port nodes
      const existingScene = scenes[sceneId]
      const existingNonPortNodes = (existingScene.nodes || []).filter(n => n.type !== 'rackPort')
      const existingEdges = existingScene.edges || []

      // Create port gateway nodes arranged on left (IN) and right (OUT) sides
      const portNodes = []

      rackInputs.forEach((port, i) => {
        portNodes.push({
          id: 'rackport-in-' + rackNodeId + '-' + i,
          type: 'rackPort',
          position: { x: 60, y: 80 + i * 80 },
          draggable: true,
          data: {
            label: port.label || ('In ' + (i + 1)),
            connector: port.connector || '',
            direction: 'in',
            portIndex: i,
            rackNodeId,
          },
        })
      })

      rackOutputs.forEach((port, i) => {
        portNodes.push({
          id: 'rackport-out-' + rackNodeId + '-' + i,
          type: 'rackPort',
          position: { x: 600, y: 80 + i * 80 },
          draggable: true,
          data: {
            label: port.label || ('Out ' + (i + 1)),
            connector: port.connector || '',
            direction: 'out',
            portIndex: i,
            rackNodeId,
          },
        })
      })

      scenes[sceneId] = {
        ...existingScene,
        nodes: [...portNodes, ...existingNonPortNodes],
        edges: existingEdges,
      }

      return { scenes, sceneStack: [...prevState.sceneStack, sceneId] }
    })
  },

  exitScene: () => {
    set(state => {
      if (state.sceneStack.length <= 1) return {}
      return { sceneStack: state.sceneStack.slice(0, -1) }
    })
  },

  navigateToScene: (idx) => {
    set(state => ({ sceneStack: state.sceneStack.slice(0, idx + 1) }))
  },

  // ── Scene-scoped flow ops ────────────────────────────────────
  _sceneId: () => get().sceneStack[get().sceneStack.length - 1],

  _updateScene: (fn) => {
    set(state => {
      const id = state.sceneStack[state.sceneStack.length - 1]
      return {
        scenes: { ...state.scenes, [id]: fn(state.scenes[id]) },
        isDirty: true,
      }
    })
    // Auto-save in PWA mode
    const s = get()
    if (platform.isBrowser()) {
      const { scenes, projectName, deviceLibrary } = s
      platform.autoSave(JSON.stringify({ version: '0.5.1', projectName, scenes, deviceLibrary }, null, 2))
    }
  },

  get nodes() { return get().currentScene()?.nodes || [] },
  get edges() { return get().currentScene()?.edges || [] },

  onNodesChange: (changes) => get()._updateScene(s => ({
    ...s, nodes: applyNodeChanges(changes, s.nodes)
  })),

  onEdgesChange: (changes) => get()._updateScene(s => ({
    ...s, edges: applyEdgeChanges(changes, s.edges)
  })),

  setNodes: (fn) => get()._updateScene(s => ({
    ...s, nodes: typeof fn === 'function' ? fn(s.nodes) : fn
  })),

  setEdges: (fn) => get()._updateScene(s => ({
    ...s, edges: typeof fn === 'function' ? fn(s.edges) : fn
  })),

  addEdgeToScene: (params, cableType) => get()._updateScene(s => ({
    ...s,
    edges: addEdge({
      ...params,
      id: 'edge-' + crypto.randomUUID(),
      type: 'cable',
      data: { cableType, label: '' },
    }, s.edges)
  })),

  updateNodeData: (id, updates) => get()._updateScene(s => ({
    ...s,
    nodes: s.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...updates } } : n)
  })),

  updateEdgeData: (id, updates) => get()._updateScene(s => ({
    ...s,
    edges: s.edges.map(e =>
      e.id === id ? { ...e, ...updates, data: { ...e.data, ...(updates.data || {}) } } : e
    )
  })),

  deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId } = get()
    get()._updateScene(s => ({
      ...s,
      nodes: selectedNodeId ? s.nodes.filter(n => n.id !== selectedNodeId) : s.nodes,
      edges: selectedEdgeId
        ? s.edges.filter(e => e.id !== selectedEdgeId)
        : selectedNodeId
          ? s.edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId)
          : s.edges,
    }))
    set({ selectedNodeId: null, selectedEdgeId: null })
  },

  // ── Selection ────────────────────────────────────────────────
  selectedNodeId:  null,
  selectedEdgeId:  null,
  selectedCableType: 'XLR',
  setSelectedNode:  (id) => set({ selectedNodeId: id,   selectedEdgeId: null }),
  setSelectedEdge:  (id) => set({ selectedEdgeId: id,   selectedNodeId: null }),
  clearSelection:   ()   => set({ selectedNodeId: null, selectedEdgeId: null }),
  setSelectedCableType: (t) => set({ selectedCableType: t }),

  // ── Icons (SVG library from disk) ───────────────────────────
  iconsLibrary: {},

  loadIcons: async () => {
    const icons = await platform.loadIcons()
    const lib = {}
    for (const icon of icons) {
      if (!lib[icon.category]) lib[icon.category] = []
      // Use base64 data URI instead of blob URL — works with html-to-image in Electron
      const b64  = btoa(unescape(encodeURIComponent(icon.content)))
      const src  = 'data:image/svg+xml;base64,' + b64
      const key  = icon.category + '/' + icon.name
      const meta = FACTORY_DEVICE_META[key] || {}
      lib[icon.category].push({
        name:           icon.name,
        src:            src,
        tags:           meta.tags           || [icon.category],
        defaultInputs:  meta.defaultInputs  || [],
        defaultOutputs: meta.defaultOutputs || [],
        source:         'factory',
      })
    }
    set({ iconsLibrary: lib })
  },

  // ── Device library (custom devices) ─────────────────────────
  // device: { id, name, tags:[], source:'factory'|'custom',
  //           iconSrc, defaultInputs:[], defaultOutputs:[], notes }
  deviceLibrary: [],
  customCableTypes: [],  // user-defined cable types
  settings: {
    enforceConnectorTypes: false,  // warn when cable/connector mismatch
    defaultExportFormat: 'html',   // 'html' | 'png'
    defaultExportLegend: true,
    defaultExportColor:  true,
  },

  loadDeviceLibrary: async () => {
    if (!window.electronAPI) return
    const raw = await platform.loadDeviceLibrary()
    if (raw) set({ deviceLibrary: JSON.parse(raw) })
  },

  saveDeviceLibrary: async () => {
    const { deviceLibrary } = get()
    await platform.saveDeviceLibrary(JSON.stringify(deviceLibrary, null, 2))
  },

  // Custom cable types
  addCustomCableType: (cable) => {
    const c = { ...cable, id: cable.id || 'cable-' + crypto.randomUUID().slice(0,8), source: 'custom' }
    set(state => ({ customCableTypes: [...state.customCableTypes, c] }))
    get().saveDeviceLibrary()
  },
  deleteCustomCableType: (id) => {
    set(state => ({ customCableTypes: state.customCableTypes.filter(c => c.id !== id) }))
    get().saveDeviceLibrary()
  },

  // Settings
  updateSettings: (patch) => {
    set(state => ({ settings: { ...state.settings, ...patch } }))
    // Persist immediately — include theme alongside settings
    const updated = { ...get().settings, ...patch }
    const theme = get().theme
    platform.saveSettings(JSON.stringify({ ...updated, _theme: theme }, null, 2))
  },

  loadSettings: async () => {
    const raw = await platform.loadSettings()
    if (!raw) return
    try {
      const saved = JSON.parse(raw)
      const { _theme, ...settingsOnly } = saved
      set(state => ({ settings: { ...state.settings, ...settingsOnly } }))
      if (_theme) set({ theme: _theme })
    } catch {}
  },

  addCustomDevice: (device) => {
    const dev = { ...device, id: 'dev-' + crypto.randomUUID(), source: 'custom' }
    set(state => ({ deviceLibrary: [...state.deviceLibrary, dev] }))
    get().saveDeviceLibrary()
  },

  updateCustomDevice: (id, updates) => {
    set(state => ({
      deviceLibrary: state.deviceLibrary.map(d => d.id === id ? { ...d, ...updates } : d)
    }))
    get().saveDeviceLibrary()
  },

  deleteCustomDevice: (id) => {
    set(state => ({ deviceLibrary: state.deviceLibrary.filter(d => d.id !== id) }))
    get().saveDeviceLibrary()
  },

  // ── UI ───────────────────────────────────────────────────────
  theme: 'dark',
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: next })
    // Persist theme change immediately
    const settings = get().settings
    platform.saveSettings(JSON.stringify({ ...settings, _theme: next }, null, 2))
  },

  // Active modal: null | 'addDevice' | 'export' | 'manual'
  activeModal: null,
  modalPayload: null,
  openModal:  (name, payload) => set({ activeModal: name, modalPayload: payload || null }),
  closeModal: ()               => set({ activeModal: null, modalPayload: null }),

  // ── Project ──────────────────────────────────────────────────
  projectName:     'Untitled',
  currentFilePath: null,
  isDirty:         false,

  saveProject: async () => {
    const { scenes, projectName, currentFilePath, deviceLibrary } = get()
    // Strip iconSrc — always re-resolved from library on load
    const stripSrc = (sceneMap) => {
      const out = {}
      for (const [sid, scene] of Object.entries(sceneMap)) {
        out[sid] = {
          ...scene,
          nodes: (scene.nodes || []).map(n => {
            if (!n.data?.iconSrc) return n
            const { iconSrc, ...rest } = n.data
            return { ...n, data: rest }
          })
        }
      }
      return out
    }
    const content = JSON.stringify({
      version: '1.0', projectName, scenes: stripSrc(scenes), deviceLibrary, customCableTypes: get().customCableTypes
    }, null, 2)
    const fp = await platform.saveProject(content, currentFilePath)
    if (fp) {
      // Extract project name from file path (strip directory and .sflow extension)
      const name = fp.split(/[\\/]/).pop().replace(/\.sflow$/i, '') || projectName
      set({ currentFilePath: fp, isDirty: false, projectName: name })
    }
  },

  loadProject: async () => {
    const result = await platform.loadProject()
    if (!result) return
    const data = JSON.parse(result.content)
    // backward compat: old format had nodes/edges at top level
    let scenes = data.scenes
    if (!scenes) {
      scenes = { main: { id: 'main', label: 'Main', nodes: data.nodes || [], edges: data.edges || [] } }
    }
    // Resolve iconSrc from current library for all hardware nodes
    const resolveIcons = (sceneMap, lib) => {
      const flatLib = {}
      for (const icons of Object.values(lib)) {
        for (const ic of icons) {
          flatLib[ic.name] = ic.src
          // also index by label form
          flatLib[ic.name.replace(/_/g, ' ')] = ic.src
        }
      }
      const resolved = {}
      for (const [sid, scene] of Object.entries(sceneMap)) {
        resolved[sid] = {
          ...scene,
          nodes: (scene.nodes || []).map(n => {
            if (n.type !== 'hardware') return n
            const iconName = n.data?.iconName
              || n.data?.label?.toLowerCase().replace(/\s+/g, '_')
              || ''
            const src = flatLib[iconName]
              || flatLib[n.data?.label]
              || null
            return { ...n, data: { ...n.data, iconSrc: src } }
          })
        }
      }
      return resolved
    }
    const currentLib = get().iconsLibrary
    const resolvedScenes = resolveIcons(scenes, currentLib)

    set({
      scenes:          resolvedScenes,
      sceneStack:      ['main'],
      projectName:     data.projectName || 'Untitled',
      currentFilePath: result.filePath,
      deviceLibrary:      data.deviceLibrary      || [],
      customCableTypes:   data.customCableTypes   || [],
      isDirty:         false,
      selectedNodeId:  null,
      selectedEdgeId:  null,
    })
  },

  newProject: () => set({
    scenes:          { main: emptyScene() },
    sceneStack:      ['main'],
    projectName:     'Untitled',
    currentFilePath: null,
    isDirty:         false,
    selectedNodeId:  null,
    selectedEdgeId:  null,
    deviceLibrary:   [],
  }),
}))

export default useStore
