/**
 * Signal legend: row building, grouping/sorting and HTML rendering.
 * Pure functions (no React / DOM) so they can be unit-tested.
 */
import { CABLE_TYPES } from '../constants/cableTypes'

export const GROUP_BY = ['none', 'cable', 'source', 'target', 'device', 'scene']
export const IO_ORDER = ['in-first', 'out-first', 'mixed']
export const LAYOUTS  = ['below', 'side']

export const DEFAULT_LEGEND_CONFIG = {
  groupBy: 'none',
  groupOrder: [],        // user-defined order of group names (custom order)
  ioOrder: 'in-first',   // device grouping: INs before OUTs (or reverse / as connected)
  layout: 'below',       // 'below' | 'side'
  columns: 1,            // 1..3
}

export const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const portIndex = (handle) => parseInt((handle || '').split('__').pop()) || 0

const portOnly = (port) =>
  (port.label ? port.label.toUpperCase() : '')
  + (port.connector ? (port.label ? ' ' : '') + '(' + port.connector + ')' : '')

const portText = (node, port) =>
  (node.data.label || '?').toUpperCase() + (portOnly(port) ? ' ' + portOnly(port) : '')

/** One row per cable in the scene. */
export function buildRows(scene) {
  const rows = []
  const nodeMap = {}
  for (const n of scene.nodes || []) nodeMap[n.id] = n
  for (const edge of scene.edges || []) {
    const src = nodeMap[edge.source]
    const tgt = nodeMap[edge.target]
    if (!src || !tgt) continue
    const srcPort = (src.data.outputs || [])[portIndex(edge.sourceHandle)] || {}
    const tgtPort = (tgt.data.inputs  || [])[portIndex(edge.targetHandle)] || {}
    const cable   = CABLE_TYPES[edge.data?.cableType] || CABLE_TYPES.XLR
    rows.push({
      srcDevice: (src.data.label || '?').toUpperCase(),
      tgtDevice: (tgt.data.label || '?').toUpperCase(),
      srcPort: portOnly(srcPort) || '—', tgtPort: portOnly(tgtPort) || '—',
      src: portText(src, srcPort),
      tgt: portText(tgt, tgtPort),
      cable: cable.label.split(' ')[0],
      color: cable.color,
      userLabel: edge.data?.label || '',
      scene: scene.label || 'Main',
    })
  }
  return rows
}

/**
 * Turn rows into display groups: [{ name, items: [{dir, row}] }]
 * - dir is 'in' | 'out' | null (only set for device grouping)
 * - a row appears once, except for groupBy 'device' where it is listed
 *   under both of its devices (OUT at the source, IN at the target).
 */
export function groupRows(rows, config = {}) {
  const cfg = { ...DEFAULT_LEGEND_CONFIG, ...config }
  const map = new Map()
  const push = (name, item) => {
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(item)
  }

  for (const row of rows) {
    switch (cfg.groupBy) {
      case 'cable':  push(row.cable,     { dir: null, row }); break
      case 'source': push(row.srcDevice, { dir: null, row }); break
      case 'target': push(row.tgtDevice, { dir: null, row }); break
      case 'scene':  push(row.scene,     { dir: null, row }); break
      case 'device':
        push(row.srcDevice, { dir: 'out', row })
        push(row.tgtDevice, { dir: 'in',  row })
        break
      default:       push('', { dir: null, row })
    }
  }

  let names = [...map.keys()]
  if (cfg.groupBy !== 'none') {
    const custom = (cfg.groupOrder || []).filter(n => map.has(n))
    const rest   = names.filter(n => !custom.includes(n)).sort((a, b) => a.localeCompare(b))
    names = [...custom, ...rest]
  }

  return names.map(name => {
    let items = map.get(name)
    if (cfg.groupBy === 'device' && cfg.ioOrder !== 'mixed') {
      const first = cfg.ioOrder === 'out-first' ? 'out' : 'in'
      items = [...items].sort((a, b) => (a.dir === first ? 0 : 1) - (b.dir === first ? 0 : 1))
    }
    return { name, items }
  })
}

/** Group names in their current display order (for the reorder UI). */
export function listGroupNames(rows, config = {}) {
  return groupRows(rows, config).map(g => g.name).filter(Boolean)
}

/** Move `name` one step up/down in the order list; returns the new full order. */
export function moveGroup(order, name, delta) {
  const arr = [...order]
  const i = arr.indexOf(name)
  const j = i + delta
  if (i < 0 || j < 0 || j >= arr.length) return arr
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  return arr
}

const THEMES = {
  light: { bg: '#ffffff', fg: '#111111', sep: '#dddddd', dim: '#666666', head: '#f0f0f0' },
  dark:  { bg: '#0a0a12', fg: '#e0e0f0', sep: '#252538', dim: '#8888aa', head: '#161626' },
}
export const themeColors = (theme) => THEMES[theme] || THEMES.light

