import '@testing-library/jest-dom'
// Stub Electron API — not available in test env
global.window = global.window || {}
window.electronAPI = undefined
