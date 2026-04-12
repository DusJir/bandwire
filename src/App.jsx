import { useEffect, useCallback } from 'react'
import { ReactFlowProvider } from 'reactflow'
import Toolbar from './components/Toolbar/Toolbar'
import Sidebar from './components/Sidebar/Sidebar'
import Canvas from './components/Canvas/Canvas'
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel'
import AddDeviceModal from './components/Modals/AddDeviceModal'
import ExportModal    from './components/Modals/ExportModal'
import UpdateToast    from './components/UpdateToast'
import StageCanvas       from './components/Stage/StageCanvas'
import LibraryModal      from './components/Modals/LibraryModal'
import SaveToLibraryModal from './components/Modals/SaveToLibraryModal'
import StageSetupModal  from './components/Modals/StageSetupModal'
import StageExportModal from './components/Modals/StageExportModal'
import StagePanel     from './components/Stage/StagePanel'
import AddCableModal  from './components/Modals/AddCableModal'
import SettingsModal  from './components/Modals/SettingsModal'
import ConfirmModal   from './components/Modals/ConfirmModal'
import ManualModal from './components/Modals/ManualModal'
import useStore from './store/useStore'
import { platform } from './platform'

export default function App() {
  const { loadIcons, loadDeviceLibrary, saveProject, loadProject, deleteSelected, activeModal, theme, openModal, saveToLibrary, libraryId } = useStore()
  const appMode      = useStore(s => s.appMode)
  const stageInited  = useStore(s => s.stageData?.initialized)

  // Open Stage Setup modal when switching to stage mode if stage not yet configured
  useEffect(() => {
    if (appMode === 'stage' && !stageInited) {
      openModal('stageSetup')
    }
  }, [appMode, stageInited])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      const inInput = tag === 'input' || tag === 'textarea' || tag === 'select'

      // Ctrl+N — new
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        useStore.getState().newProject()
        return
      }
      // Ctrl+E — export
      if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        const st = useStore.getState(); st.openModal(st.appMode === 'stage' ? 'stageExport' : 'export')
        return
      }
      // Escape — close modal / deselect
      if (e.key === 'Escape') {
        const state = useStore.getState()
        if (state.activeModal) { state.closeModal(); return }
        state.setSelectedNode(null)
        state.setSelectedEdge(null)
        return
      }
      // Delete / Backspace — delete selected (not in input)
      if (!inInput && (e.key === 'Delete' || e.key === 'Backspace')) {
        const state = useStore.getState()
        if (state.appMode === 'stage') {
          // Delete from stage data
          const { selectedNodeId, selectedEdgeId, stageData, updateStageData } = state
          if (selectedNodeId) {
            updateStageData({
              nodes: stageData.nodes.filter(n => n.id !== selectedNodeId),
              edges: stageData.edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId),
            })
            state.clearSelection()
          } else if (selectedEdgeId) {
            updateStageData({ edges: stageData.edges.filter(e => e.id !== selectedEdgeId) })
            state.clearSelection()
          }
        } else {
          state.deleteSelected()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    loadIcons()
    loadDeviceLibrary()
    useStore.getState().loadSettings()

    // PWA: restore autosave if no project loaded
    if (platform.isBrowser()) {
      platform.loadAutoSave().then(saved => {
        if (saved) {
          const data = JSON.parse(saved)
          const store = useStore.getState()
          if (store.scenes?.main?.nodes?.length === 0) {
            // Only restore if canvas is empty
            useStore.setState({
              scenes:      data.scenes      || { main: { id: 'main', label: 'Main', nodes: [], edges: [] } },
              projectName: data.projectName || 'Untitled',
              deviceLibrary: data.deviceLibrary || [],
              isDirty: false,
            })
          }
        }
      }).catch(() => {})
    }
  }, [])

  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleKey = useCallback(async (e) => {
    const active = document.activeElement
    const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
    if (isInput) return

    // Ctrl+Shift+S — save as (new library entry)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault()
      openModal('saveToLibrary', { saveAs: true })
      return
    }
    // Ctrl+S — save to library
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 's') {
      e.preventDefault()
      const state = useStore.getState()
      if (state.libraryId) {
        const entry = await platform.library.get(state.libraryId)
        if (entry) {
          state.saveToLibrary({ name: entry.name, description: entry.description, filename: entry.filename, category: entry.category, notes: entry.notes, createdAt: entry.createdAt })
          return
        }
      }
      openModal('saveToLibrary')
      return
    }
    // Ctrl+O — open library
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault()
      openModal('library')
      return
    }
    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
  }, [saveProject, loadProject, deleteSelected, openModal])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <ReactFlowProvider>
    <div className="app">
        <Toolbar />
        <div className="workspace">
          <Sidebar />
          {appMode === "schema" ? <Canvas /> : <StageCanvas />}
          {appMode === "schema" ? <PropertiesPanel /> : <StagePanel />}
        </div>
        {activeModal === 'addDevice' && <AddDeviceModal />}
    {activeModal === 'addCable'  && <AddCableModal />}
    {activeModal === 'settings'  && <SettingsModal />}
    {activeModal === 'confirm'      && <ConfirmModal />}
    {activeModal === 'stageExport'  && <StageExportModal />}
    {activeModal === 'stageSetup'   && <StageSetupModal />}
    {activeModal === 'library'      && <LibraryModal />}
    {activeModal === 'saveToLibrary' && <SaveToLibraryModal />}
    <UpdateToast />
        {activeModal === 'export'    && <ExportModal />}
        {activeModal === 'manual'    && <ManualModal />}
    </div>
    </ReactFlowProvider>
  )
}