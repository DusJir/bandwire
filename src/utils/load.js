/**
 * Load List + Van planner ("Tetris") — pure data logic.
 *
 * One shared item list drives both modules:
 *  - Load List: printable A4 checklist (items grouped by category, cases with contents)
 *  - Van planner: top / side / rear view; only TOP-LEVEL units (cases + loose items)
 *    are placed, the contents of a case travel inside it.
 *
 * Units: centimetres.  Axes of the cargo area:
 *   x = length (0 at the rear doors, grows towards the cab)
 *   y = width  (0 = left side as seen from behind)
 *   z = height (0 = floor)
 */

export const VEHICLE_PRESETS = [
  { id: 'estate',  name: 'Estate car (approx.)',            length: 180, width: 105, height: 50  },
  { id: 'caddy',   name: 'Small van, Caddy-like (approx.)', length: 180, width: 120, height: 120 },
  { id: 'transit', name: 'Medium van, Transit Custom-like (approx.)', length: 300, width: 165, height: 140 },
  { id: 'sprinter',name: 'Large van, Sprinter-like (approx.)',        length: 420, width: 178, height: 190 },
]

export const emptyLoadData = () => ({
  items: [],
  vehicle: { name: '', length: 300, width: 165, height: 140 },
})

/** Fill in missing fields so old / partial project files never crash the UI. */
export function normalizeLoadData(d) {
  const base = emptyLoadData()
  if (!d || typeof d !== 'object') return base
  return {
    items: Array.isArray(d.items) ? d.items.map(normalizeItem) : [],
    vehicle: { ...base.vehicle, ...(d.vehicle || {}) },
  }
}

export const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const num = (v, def, min = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(min, n) : def
}

export function normalizeItem(it = {}) {
  const shape = it.shape === 'circle' ? 'circle' : 'rect'
  const l = num(it.l, 50, 1)
  return {
    id: it.id || uid(),
    name: it.name ?? '',
    category: it.category ?? '',
    qty: Math.max(1, Math.round(num(it.qty, 1, 1))),
    isCase: !!it.isCase,
    parentId: it.parentId || null,
    shape,
    l,
    w: shape === 'circle' ? l : num(it.w, 40, 1),
    h: num(it.h, 40, 1),
    loadOrder: it.loadOrder === '' || it.loadOrder == null ? null : num(it.loadOrder, null, 1),
    note: it.note ?? '',
    pos: it.pos ? { x: num(it.pos.x, 0), y: num(it.pos.y, 0), z: num(it.pos.z, 0), rot: it.pos.rot === 90 ? 90 : 0 } : null,
  }
}

// ── Item list operations (return a NEW loadData) ─────────────────

export function addItem(ld, partial = {}) {
  const item = normalizeItem({ name: '', ...partial, id: undefined })
  if (item.isCase) item.parentId = null
  return { ...ld, items: [...ld.items, item] }
}

export function updateItem(ld, id, patch) {
  const cur = ld.items.find(i => i.id === id)
  if (!cur) return ld
  let next = normalizeItem({ ...cur, ...patch, id })

  // Circle: footprint is a diameter
  if (next.shape === 'circle') next.w = next.l

  // A case can't live in another case
  if (next.isCase) next.parentId = null

  // Parent must be an existing case (and not the item itself)
  if (next.parentId) {
    const parent = ld.items.find(i => i.id === next.parentId)
    if (!parent || !parent.isCase || parent.id === id) next.parentId = null
  }
  // Packed items are not placed in the van individually
  if (next.parentId) next.pos = null

  let items = ld.items.map(i => (i.id === id ? next : i))
  // A case that stops being a case releases its contents
  if (cur.isCase && !next.isCase) items = items.map(i => (i.parentId === id ? { ...i, parentId: null } : i))
  return { ...ld, items }
}

export function removeItem(ld, id) {
  return {
    ...ld,
    items: ld.items.filter(i => i.id !== id).map(i => (i.parentId === id ? { ...i, parentId: null } : i)),
  }
}

export const topLevel = (items) => items.filter(i => !i.parentId)
export const casesOf  = (items) => items.filter(i => i.isCase)
export const contentsOf = (items, caseId) => items.filter(i => i.parentId === caseId)

/**
 * Sections for the printed list: by category (A–Z, empty category last);
 * inside, top-level items in entry order, each case followed by its contents.
 */
export function buildSections(items) {
  const map = new Map()
  for (const it of topLevel(items)) {
    const cat = (it.category || '').trim()
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push({ item: it, depth: 0 })
    if (it.isCase) for (const c of contentsOf(items, it.id)) map.get(cat).push({ item: c, depth: 1 })
  }
  const names = [...map.keys()].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
  return names.map(name => ({ name, rows: map.get(name) }))
}

export function totals(items) {
  const units = topLevel(items)
  return {
    lines: items.length,
    pieces: items.reduce((n, i) => n + i.qty, 0),
    cases: items.filter(i => i.isCase).length,
    placed: units.filter(i => i.pos).length,
    units: units.length,
  }
}

// ── Geometry ─────────────────────────────────────────────────────

/** Footprint after rotation (rot 90 swaps length and width). */
export function footprint(item) {
  return item.pos?.rot === 90 ? { l: item.w, w: item.l } : { l: item.l, w: item.w }
}

