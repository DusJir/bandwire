import { useState, useEffect } from 'react'

export default function UpdateToast() {
  const [state, setState] = useState(null)
  // state: null | 'available' | 'progress' | 'downloaded' | 'error'
  const [info,  setInfo]  = useState({})

  useEffect(() => {
    if (!window.electronAPI?.onUpdater) return
    const off = window.electronAPI.onUpdater((data) => {
      switch (data.event) {
        case 'available':
          setState('available')
          setInfo(data)
          break
        case 'progress':
          setState('progress')
          setInfo(data)
          break
        case 'downloaded':
          setState('downloaded')
          setInfo(data)
          break
        case 'error':
          // Only show error if we were already in an update flow
          setState(s => s ? 'error' : null)
          setInfo(data)
          break
        default:
          break
      }
    })
    return off
  }, [])

  if (!state) return null

  const dismiss = () => setState(null)
  const install = () => window.electronAPI.updaterInstall()

  return (
    <div className="update-toast">
      {state === 'available' && (
        <>
          <div className="update-toast-icon">⬇</div>
          <div className="update-toast-text">
            <strong>Update available</strong>
            {info.version && <span> — v{info.version}</span>}
            <div className="update-toast-sub">Downloading in background…</div>
          </div>
          <button className="update-toast-dismiss" onClick={dismiss}>×</button>
        </>
      )}
      {state === 'progress' && (
        <>
          <div className="update-toast-icon">⬇</div>
          <div className="update-toast-text">
            <strong>Downloading update</strong>
            <div className="update-toast-progress-bar">
              <div className="update-toast-progress-fill" style={{width: (info.percent||0) + '%'}} />
            </div>
            <div className="update-toast-sub">{info.percent || 0}%</div>
          </div>
        </>
      )}
      {state === 'downloaded' && (
        <>
          <div className="update-toast-icon">✓</div>
          <div className="update-toast-text">
            <strong>Update ready</strong>
            {info.version && <span> — v{info.version}</span>}
            <div className="update-toast-sub">Will install on next launch</div>
          </div>
          <button className="update-toast-btn" onClick={install}>Restart now</button>
          <button className="update-toast-dismiss" onClick={dismiss}>×</button>
        </>
      )}
      {state === 'error' && (
        <>
          <div className="update-toast-icon" style={{color:'var(--danger)'}}>⚠</div>
          <div className="update-toast-text">
            <strong>Update failed</strong>
            <div className="update-toast-sub">{info.message || 'Check your connection and try again.'}</div>
          </div>
          <button className="update-toast-dismiss" onClick={dismiss}>×</button>
        </>
      )}
    </div>
  )
}
