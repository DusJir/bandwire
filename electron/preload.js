const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadIcons:       ()              => ipcRenderer.invoke('load-icons'),
  openIconsFolder: ()              => ipcRenderer.invoke('open-icons-folder'),
  saveProject:     (content, fp)  => ipcRenderer.invoke('save-project', content, fp),
  loadProject:     ()              => ipcRenderer.invoke('load-project'),
  exportImage:     (dataUrl, opts) => ipcRenderer.invoke('export-image', dataUrl, opts),
  saveDeviceLibrary: (c)           => ipcRenderer.invoke('save-device-library', c),
  loadDeviceLibrary: ()             => ipcRenderer.invoke('load-device-library'),
  readSvgFile:     ()              => ipcRenderer.invoke('read-svg-file'),
})