export function boxOf(item) {
  if (!item.pos) return null
  const f = footprint(item)
  return {
    x0: item.pos.x, x1: item.pos.x + f.l,
    y0: item.pos.y, y1: item.pos.y + f.w,
    z0: item.pos.z, z1: item.pos.z + item.h,
  }
}

export const VIEWS = {
  top:  { h: 'x', v: 'y', hLabel: 'length', vLabel: 'width'  },
  side: { h: 'x', v: 'z', hLabel: 'length', vLabel: 'height' },
  rear: { h: 'y', v: 'z', hLabel: 'width',  vLabel: 'height' },
}

/** 2D rectangle of an item's box in a given view: {a0,a1,b0,b1} (h-axis, v-axis). */
export function projectBox(box, view) {
  const { h, v } = VIEWS[view]
  return { a0: box[h + '0'], a1: box[h + '1'], b0: box[v + '0'], b1: box[v + '1'] }
}

const overlap1 = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 1e-6

/** Ids of placed units that overlap another one, or stick out of the cargo area. */
export function findProblems(items, vehicle) {
  const placed = topLevel(items).filter(i => i.pos)
  const overlapping = new Set()
  const outside = new Set()
  const boxes = placed.map(i => ({ id: i.id, b: boxOf(i) }))

  for (const { id, b } of boxes) {
    if (b.x0 < -1e-6 || b.y0 < -1e-6 || b.z0 < -1e-6 ||
        b.x1 > vehicle.length + 1e-6 || b.y1 > vehicle.width + 1e-6 || b.z1 > vehicle.height + 1e-6) {
      outside.add(id)
    }
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].b, c = boxes[j].b
      if (overlap1(a.x0, a.x1, c.x0, c.x1) && overlap1(a.y0, a.y1, c.y0, c.y1) && overlap1(a.z0, a.z1, c.z0, c.z1)) {
        overlapping.add(boxes[i].id); overlapping.add(boxes[j].id)
      }
    }
  }
  return { overlapping, outside }
}

/** Move an item by (da, db) in the axes of `view`; the third axis is kept. Snaps to `snap` cm. */
export function moveInView(item, view, da, db, vehicle, snap = 1) {
  if (!item.pos) return item
  const { h, v } = VIEWS[view]
  const f = footprint(item)
  const size = { x: f.l, y: f.w, z: item.h }
  const max  = { x: vehicle.length, y: vehicle.width, z: vehicle.height }
  const sn = (n) => Math.round(n / snap) * snap
  const clamp = (axis, val) => Math.min(Math.max(0, sn(val)), Math.max(0, max[axis] - size[axis]))
  const pos = { ...item.pos }
  pos[h] = clamp(h, item.pos[h] + da)
  pos[v] = clamp(v, item.pos[v] + db)
  return { ...item, pos }
}

/** Rotate by 90° around the item's centre and keep it inside the cargo area. */
export function rotateItem(item, vehicle) {
  if (!item.pos) return item
  const f0 = footprint(item)
  const rot = item.pos.rot === 90 ? 0 : 90
  const f1 = rot === 90 ? { l: item.w, w: item.l } : { l: item.l, w: item.w }
  const cx = item.pos.x + f0.l / 2, cy = item.pos.y + f0.w / 2
  const x = Math.min(Math.max(0, Math.round(cx - f1.l / 2)), Math.max(0, vehicle.length - f1.l))
  const y = Math.min(Math.max(0, Math.round(cy - f1.w / 2)), Math.max(0, vehicle.width - f1.w))
  return { ...item, pos: { ...item.pos, x, y, rot } }
}

/** Place an item on the floor at the first free spot (scan the floor in `step` cm), else at 0,0,0. */
export function autoPlace(ld, id, step = 5) {
  const item = ld.items.find(i => i.id === id)
  if (!item || item.parentId) return ld
  const { vehicle } = ld
  const others = topLevel(ld.items).filter(i => i.pos && i.id !== id)
  const tryAt = (x, y) => {
    const cand = { ...item, pos: { x, y, z: 0, rot: 0 } }
    const b = boxOf(cand)
    if (b.x1 > vehicle.length || b.y1 > vehicle.width || b.z1 > vehicle.height) return null
    const clash = others.some(o => {
      const c = boxOf(o)
      return overlap1(b.x0, b.x1, c.x0, c.x1) && overlap1(b.y0, b.y1, c.y0, c.y1) && overlap1(b.z0, b.z1, c.z0, c.z1)
    })
    return clash ? null : cand.pos
  }
  let pos = null
  for (let x = 0; x <= vehicle.length && !pos; x += step) {
    for (let y = 0; y <= vehicle.width && !pos; y += step) pos = tryAt(x, y)
  }
  return updateItem(ld, id, { pos: pos || { x: 0, y: 0, z: 0, rot: 0 } })
}

/** Deterministic colour per category (so the plan is readable at a glance). */
export function colorFor(item) {
  if (item.isCase) return '#6366f1'
  const key = item.category || item.name || 'x'
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return `hsl(${h % 360} 55% 52%)`
}

/** Placed units sorted by loadOrder (unordered last, then by name). */
export function loadingSequence(items) {
  return topLevel(items).slice().sort((a, b) => {
    const ao = a.loadOrder ?? Infinity, bo = b.loadOrder ?? Infinity
    return ao === bo ? (a.name || '').localeCompare(b.name || '') : ao - bo
  })
}
