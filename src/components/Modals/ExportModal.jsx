import { useState } from 'react'
import { toPng } from 'html-to-image'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { platform } from '../../platform'
import { CABLE_TYPES } from '../../constants/cableTypes'
import { APP_NAME, APP_VERSION } from '../../version'

export default function ExportModal() {
  const { t } = useTranslation('t')
  const { closeModal, scenes, iconsLibrary } = useStore()
  const [color,     setColor]     = useState(true)
  const [legend,    setLegend]    = useState(true)
  const [allScenes, setAllScenes] = useState(false)
  const [exporting,    setExporting]    = useState(null) // 'png' | 'html' | null
  const [exportError,  setExportError]  = useState(null)

  // Build legend rows from scene edges
  const buildLegend = (scene) => {
    const lines = []
    const nodeMap = {}
    for (const n of scene.nodes) nodeMap[n.id] = n
    for (const edge of scene.edges) {
      const src = nodeMap[edge.source]
      const tgt = nodeMap[edge.target]
      if (!src || !tgt) continue
      // Handle IDs are positional: nodeId__out__idx — extract index to find port
      const srcIdx  = parseInt((edge.sourceHandle || '').split('__').pop()) || 0
      const tgtIdx  = parseInt((edge.targetHandle || '').split('__').pop()) || 0
      const srcPort = (src.data.outputs || [])[srcIdx] || {}
      const tgtPort = (tgt.data.inputs  || [])[tgtIdx] || {}
      const cable   = CABLE_TYPES[edge.data?.cableType] || CABLE_TYPES.XLR
      const srcStr  = (src.data.label || '?').toUpperCase()
        + (srcPort.label     ? ' ' + srcPort.label.toUpperCase() : '')
        + (srcPort.connector ? ' (' + srcPort.connector + ')' : '')
      const tgtStr  = (tgt.data.label || '?').toUpperCase()
        + (tgtPort.label     ? ' ' + tgtPort.label.toUpperCase() : '')
        + (tgtPort.connector ? ' (' + tgtPort.connector + ')' : '')
      lines.push({
        src: srcStr, tgt: tgtStr,
        cable: cable.label.split(' ')[0],
        color: cable.color,
        userLabel: edge.data?.label ? '  "' + edge.data.label + '"' : '',
        sceneLabel: scene.label || 'Main',
      })
    }
    return lines
  }

  // Flat map of iconName -> data URI from current library
  const getIconDataUri = (altText) => {
    const name = (altText || '').toLowerCase().replace(/\s+/g, '_')
    for (const icons of Object.values(iconsLibrary)) {
      const found = icons.find(ic => ic.name === name || ic.name === altText)
      if (found && found.src?.startsWith('data:')) return found.src
    }
    return null
  }

  // Convert a src URL to base64 data URI
  const toDataUri = (src, altText) => new Promise((resolve) => {
    if (!src || src.startsWith('data:')) { resolve(src); return }
    // Stale blob or http URL — try to get from store first
    const fromStore = getIconDataUri(altText)
    if (fromStore) { resolve(fromStore); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width  = img.naturalWidth  || 64
      c.height = img.naturalHeight || 64
      c.getContext('2d').drawImage(img, 0, 0)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => resolve(getIconDataUri(altText) || '')
    img.src = src
  })

  // Capture canvas as PNG dataUrl
  const captureCanvas = async () => {
    const el = document.querySelector('.react-flow__renderer')
            || document.querySelector('.react-flow__viewport')
            || document.querySelector('.react-flow')
    if (!el) throw new Error('Canvas element not found')

      // Before html-to-image clones the DOM, replace ALL img[src] that are not data:
    // by setting the attribute directly — html-to-image reads the attribute
    const imgs = Array.from(el.querySelectorAll('img'))
    const origAttrs = imgs.map(img => img.getAttribute('src'))
    for (const img of imgs) {
      const s = img.getAttribute('src') || ''
      if (!s.startsWith('data:')) {
        const replacement = getIconDataUri(img.alt) || ''
        img.setAttribute('src', replacement)
        img.src = replacement
      }
    }

    try {
      return await toPng(el, {
        backgroundColor: color ? '#0a0a12' : '#ffffff',
        pixelRatio: 2,
        skipFonts: true,
        filter: (node) => {
          if (node.classList?.contains('react-flow__minimap')) return false
          if (node.classList?.contains('react-flow__controls')) return false
          return true
        },
      })
    } finally {
      imgs.forEach((img, i) => {
        if (origAttrs[i] != null) img.setAttribute('src', origAttrs[i])
      })
    }
  }

  // Export as PNG
  const exportPng = async () => {
    setExporting('png')
    setExportError(null)
    try {
      const dataUrl = await captureCanvas()
      await platform.exportImage(dataUrl, { format: 'png' })
      closeModal()
    } catch (e) {
      console.error('PNG export failed', e)
      setExportError(e.message || String(e) || 'Export failed')
      setExporting(null)
    }
  }

  // Export as HTML (diagram image + signal legend)
  const exportHtml = async () => {
    setExporting('html')
    setExportError(null)
    try {
      const dataUrl = await captureCanvas()

      let legendHtml = ''
      if (legend) {
        const scenesToExport = allScenes
          ? Object.values(scenes).filter(Boolean)
          : [scenes.main].filter(Boolean)
        const allLines = scenesToExport.flatMap(sc => buildLegend(sc))

        const bg   = color ? '#0d0d18' : '#f8f8f8'
        const fg   = color ? '#e0e0f0' : '#111111'
        const sep  = color ? '#1e1e30' : '#e5e5e5'
        const hdim = color ? '#555577' : '#888888'

        legendHtml = `
<div style="font-family:'Fira Mono',Consolas,monospace;font-size:13px;padding:20px 24px;background:${bg};color:${fg};border-top:2px solid ${color ? '#252538' : '#cccccc'}">
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${hdim};margin-bottom:12px">
    Signal Legend — ${APP_NAME} ${APP_VERSION}
  </div>
  <table style="border-collapse:collapse;width:100%">
    ${allLines.map(l => `
    <tr style="border-bottom:1px solid ${sep}">
      <td style="padding:4px 8px 4px 0;color:${l.color};font-size:11px;white-space:nowrap;font-weight:700">[${l.cable}]</td>
      <td style="padding:4px 8px;white-space:nowrap">${l.src}</td>
      <td style="padding:4px 6px;opacity:0.4;font-size:16px">→</td>
      <td style="padding:4px 8px;white-space:nowrap">${l.tgt}</td>
      ${l.userLabel ? `<td style="padding:4px 8px;opacity:0.45;font-style:italic">${l.userLabel}</td>` : '<td></td>'}
    </tr>`).join('')}
  </table>
  ${allLines.length === 0 ? `<div style="opacity:0.4;font-style:italic">No connections in this diagram.</div>` : ''}
</div>`
      }

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${APP_NAME} — Signal Flow Export</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${color ? '#0a0a12' : '#ffffff'}; font-family: -apple-system, sans-serif; }
    img { max-width: 100%; display: block; }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="Signal flow diagram" />
  ${legendHtml}
</body>
</html>`

      await platform.exportImage(html, { format: 'html' })
      closeModal()
    } catch (e) {
      console.error('HTML export failed', e)
      setExportError(e.message || String(e) || 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  const busy = exporting !== null

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t('exportDiagram')}</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>

        <div className="modal-body">
          {/* Options */}
          <div className="export-options">
            <label className="export-option">
              <input type="checkbox" checked={color} onChange={e => setColor(e.target.checked)} />
              <span>{t('colorOption')}</span>
            </label>
            <label className="export-option">
              <input type="checkbox" checked={legend} onChange={e => setLegend(e.target.checked)} />
              <span>{t('includeLegend')}</span>
            </label>
            {legend && (
              <label className="export-option" style={{paddingLeft: 24}}>
                <input type="checkbox" checked={allScenes} onChange={e => setAllScenes(e.target.checked)} />
                <span>{t('includeAllScenes')}</span>
              </label>
            )}
          </div>

          {/* Legend preview */}
          {legend && (
            <div style={{marginTop: 14}}>
              <div className="field-section-title">{t('legendFormat')}</div>
              <div className="legend-example" style={{marginTop: 6}}>
                <span style={{color:'#3B82F6',fontWeight:'bold'}}>[XLR]</span>
                {'  RACK MIX OUT 1/2 (XLR) → FOH CH 3/4 (XLR)'}
              </div>
            </div>
          )}

          {/* Format info */}
          <div className="export-format-info">
            <div className="export-format-row">
              <span className="export-format-badge">PNG</span>
              <span>Diagram image only — for sharing, printing</span>
            </div>
            <div className="export-format-row">
              <span className="export-format-badge">HTML</span>
              <span>Diagram + signal legend — open in any browser</span>
            </div>
          </div>
        </div>

        {exportError && (
          <div style={{padding:'8px 18px',color:'var(--danger)',fontSize:12,borderTop:'1px solid var(--border)'}}>
            ⚠ {exportError}
          </div>
        )}
        <div className="modal-footer">
          <button className="props-btn" onClick={closeModal} disabled={busy}>{t('cancel')}</button>
          <button className="props-btn export-btn-png" onClick={exportPng} disabled={busy}>
            {exporting === 'png' ? t('exporting') : '↓ PNG'}
          </button>
          <button className="props-btn accent" onClick={exportHtml} disabled={busy}>
            {exporting === 'html' ? t('exporting') : '↓ HTML'}
          </button>
        </div>
      </div>
    </div>
  )
}
