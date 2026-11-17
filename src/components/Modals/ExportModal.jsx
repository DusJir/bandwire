import { useState } from 'react'
import { toPng } from 'html-to-image'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { platform } from '../../platform'
import { buildRows, listGroupNames, moveGroup, buildExportHtml, DEFAULT_LEGEND_CONFIG, GROUP_BY, IO_ORDER, themeColors } from '../../utils/legend'
import { APP_NAME, APP_VERSION } from '../../version'

export default function ExportModal() {
  const { t } = useTranslation('t')
  const { closeModal, scenes, iconsLibrary, settings, updateSettings } = useStore()
  const [theme,     setTheme]     = useState(settings?.exportTheme ?? 'light')
  const [legend,    setLegend]    = useState(settings?.defaultExportLegend ?? true)
  const [allScenes, setAllScenes] = useState(false)
  const [cfg,       setCfg]       = useState({ ...DEFAULT_LEGEND_CONFIG, ...(settings?.exportLegend || {}) })
  const [exporting,    setExporting]    = useState(null) // 'png' | 'html' | null
  const [exportError,  setExportError]  = useState(null)

  const patchCfg = (patch) => {
    const next = { ...cfg, ...patch }
    setCfg(next)
    updateSettings({ exportLegend: next })
  }

  const scenesToExport = () => allScenes
    ? Object.values(scenes).filter(Boolean)
    : [useStore.getState().currentScene()].filter(Boolean)
  const rows = scenesToExport().flatMap(sc => buildRows(sc))
  // Group names in display order (drives the reorder list)
  const groupNames = cfg.groupBy === 'none' ? [] : listGroupNames(rows, cfg)

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

  const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

  // Bounding box of all nodes in canvas coordinates (measured from the DOM,
  // so it works even when width/height are missing from the node data).
  const measureBounds = (viewport) => {
    const nodes = useStore.getState().currentScene()?.nodes || []
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of nodes) {
      const el = viewport.querySelector(`.react-flow__node[data-id="${CSS.escape(n.id)}"]`)
      if (!el) continue
      const pos = n.positionAbsolute || n.position || { x: 0, y: 0 }
      minX = Math.min(minX, pos.x);               minY = Math.min(minY, pos.y)
      maxX = Math.max(maxX, pos.x + el.offsetWidth); maxY = Math.max(maxY, pos.y + el.offsetHeight)
    }
    if (!isFinite(minX)) return null
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
  }

  // Capture ONLY the diagram (cropped to the devices + margin), in the chosen theme.
  const captureCanvas = async () => {
    const viewport = document.querySelector('.react-flow__viewport')
    if (!viewport) throw new Error('Canvas element not found')
    const bounds = measureBounds(viewport)
    if (!bounds) throw new Error('Nothing to export — the canvas is empty')

    const PAD = 24
    const width  = Math.ceil(bounds.w + PAD * 2)
    const height = Math.ceil(bounds.h + PAD * 2)
    const tx = PAD - bounds.x
    const ty = PAD - bounds.y

    // Replace non-data: image sources before html-to-image clones the DOM
    const imgs = Array.from(viewport.querySelectorAll('img'))
    const origAttrs = imgs.map(img => img.getAttribute('src'))
    for (const img of imgs) {
      const s = img.getAttribute('src') || ''
      if (!s.startsWith('data:')) {
        const replacement = getIconDataUri(img.alt) || ''
        img.setAttribute('src', replacement)
        img.src = replacement
      }
    }

    // Apply the export theme to the diagram only (independent of the app theme)
    const origTheme = viewport.getAttribute('data-theme')
    viewport.setAttribute('data-theme', theme)
    await nextFrame()

    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: themeColors(theme).bg,
        pixelRatio: 2,
        skipFonts: true,
        width, height,
        style: { width: width + 'px', height: height + 'px', transform: `translate(${tx}px, ${ty}px) scale(1)` },
      })
      return { dataUrl, size: { w: width, h: height } }
    } finally {
      if (origTheme == null) viewport.removeAttribute('data-theme')
      else viewport.setAttribute('data-theme', origTheme)
      imgs.forEach((img, i) => {
        if (origAttrs[i] != null) img.setAttribute('src', origAttrs[i])
      })
    }
  }

  const exportPng = async () => {
    setExporting('png')
    setExportError(null)
    try {
      const { dataUrl } = await captureCanvas()
      await platform.exportImage(dataUrl, { format: 'png' })
      closeModal()
    } catch (e) {
      console.error('PNG export failed', e)
      setExportError(e.message || String(e) || 'Export failed')
      setExporting(null)
    }
  }

  const exportHtml = async () => {
    setExporting('html')
    setExportError(null)
    try {
      const { dataUrl, size } = await captureCanvas()
      updateSettings({ exportTheme: theme })
      const html = buildExportHtml({
        dataUrl, imgSize: size, rows, config: cfg, theme,
        appTitle: `${APP_NAME} ${APP_VERSION} — Signal Flow Export`,
        includeLegend: legend,
      })
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
    <div className="modal-backdrop" onMouseDown={closeModal}>
      <div className="modal modal-sm" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t('exportDiagram')}</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
          <div className="field-section-title">{t('exportTheme')}</div>
          <div className="export-options" style={{ flexDirection: 'row', gap: 16 }}>
            {['light', 'dark'].map(v => (
              <label key={v} className="export-option">
                <input type="radio" name="exportTheme" checked={theme === v} onChange={() => setTheme(v)} />
                <span>{v === 'light' ? t('themeLightPrint') : t('themeDarkExport')}</span>
              </label>
            ))}
          </div>

          <div className="export-options" style={{ marginTop: 10 }}>
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

          {legend && (
            <div style={{ marginTop: 14 }}>
              <div className="field-section-title">{t('legendLayout')}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <select className="export-select" value={cfg.layout} onChange={e => patchCfg({ layout: e.target.value })}>
                  <option value="below">{t('layoutBelow')}</option>
                  <option value="side">{t('layoutSide')}</option>
                </select>
                <select className="export-select" value={cfg.columns} onChange={e => patchCfg({ columns: Number(e.target.value) })}>
                  {[1, 2, 3].map(n => <option key={n} value={n}>{t('legendColumns')}: {n}</option>)}
                </select>
              </div>

              <div className="field-section-title" style={{ marginTop: 12 }}>{t('legendGroupBy')}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <select className="export-select" value={cfg.groupBy}
                        onChange={e => patchCfg({ groupBy: e.target.value, groupOrder: [] })}>
                  {GROUP_BY.map(g => <option key={g} value={g}>{t('groupBy_' + g)}</option>)}
                </select>
                {cfg.groupBy === 'device' && (
                  <select className="export-select" value={cfg.ioOrder} onChange={e => patchCfg({ ioOrder: e.target.value })}>
                    {IO_ORDER.map(o => <option key={o} value={o}>{t('ioOrder_' + o)}</option>)}
                  </select>
                )}
              </div>

              {groupNames.length > 1 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{t('groupOrderTitle')}</div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 4, maxHeight: 150, overflowY: 'auto' }}>
                    {groupNames.map((name, i) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 6px', fontSize: 12 }}>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                        <button className="props-btn" style={{ flex: '0 0 auto', width: 32, padding: '0 6px' }} disabled={i === 0}
                                onClick={() => patchCfg({ groupOrder: moveGroup(groupNames, name, -1) })}>▲</button>
                        <button className="props-btn" style={{ flex: '0 0 auto', width: 32, padding: '0 6px' }} disabled={i === groupNames.length - 1}
                                onClick={() => patchCfg({ groupOrder: moveGroup(groupNames, name, 1) })}>▼</button>
                      </div>
                    ))}
                  </div>
                  <button className="props-btn" style={{ marginTop: 4, flex: '0 0 auto', width: 'auto', padding: '2px 10px' }} onClick={() => patchCfg({ groupOrder: [] })}>
                    {t('groupOrderReset')}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="export-format-info">
            <div className="export-format-row">
              <span className="export-format-badge">PNG</span>
              <span>Diagram image only — for sharing, printing</span>
            </div>
            <div className="export-format-row">
              <span className="export-format-badge">HTML</span>
              <span>Diagram + signal legend — open in any browser, print-ready</span>
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
          <button
            className={'props-btn' + (settings?.defaultExportFormat !== 'html' ? ' accent' : '')}
            onClick={exportPng} disabled={busy}>
            {exporting === 'png' ? t('exporting') : '↓ PNG'}
          </button>
          <button
            className={'props-btn' + (settings?.defaultExportFormat === 'html' ? ' accent' : '')}
            onClick={exportHtml} disabled={busy}>
            {exporting === 'html' ? t('exporting') : '↓ HTML'}
          </button>
        </div>
      </div>
    </div>
  )
}