const itemHtml = (it, groupBy, c) => {
  const { row: r, dir } = it
  const tag = `<span class="tag" style="color:${r.color}">[${escapeHtml(r.cable)}]</span>`
  const note = r.userLabel ? ` <span class="note">"${escapeHtml(r.userLabel)}"</span>` : ''
  if (dir === 'out') {
    return `<tr><td class="dir">OUT</td><td>${tag}</td><td>${escapeHtml(r.srcPort)} <span class="arr">→</span> ${escapeHtml(r.tgt)}${note}</td></tr>`
  }
  if (dir === 'in') {
    return `<tr><td class="dir">IN</td><td>${tag}</td><td>${escapeHtml(r.tgtPort)} <span class="arr">←</span> ${escapeHtml(r.src)}${note}</td></tr>`
  }
  return `<tr><td>${tag}</td><td>${escapeHtml(r.src)} <span class="arr">→</span> ${escapeHtml(r.tgt)}${note}</td></tr>`
}

/** Render the legend block (HTML string). */
export function renderLegendHtml(rows, config = {}, theme = 'light', title = '') {
  const cfg = { ...DEFAULT_LEGEND_CONFIG, ...config }
  const groups = groupRows(rows, cfg)
  const cols = Math.min(3, Math.max(1, Number(cfg.columns) || 1))

  const blocks = groups.map(g => `
    <section class="grp">
      ${g.name ? `<h3>${escapeHtml(g.name)}</h3>` : ''}
      <table>${g.items.map(it => itemHtml(it, cfg.groupBy)).join('')}</table>
    </section>`).join('')

  return `
<div class="legend" style="column-count:${cols}">
  ${title ? `<div class="legend-title">${escapeHtml(title)}</div>` : ''}
  ${rows.length ? blocks : '<div class="empty">No connections in this diagram.</div>'}
</div>`
}

/** Stylesheet shared by the HTML export (screen + print). */
export function exportCss(theme = 'light', layout = 'below') {
  const c = themeColors(theme)
  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { margin: 8mm; }
html, body { background: ${c.bg}; color: ${c.fg}; }
body { font-family: 'Fira Mono', Consolas, monospace; font-size: 10px; line-height: 1.25; padding: 8px;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.wrap { display: flex; gap: 12px; align-items: flex-start; flex-direction: ${layout === 'side' ? 'row' : 'column'}; }
.diagram { ${layout === 'side' ? 'flex: 1 1 62%; min-width: 0;' : 'width: 100%;'} }
.diagram img { display: block; max-width: 100%; height: auto; margin: 0 auto;
  ${layout === 'side' ? '' : 'max-height: 66vh; width: auto;'} }
.legend { ${layout === 'side' ? 'flex: 0 0 36%;' : 'width: 100%;'} column-gap: 18px; column-fill: balance;
  border-top: 1px solid ${c.sep}; padding-top: 6px; }
.legend-title { column-span: all; font-size: 8px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1.2px; color: ${c.dim}; margin-bottom: 4px; }
.grp { break-inside: avoid; margin-bottom: 6px; }
.grp h3 { font-size: 10px; background: ${c.head}; padding: 1px 4px; border-left: 3px solid ${c.dim}; margin-bottom: 1px; }
.grp table { border-collapse: collapse; width: 100%; table-layout: auto; }
.grp td:nth-last-child(2) { width: 46px; }
.grp td { padding: 1px 4px 1px 0; vertical-align: top; border-bottom: 1px solid ${c.sep}; }
.tag { font-weight: 700; font-size: 9px; white-space: nowrap; }
.dir { color: ${c.dim}; font-size: 8px; font-weight: 700; width: 22px; }
.arr, .note { color: ${c.dim}; }
.note { font-style: italic; }
.empty { color: ${c.dim}; font-style: italic; }
@media print { body { padding: 0; } }
`
}

/** Full HTML document. `imgSize` ({w,h}) lets us pick landscape/portrait. */
export function buildExportHtml({ dataUrl, imgSize, rows, config, theme, appTitle, includeLegend }) {
  const cfg = { ...DEFAULT_LEGEND_CONFIG, ...config }
  const landscape = !imgSize || imgSize.w >= imgSize.h || cfg.layout === 'side'
  const legend = includeLegend ? renderLegendHtml(rows, cfg, theme, 'Signal Legend') : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(appTitle)}</title>
<style>${exportCss(theme, cfg.layout)}
@page { size: A4 ${landscape ? 'landscape' : 'portrait'}; }</style>
</head>
<body>
<div class="wrap">
  <div class="diagram"><img src="${dataUrl}" alt="Signal flow diagram"></div>
  ${legend}
</div>
</body>
</html>`
}
