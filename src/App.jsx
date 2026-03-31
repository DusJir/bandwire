import { useEffect, useCallback } from 'react'
import { ReactFlowProvider } from 'reactflow'
import Toolbar from './components/Toolbar/Toolbar'
import Sidebar from './components/Sidebar/Sidebar'
import Canvas from './components/Canvas/Canvas'
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel'
import AddDeviceModal from './components/Modals/AddDeviceModal'
import ExportModal    from './components/Modals/ExportModal'
import UpdateToast    from './components/UpdateToast'
import AddCableModal  from './components/Modals/AddCableModal'
import SettingsModal  from './components/Modals/SettingsModal'
import ConfirmModal   from './components/Modals/ConfirmModal'
import ManualModal from './components/Modals/ManualModal'
import useStore from './store/useStore'
import { platform } from './platform'

export default function App() {
  const { loadIcons, loadDeviceLibrary, saveProject, loadProject, deleteSelected, activeModal, theme } = useStore()

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      const inInput = tag === 'input' || tag === 'textarea' || tag === 'select'

      // Ctrl+S — save
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        useStore.getState().saveProject()
        return
      }
      // Ctrl+O — open
      if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        useStore.getState().loadProject()
        return
      }
      // Ctrl+N — new
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        useStore.getState().newProject()
        return
      }
      // Ctrl+E — export
      if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        useStore.getState().openModal('export')
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
        useStore.getState().deleteSelected()
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

  const handleKey = useCallback((e) => {
    const active = document.activeElement
    const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
    if (isInput) return
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveProject() }
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); loadProject() }
    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
  }, [saveProject, loadProject, deleteSelected])

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
          <Canvas />
          <PropertiesPanel />
        </div>
        {activeModal === 'addDevice' && <AddDeviceModal />}
    {activeModal === 'addCable'  && <AddCableModal />}
    {activeModal === 'settings'  && <SettingsModal />}
    {activeModal === 'confirm'   && <ConfirmModal />}
    <UpdateToast />
        {activeModal === 'export'    && <ExportModal />}
        {activeModal === 'manual'    && <ManualModal />}
      </div>
    </ReactFlowProvider>
  )
}
