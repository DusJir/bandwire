import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import {
  VEHICLE_PRESETS, VIEWS, topLevel, boxOf, projectBox, findProblems, moveInView, rotateItem, colorFor, loadingSequence,
} from '../../utils/load'
import { exportVanPlan } from './loadExport'

const SIZE = { x: 'length', y: 'width', z: 'height' }

export const APP_PAL   = { bg: 'var(--bg-surface)', line: 'var(--border-active)', grid: 'var(--border)', text: 'var(--text-primary)', dim: 'var(--text-secondary)' }
export const PRINT_PAL = { bg: '#ffffff', line: '#333333', grid: '#dddddd', text: '#111111', dim: '#666666' }

/** One orthogonal view of the cargo area. Used interactively in the app and as static markup in the export. */
export function VanView({ view, items, vehicle, problems, selectedId, interactive, onSelect, onDragStart, pal = APP_PAL, titles = {}, ends = {} }) {
  const cfg = VIEWS[view]
  const W = vehicle[SIZE[cfg.h]], H = vehicle[SIZE[cfg.v]]
  const fs = Math.max(W, H) / 40
  const M = fs * 3
  const flip = view !== 'top'
  const svgRef = useRef(null)

  const placed = topLevel(items).filter(i => i.pos)
  // paint far → near so overlapping rectangles look sensible
  const depthKey = (i) => view === 'top' ? boxOf(i).z1 : view === 'side' ? -boxOf(i).y0 : -boxOf(i).x0
  placed.sort((a, b) => depthKey(a) - depthKey(b))

  const gridV = [], gridH = []
  for (let a = 50; a < W; a += 50) gridV.push(a)
  for (let b = 50; b < H; b += 50) gridH.push(b)

  const hEnds = view === 'rear' ? [ends.left || 'left', ends.right || 'right'] : [ends.rear || 'rear', ends.cab || 'cab']

  return (
    <svg ref={svgRef} viewBox={`${-M} ${-M * 1.2} ${W + 2 * M} ${H + 2.8 * M}`} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
         onPointerDown={e => { if (interactive && e.target === svgRef.current) onSelect?.(null) }}>
      <text x={0} y={-M * 0.55} style={{ fill: pal.text, fontSize: fs * 1.15, fontWeight: 700 }}>{titles[view] || view.toUpperCase()}</text>
      <rect x={0} y={0} width={W} height={H} style={{ fill: pal.bg, stroke: pal.line, strokeWidth: fs / 8 }} />
      {gridV.map(a => <line key={'v' + a} x1={a} x2={a} y1={0} y2={H} style={{ stroke: pal.grid, strokeWidth: fs / 25 }} />)}
      {gridH.map(b => <line key={'h' + b} x1={0} x2={W} y1={b} y2={b} style={{ stroke: pal.grid, strokeWidth: fs / 25 }} />)}

      {placed.map(it => {
        const r = projectBox(boxOf(it), view)
        const x = r.a0, w = r.a1 - r.a0, h = r.b1 - r.b0
        const y = flip ? H - r.b1 : r.b0
        const bad = problems.overlapping.has(it.id) || problems.outside.has(it.id)
        const sel = it.id === selectedId
        const stroke = bad ? '#ef4444' : sel ? '#f59e0b' : 'rgba(0,0,0,0.55)'
        const sw = (bad || sel) ? fs / 4 : fs / 14
        const chars = Math.max(0, Math.floor(w / (fs * 0.62)))
        const text = `${it.loadOrder ? it.loadOrder + '. ' : ''}${it.name || ''}`
        const label = text.length > chars ? text.slice(0, Math.max(0, chars - 1)) + (chars > 1 ? '…' : '') : text
        const common = {
          style: { fill: colorFor(it), fillOpacity: 0.85, stroke, strokeWidth: sw, cursor: interactive ? 'grab' : 'default' },
          onPointerDown: interactive ? (e) => { e.stopPropagation(); onSelect?.(it.id); onDragStart?.(e, it, view, svgRef.current) } : undefined,
        }
        return (
          <g key={it.id}>
            {view === 'top' && it.shape === 'circle'
              ? <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...common} />
              : <rect x={x} y={y} width={w} height={h} rx={it.isCase ? fs / 4 : 0} {...common} />}
            {h > fs * 1.3 && chars > 1 && (
              <text x={x + w / 2} y={y + h / 2 + fs * 0.35} textAnchor="middle"
                    style={{ fill: '#fff', fontSize: fs, fontWeight: 600, pointerEvents: 'none', paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.5)', strokeWidth: fs / 6 }}>
                {label}
              </text>
            )}
          </g>
        )
      })}

      <text x={0} y={H + fs * 1.4} style={{ fill: pal.dim, fontSize: fs * 0.9 }}>{hEnds[0]}</text>
      <text x={W} y={H + fs * 1.4} textAnchor="end" style={{ fill: pal.dim, fontSize: fs * 0.9 }}>{hEnds[1]}</text>
      <text x={W / 2} y={H + fs * 1.4} textAnchor="middle" style={{ fill: pal.dim, fontSize: fs * 0.9 }}>{W} cm</text>
      <text x={W + fs * 0.4} y={H / 2} style={{ fill: pal.dim, fontSize: fs * 0.9 }}>{H}</text>
    </svg>
  )
}

