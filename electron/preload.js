const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadIcons:         ()              => ipcRenderer.invoke('load-icons'),
  openIconsFolder:   ()              => ipcRenderer.invoke('open-icons-folder'),
  saveProject:       (content, fp)  => ipcRenderer.invoke('save-project', content, fp),
  loadProject:       ()              => ipcRenderer.invoke('load-project'),
  exportImage:       (data, opts)   => ipcRenderer.invoke('export-image', data, opts),
  saveDeviceLibrary: (c)             => ipcRenderer.invoke('save-device-library', c),
  loadDeviceLibrary: ()              => ipcRenderer.invoke('load-device-library'),
  readSvgFile:       ()              => ipcRenderer.invoke('read-svg-file'),
  updaterInstall:    ()              => ipcRenderer.invoke('updater-install'),
  saveSettings:      (c) => ipcRenderer.invoke('save-settings', c),
  loadSettings:      ()  => ipcRenderer.invoke('load-settings'),
  onUpdater: (cb) => {
    ipcRenderer.on('updater', (_, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('updater')
  },
})
