import { useEffect, useCallback } from 'react'
import { ReactFlowProvider } from 'reactflow'
import Toolbar from './components/Toolbar/Toolbar'
import Sidebar from './components/Sidebar/Sidebar'
import Canvas from './components/Canvas/Canvas'
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel'
import AddDeviceModal from './components/Modals/AddDeviceModal'
import ExportModal from './components/Modals/ExportModal'
import ManualModal from './components/Modals/ManualModal'
import useStore from './store/useStore'
import { platform } from './platform'

export default function App() {
  const { loadIcons, loadDeviceLibrary, saveProject, loadProject, deleteSelected, activeModal, theme } = useStore()

  useEffect(() => {
    loadIcons()
    loadDeviceLibrary()

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
        {activeModal === 'export'    && <ExportModal />}
        {activeModal === 'manual'    && <ManualModal />}
      </div>
    </ReactFlowProvider>
  )
}
