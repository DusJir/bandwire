import { renderToStaticMarkup } from 'react-dom/server'
import useStore from '../../store/useStore'
import { platform } from '../../platform'
import { APP_NAME, APP_VERSION } from '../../version'
import { buildSections, totals, loadingSequence, findProblems, topLevel } from '../../utils/load'
import { escapeHtml } from '../../utils/legend'
import { VanView, PRINT_PAL } from './VanPlanner'
import i18n from '../../i18n'

const tr = (k, o) => i18n.t(k, { ns: 't', ...(o || {}) })

const BASE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4 portrait; margin: 10mm; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 8px; }
h1 { font-size: 18px; } .sub { color: #555; margin: 2px 0 8px; }
.meta { display: flex; gap: 14px; margin: 8px 0 10px; }
.meta div { flex: 1; border-bottom: 1px solid #333; padding-bottom: 1px; font-size: 10px; color: #555; min-height: 18px; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .6px; color: #555; border-bottom: 2px solid #111; padding: 3px 4px; }
td { padding: 3px 4px; border-bottom: 1px solid #ccc; vertical-align: middle; height: 22px; }
tr { break-inside: avoid; }
tr.sec td { background: #eee; font-weight: 700; font-size: 11px; border-bottom: 1px solid #999; height: 18px; }
tr.case td { font-weight: 700; }
.box { display: inline-block; width: 13px; height: 13px; border: 1.5px solid #111; border-radius: 2px; vertical-align: middle; }
.c { text-align: center; width: 34px; } .q { width: 30px; text-align: right; } .n { width: 22px; color: #555; }
.dim { color: #666; font-size: 9px; white-space: nowrap; } .note { color: #444; font-style: italic; }
.sign { display: flex; gap: 14px; margin-top: 18px; } .sign div { flex: 1; border-top: 1px solid #333; padding-top: 2px; font-size: 10px; color: #555; }
.foot { margin-top: 8px; font-size: 9px; color: #888; }
`

export function buildLoadListHtml(loadData, projectName) {
  const { items } = loadData
  const sections = buildSections(items)
  const sum = totals(items)
  const hasOrder = items.some(i => i.loadOrder && !i.parentId)
  const dims = (i) => `${i.shape === 'circle' ? 'Ø' + i.l : i.l + '×' + i.w}×${i.h}`
  const cols = hasOrder ? 6 : 5

  const rows = sections.map(sec => `
    <tr class="sec"><td colspan="${cols}">${escapeHtml(sec.name || tr('ldNoCategory'))}</td></tr>
    ${sec.rows.map(({ item: i, depth }) => `
    <tr class="${i.isCase ? 'case' : ''}">
      <td class="c"><span class="box"></span></td>
      <td class="c"><span class="box"></span></td>
      ${hasOrder ? `<td class="n">${i.loadOrder && !i.parentId ? i.loadOrder : ''}</td>` : ''}
      <td class="q">${i.qty}×</td>
      <td style="padding-left:${4 + depth * 16}px">${depth ? '└ ' : ''}${i.isCase ? '▣ ' : ''}${escapeHtml(i.name)} <span class="dim">${dims(i)}</span>${i.note ? ` <span class="note">— ${escapeHtml(i.note)}</span>` : ''}</td>
    </tr>`).join('')}`).join('')

  // blank lines for things added by hand
  const blank = Array.from({ length: 4 }, () => `<tr><td class="c"><span class="box"></span></td><td class="c"><span class="box"></span></td>${hasOrder ? '<td class="n"></td>' : ''}<td class="q"></td><td></td></tr>`).join('')

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(projectName)} — ${escapeHtml(tr('ldTitle'))}</title><style>${BASE_CSS}</style></head><body>
<h1>${escapeHtml(tr('ldTitle'))} — ${escapeHtml(projectName)}</h1>
<div class="sub">${escapeHtml(tr('ldSummary', { lines: sum.lines, pieces: sum.pieces, cases: sum.cases }))}</div>
<div class="meta"><div>${escapeHtml(tr('ldPrintDate'))}</div><div>${escapeHtml(tr('ldPrintVenue'))}</div><div>${escapeHtml(tr('ldPrintVehicle'))}</div></div>
<table>
<thead><tr><th class="c">${escapeHtml(tr('ldPrintOut'))}</th><th class="c">${escapeHtml(tr('ldPrintBack'))}</th>${hasOrder ? '<th class="n">#</th>' : ''}<th class="q">${escapeHtml(tr('ldColQty'))}</th><th>${escapeHtml(tr('ldColName'))}</th></tr></thead>
<tbody>${rows}${blank}</tbody></table>
<div class="sign"><div>${escapeHtml(tr('ldPrintLoadedBy'))}</div><div>${escapeHtml(tr('ldPrintCheckedBy'))}</div><div>${escapeHtml(tr('ldPrintReturned'))}</div></div>
<div class="foot">${APP_NAME} ${APP_VERSION}</div>
</body></html>`
}

export function buildVanHtml(loadData, projectName) {
  const { items, vehicle } = loadData
  const problems = findProblems(items, vehicle)
  const titles = { top: tr('vanViewTop'), side: tr('vanViewSide'), rear: tr('vanViewRear') }
  const ends = { rear: tr('vanRear'), cab: tr('vanCab'), left: tr('vanLeft'), right: tr('vanRight') }
  const svg = (view) => renderToStaticMarkup(
    <VanView view={view} items={items} vehicle={vehicle} problems={problems} interactive={false} pal={PRINT_PAL} titles={titles} ends={ends} />
  )
  const seq = loadingSequence(items)
  const unitsPlaced = topLevel(items).filter(i => i.pos).length
  const seqRows = seq.map(i => `
    <tr><td class="n">${i.loadOrder ?? ''}</td><td>${i.isCase ? '▣ ' : ''}${escapeHtml(i.name)} <span class="dim">${i.shape === 'circle' ? 'Ø' + i.l : i.l + '×' + i.w}×${i.h}</span></td>
    <td class="dim">${i.pos ? `x${i.pos.x} y${i.pos.y} z${i.pos.z}${i.pos.rot ? ' ↻' : ''}` : '—'}</td>
    <td class="note">${escapeHtml(i.note)}</td></tr>`).join('')

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(projectName)} — ${escapeHtml(tr('vanTitle'))}</title>
<style>${BASE_CSS}
@page { size: A4 landscape; margin: 10mm; }
.views { display: grid; grid-template-columns: 1.5fr 1fr; gap: 6px 14px; align-items: start; }
.views .top { grid-row: 1 / span 2; }
.views svg { width: 100%; height: auto; max-height: 235px; }
.views .top svg { max-height: 480px; }
</style></head><body>
<h1>${escapeHtml(tr('vanTitle'))} — ${escapeHtml(projectName)}</h1>
<div class="sub">${escapeHtml(vehicle.name || '')} ${vehicle.length}×${vehicle.width}×${vehicle.height} cm · ${unitsPlaced}/${topLevel(items).length}</div>
<div class="views"><div class="top">${svg('top')}</div><div>${svg('side')}</div><div>${svg('rear')}</div></div>
<h1 style="font-size:13px;margin-top:10px">${escapeHtml(tr('vanSequence'))}</h1>
<table><thead><tr><th class="n">#</th><th>${escapeHtml(tr('ldColName'))}</th><th>${escapeHtml(tr('vanPosition'))}</th><th>${escapeHtml(tr('ldNote'))}</th></tr></thead><tbody>${seqRows}</tbody></table>
<div class="foot">${APP_NAME} ${APP_VERSION}</div>
</body></html>`
}

export async function exportLoadList() {
  const { loadData, projectName } = useStore.getState()
  await platform.exportImage(buildLoadListHtml(loadData, projectName), { format: 'html', filename: 'load-list' })
}

export async function exportVanPlan() {
  const { loadData, projectName } = useStore.getState()
  await platform.exportImage(buildVanHtml(loadData, projectName), { format: 'html', filename: 'van-plan' })
}