function Num({ label, value, onCommit, width = 56 }) {
  const [text, setText] = useState(String(value))
  const [prev, setPrev] = useState(value)
  if (prev !== value) { setPrev(value); setText(String(value)) }
  const commit = () => { const n = parseFloat(text.replace(',', '.')); Number.isFinite(n) ? onCommit(n) : setText(String(value)) }
  return (
    <label className="van-num">
      <span>{label}</span>
      <input className="ld-input" style={{ width }} value={text} inputMode="decimal"
             onChange={e => setText(e.target.value)} onBlur={commit}
             onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} />
    </label>
  )
}

export default function VanPlanner() {
  const { t } = useTranslation('t')
  const loadData = useStore(s => s.loadData)
  const update = useStore(s => s.updateLoadItem)
  const setVehicle = useStore(s => s.setVehicle)
  const autoPlace = useStore(s => s.autoPlaceLoadItem)
  const [selectedId, setSelectedId] = useState(null)
  const drag = useRef(null)

  const { items, vehicle } = loadData
  const units = topLevel(items)
  const problems = findProblems(items, vehicle)
  const selected = units.find(i => i.id === selectedId) || null
  const onDragStart = (e, item, view, svg) => {
    const scale = svg.getScreenCTM()?.a || 1
    drag.current = { id: item.id, view, start: item, x: e.clientX, y: e.clientY, scale }
    const move = (ev) => {
      const d = drag.current; if (!d) return
      const da = (ev.clientX - d.x) / d.scale
      const db = (ev.clientY - d.y) / d.scale * (d.view === 'top' ? 1 : -1)   // z axis points up
      const moved = moveInView(d.start, d.view, da, db, useStore.getState().loadData.vehicle, 5)
      update(d.id, { pos: moved.pos })
    }
    const up = () => { drag.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const setPos = (patch) => selected && update(selected.id, { pos: { ...selected.pos, ...patch } })
  const preset = VEHICLE_PRESETS.find(p => p.length === vehicle.length && p.width === vehicle.width && p.height === vehicle.height)

  const titles = { top: t('vanViewTop'), side: t('vanViewSide'), rear: t('vanViewRear') }
  const ends = { rear: t('vanRear'), cab: t('vanCab'), left: t('vanLeft'), right: t('vanRight') }
  const mk = (view) => ({ view, items, vehicle, problems, selectedId, interactive: true, onSelect: setSelectedId, onDragStart, titles, ends })

  const problemList = [
    ...[...problems.overlapping].map(id => ({ id, kind: 'overlap' })),
    ...[...problems.outside].map(id => ({ id, kind: 'outside' })),
  ]

  return (
    <div className="van-panel">
      {/* Left: vehicle + units */}
      <div className="van-side">
        <div className="van-box">
          <div className="van-box-title">{t('vanVehicle')}</div>
          <select className="ld-input" style={{ width: '100%' }} value={preset?.id || 'custom'}
                  onChange={e => { const p = VEHICLE_PRESETS.find(x => x.id === e.target.value); if (p) setVehicle({ length: p.length, width: p.width, height: p.height }) }}>
            {VEHICLE_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="custom">{t('vanCustom')}</option>
          </select>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Num label={t('vanLength')} value={vehicle.length} onCommit={v => setVehicle({ length: Math.max(10, v) })} />
            <Num label={t('vanWidth')}  value={vehicle.width}  onCommit={v => setVehicle({ width:  Math.max(10, v) })} />
            <Num label={t('vanHeight')} value={vehicle.height} onCommit={v => setVehicle({ height: Math.max(10, v) })} />
          </div>
        </div>

        <div className="van-box" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="van-box-title">{t('vanUnits')} ({units.filter(u => u.pos).length}/{units.length})</div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {units.length === 0 && <div className="ld-empty" style={{ padding: 8 }}>{t('vanNoUnits')}</div>}
            {units.map(u => {
              const bad = problems.overlapping.has(u.id) || problems.outside.has(u.id)
              return (
                <div key={u.id} className={'van-unit' + (u.id === selectedId ? ' sel' : '')} onClick={() => setSelectedId(u.id)}>
                  <span className="van-sw" style={{ background: colorFor(u) }} />
                  <span className="van-un-name">{u.loadOrder ? u.loadOrder + '. ' : ''}{u.name || '—'}{bad ? ' ⚠' : ''}</span>
                  <span className="van-un-dim">{u.l}×{u.w}×{u.h}</span>
                  {u.pos
                    ? <button className="ld-x" title={t('vanUnplace')} onClick={e => { e.stopPropagation(); update(u.id, { pos: null }) }}>⏏</button>
                    : <button className="props-btn" style={{ flex: '0 0 auto', width: 'auto', padding: '1px 8px' }} onClick={e => { e.stopPropagation(); autoPlace(u.id); setSelectedId(u.id) }}>{t('vanPlace')}</button>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Middle: three views */}
      <div className="van-views">
        <div className="van-view-top"><VanView {...mk('top')} /></div>
        <div className="van-view-row">
          <VanView {...mk('side')} />
          <VanView {...mk('rear')} />
        </div>
      </div>

      {/* Right: selected + problems */}
      <div className="van-side">
        <div className="van-actions">
          <button className="props-btn accent" onClick={exportVanPlan}>↓ {t('vanExport')}</button>
        </div>
        <div className="van-box">
          <div className="van-box-title">{t('vanSelected')}</div>
          {!selected && <div className="ld-empty" style={{ padding: 6 }}>{t('vanSelectHint')}</div>}
          {selected && (
            <>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{selected.name || '—'}</div>
              <div className="van-un-dim" style={{ marginBottom: 6 }}>{selected.l}×{selected.w}×{selected.h} cm · {t('vanDimsHint')}</div>
              {selected.isCase && (
                <div className="van-un-dim" style={{ marginBottom: 6, color: 'var(--text-primary)' }}>
                  ▣ {t('vanContents')}: {items.filter(i => i.parentId === selected.id).map(i => i.name || '—').join(', ') || '—'}
                </div>
              )}
              {selected.pos ? (
                <>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Num label="x" value={selected.pos.x} onCommit={v => setPos({ x: Math.max(0, v) })} />
                    <Num label="y" value={selected.pos.y} onCommit={v => setPos({ y: Math.max(0, v) })} />
                    <Num label="z" value={selected.pos.z} onCommit={v => setPos({ z: Math.max(0, v) })} />
                  </div>
                  <button className="props-btn" style={{ marginTop: 8 }} onClick={() => update(selected.id, { pos: rotateItem(selected, vehicle).pos })}>↻ {t('vanRotate')} ({selected.pos.rot}°)</button>
                </>
              ) : <button className="props-btn" onClick={() => autoPlace(selected.id)}>{t('vanPlace')}</button>}
              <div style={{ marginTop: 8 }}>
                <Num label={t('vanOrder')} value={selected.loadOrder ?? ''} width={50}
                     onCommit={v => update(selected.id, { loadOrder: v > 0 ? Math.round(v) : null })} />
              </div>
              <input className="ld-input" style={{ width: '100%', marginTop: 8 }} placeholder={t('ldNote')} value={selected.note}
                     onChange={e => update(selected.id, { note: e.target.value })} />
            </>
          )}
        </div>

        <div className="van-box">
          <div className="van-box-title">{t('vanProblems')}</div>
          {problemList.length === 0 && <div className="ld-empty" style={{ padding: 6 }}>✓ {t('vanNoProblems')}</div>}
          {problemList.map(p => {
            const it = items.find(i => i.id === p.id)
            return <div key={p.kind + p.id} className="van-problem" onClick={() => setSelectedId(p.id)}>⚠ {it?.name || '—'} — {p.kind === 'overlap' ? t('vanOverlap') : t('vanOutside')}</div>
          })}
          <div className="van-un-dim" style={{ marginTop: 6 }}>{t('vanCircleNote')}</div>
        </div>

        <div className="van-box">
          <div className="van-box-title">{t('vanSequence')}</div>
          {loadingSequence(items).filter(i => i.loadOrder).map(i => (
            <div key={i.id} className="van-un-dim" style={{ color: 'var(--text-primary)' }}>{i.loadOrder}. {i.name}{i.note ? ` — ${i.note}` : ''}</div>
          ))}
          {!items.some(i => i.loadOrder && !i.parentId) && <div className="ld-empty" style={{ padding: 6 }}>{t('vanSequenceHint')}</div>}
        </div>
      </div>
    </div>
  )
}
