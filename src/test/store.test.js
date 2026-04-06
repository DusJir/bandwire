import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { vi } from 'vitest'
import useStore from '../store/useStore'

// Stub platform persistence — IndexedDB/Electron not available in test env
vi.mock('../platform', () => ({
  platform: {
    isBrowser:         vi.fn().mockReturnValue(false),
    saveDeviceLibrary: vi.fn().mockResolvedValue(undefined),
    saveSettings:      vi.fn().mockResolvedValue(undefined),
    loadSettings:      vi.fn().mockResolvedValue(null),
    loadDeviceLibrary: vi.fn().mockResolvedValue(null),
    loadIcons:         vi.fn().mockResolvedValue([]),
    saveProject:       vi.fn().mockResolvedValue(null),
    loadProject:       vi.fn().mockResolvedValue(null),
    autoSave:          vi.fn().mockResolvedValue(undefined),
    exportImage:       vi.fn().mockResolvedValue(undefined),
    openIconsFolder:   vi.fn(),
  }
}))

// Helper: reset store to initial state before each test
beforeEach(() => {
  useStore.getState().newProject()
  useStore.setState({ customCableTypes: [], deviceLibrary: [] })
})

// ── appMode ──────────────────────────────────────────────────────
describe('appMode', () => {
  it('defaults to schema', () => {
    expect(useStore.getState().appMode).toBe('schema')
  })

  it('switches to stage and back', () => {
    act(() => useStore.getState().setAppMode('stage'))
    expect(useStore.getState().appMode).toBe('stage')
    act(() => useStore.getState().setAppMode('schema'))
    expect(useStore.getState().appMode).toBe('schema')
  })
})

// ── stageData ─────────────────────────────────────────────────────
describe('stageData', () => {
  it('starts empty', () => {
    const { stageData } = useStore.getState()
    expect(stageData.nodes).toEqual([])
    expect(stageData.edges).toEqual([])
    expect(stageData.rider).toEqual({})
  })

  it('updateStageData merges nodes', () => {
    const node = { id: 'n1', type: 'stageDevice', position: { x: 0, y: 0 }, data: { label: 'Drums' } }
    act(() => useStore.getState().updateStageData({ nodes: [node] }))
    expect(useStore.getState().stageData.nodes).toHaveLength(1)
    expect(useStore.getState().stageData.nodes[0].data.label).toBe('Drums')
  })

  it('updateStageData preserves existing keys not in patch', () => {
    act(() => useStore.getState().updateStageData({ nodes: [{ id: 'n1' }] }))
    act(() => useStore.getState().updateStageData({ rider: { notes: 'test' } }))
    expect(useStore.getState().stageData.nodes).toHaveLength(1)
    expect(useStore.getState().stageData.rider.notes).toBe('test')
  })

  it('updateStageData sets isDirty', () => {
    act(() => useStore.getState().updateStageData({ nodes: [] }))
    expect(useStore.getState().isDirty).toBe(true)
  })

  it('newProject resets stageData', () => {
    act(() => useStore.getState().updateStageData({ nodes: [{ id: 'n1' }] }))
    act(() => useStore.getState().newProject())
    expect(useStore.getState().stageData.nodes).toEqual([])
  })
})

// ── Schema scenes ─────────────────────────────────────────────────
describe('scenes', () => {
  it('newProject creates main scene', () => {
    const { scenes, sceneStack } = useStore.getState()
    expect(scenes.main).toBeDefined()
    expect(sceneStack).toEqual(['main'])
  })

  it('updateNodeData updates a node in current scene', () => {
    // Seed a node directly into scenes via set (Zustand internal)
    const node = { id: 'test-node', type: 'hardware', position: { x: 0, y: 0 }, data: { label: 'Mic', inputs: [], outputs: [] } }
    act(() => {
      useStore.setState(state => ({
        scenes: { ...state.scenes, main: { ...state.scenes.main, nodes: [node] } }
      }))
    })
    act(() => useStore.getState().updateNodeData('test-node', { label: 'Updated Mic' }))
    const updated = useStore.getState().currentScene().nodes.find(n => n.id === 'test-node')
    expect(updated?.data.label).toBe('Updated Mic')
  })
})

// ── Settings ──────────────────────────────────────────────────────
describe('settings', () => {
  it('has default stage colors', () => {
    const { settings } = useStore.getState()
    expect(settings.stageFohColor).toBe('#EF4444')
    expect(settings.stagePersonalColor).toBe('#6366f1')
  })

  it('updateSettings patches only provided keys', () => {
    act(() => useStore.getState().updateSettings({ stageFohColor: '#FF0000' }))
    const { settings } = useStore.getState()
    expect(settings.stageFohColor).toBe('#FF0000')
    expect(settings.stagePersonalColor).toBe('#6366f1') // unchanged
  })
})

// ── Selection ─────────────────────────────────────────────────────
describe('selection', () => {
  it('setSelectedNode clears edge selection', () => {
    act(() => useStore.getState().setSelectedEdge('e1'))
    act(() => useStore.getState().setSelectedNode('n1'))
    expect(useStore.getState().selectedNodeId).toBe('n1')
    expect(useStore.getState().selectedEdgeId).toBeNull()
  })

  it('setSelectedEdge clears node selection', () => {
    act(() => useStore.getState().setSelectedNode('n1'))
    act(() => useStore.getState().setSelectedEdge('e1'))
    expect(useStore.getState().selectedEdgeId).toBe('e1')
    expect(useStore.getState().selectedNodeId).toBeNull()
  })

  it('clearSelection clears both', () => {
    act(() => useStore.getState().setSelectedNode('n1'))
    act(() => useStore.getState().clearSelection())
    expect(useStore.getState().selectedNodeId).toBeNull()
    expect(useStore.getState().selectedEdgeId).toBeNull()
  })
})

// ── Custom devices & cables ───────────────────────────────────────
describe('deviceLibrary', () => {
  it('addCustomDevice adds with generated id', () => {
    act(() => useStore.getState().addCustomDevice({ name: 'My Mic', tags: ['mic'], source: 'custom' }))
    const lib = useStore.getState().deviceLibrary
    expect(lib).toHaveLength(1)
    expect(lib[0].id).toMatch(/^dev-/)
    expect(lib[0].name).toBe('My Mic')
  })

  it('deleteCustomDevice removes by id', () => {
    act(() => useStore.getState().addCustomDevice({ name: 'X' }))
    const id = useStore.getState().deviceLibrary[0].id
    act(() => useStore.getState().deleteCustomDevice(id))
    expect(useStore.getState().deviceLibrary).toHaveLength(0)
  })

  it('addCustomCableType adds with generated id', () => {
    act(() => useStore.getState().addCustomCableType({ label: 'Cat6', color: '#aaa' }))
    const cables = useStore.getState().customCableTypes
    expect(cables).toHaveLength(1)
    expect(cables[0].label).toBe('Cat6')
  })

  it('deleteCustomCableType removes by id', () => {
    act(() => useStore.getState().addCustomCableType({ label: 'Cat6', color: '#aaa' }))
    const id = useStore.getState().customCableTypes[0].id
    // deleteCustomCableType calls set() synchronously then saveDeviceLibrary() async
    // We verify the synchronous state change; the async save is covered by the mock
    useStore.getState().deleteCustomCableType(id)
    expect(useStore.getState().customCableTypes).toHaveLength(0)
  })
})

// ── Modal ─────────────────────────────────────────────────────────
describe('modal', () => {
  it('openModal sets activeModal and payload', () => {
    act(() => useStore.getState().openModal('addDevice', { foo: 1 }))
    expect(useStore.getState().activeModal).toBe('addDevice')
    expect(useStore.getState().modalPayload).toEqual({ foo: 1 })
  })

  it('closeModal clears both', () => {
    act(() => useStore.getState().openModal('addDevice'))
    act(() => useStore.getState().closeModal())
    expect(useStore.getState().activeModal).toBeNull()
    expect(useStore.getState().modalPayload).toBeNull()
  })
})
