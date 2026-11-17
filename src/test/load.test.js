import { describe, it, expect } from 'vitest'
import {
  emptyLoadData, normalizeLoadData, addItem, updateItem, removeItem, buildSections, totals,
  footprint, boxOf, projectBox, findProblems, moveInView, rotateItem, autoPlace, loadingSequence, topLevel,
} from '../utils/load'

const build = () => {
  let ld = emptyLoadData()
  ld = addItem(ld, { name: 'Guitar case', isCase: true, category: 'Backline', l: 110, w: 40, h: 15 })
  ld = addItem(ld, { name: 'Strat', category: 'Backline', l: 100, w: 35, h: 10 })
  ld = addItem(ld, { name: 'Mixer', category: 'FOH', l: 60, w: 50, h: 20, qty: 2 })
  ld = addItem(ld, { name: 'Cables', category: '' })
  return ld
}
const byName = (ld, n) => ld.items.find(i => i.name === n)

describe('load data', () => {
  it('normalizes missing / broken input', () => {
    expect(normalizeLoadData(null).items).toEqual([])
    const n = normalizeLoadData({ items: [{ name: 'x', qty: 0, l: -5 }] })
    expect(n.items[0].qty).toBe(1)
    expect(n.items[0].l).toBeGreaterThanOrEqual(1)
    expect(n.vehicle.length).toBeGreaterThan(0)
  })
  it('circle keeps width equal to length', () => {
    let ld = addItem(emptyLoadData(), { name: 'Drum', shape: 'circle', l: 40, w: 99 })
    expect(ld.items[0].w).toBe(40)
    ld = updateItem(ld, ld.items[0].id, { l: 55 })
    expect(ld.items[0].w).toBe(55)
  })
})

describe('cases', () => {
  it('item can be packed into a case and is then unplaced', () => {
    let ld = build()
    const strat = byName(ld, 'Strat'), gcase = byName(ld, 'Guitar case')
    ld = updateItem(ld, strat.id, { pos: { x: 0, y: 0, z: 0 } })
    ld = updateItem(ld, strat.id, { parentId: gcase.id })
    expect(byName(ld, 'Strat').parentId).toBe(gcase.id)
    expect(byName(ld, 'Strat').pos).toBeNull()
  })
  it('rejects a non-case parent, self and case-in-case', () => {
    let ld = build()
    const strat = byName(ld, 'Strat'), mixer = byName(ld, 'Mixer'), gcase = byName(ld, 'Guitar case')
    ld = updateItem(ld, strat.id, { parentId: mixer.id })
    expect(byName(ld, 'Strat').parentId).toBeNull()
    ld = updateItem(ld, gcase.id, { parentId: gcase.id })
    expect(byName(ld, 'Guitar case').parentId).toBeNull()
    ld = addItem(ld, { name: 'Case 2', isCase: true, parentId: gcase.id })
    expect(byName(ld, 'Case 2').parentId).toBeNull()
  })
  it('deleting a case releases its contents; un-casing releases them too', () => {
    let ld = build()
    const strat = byName(ld, 'Strat'), gcase = byName(ld, 'Guitar case')
    ld = updateItem(ld, strat.id, { parentId: gcase.id })
    expect(removeItem(ld, gcase.id).items.find(i => i.name === 'Strat').parentId).toBeNull()
    expect(updateItem(ld, gcase.id, { isCase: false }).items.find(i => i.name === 'Strat').parentId).toBeNull()
  })
  it('sections: by category, A-Z, empty last, case followed by contents', () => {
    let ld = build()
    ld = updateItem(ld, byName(ld, 'Strat').id, { parentId: byName(ld, 'Guitar case').id })
    const s = buildSections(ld.items)
    expect(s.map(x => x.name)).toEqual(['Backline', 'FOH', ''])
    expect(s[0].rows.map(r => [r.item.name, r.depth])).toEqual([['Guitar case', 0], ['Strat', 1]])
  })
  it('totals count pieces by qty', () => {
    const t = totals(build().items)
    expect(t.lines).toBe(4)
    expect(t.pieces).toBe(5)
    expect(t.cases).toBe(1)
  })
})

describe('geometry', () => {
  const v = { length: 200, width: 100, height: 100 }
  const mk = (pos, extra = {}) => ({ ...addItem(emptyLoadData(), { name: 'a', l: 50, w: 30, h: 20, ...extra }).items[0], pos })

  it('rotation swaps footprint', () => {
    expect(footprint(mk({ x: 0, y: 0, z: 0, rot: 90 }))).toEqual({ l: 30, w: 50 })
  })
  it('projects boxes into the three views', () => {
    const b = boxOf(mk({ x: 10, y: 20, z: 5, rot: 0 }))
    expect(projectBox(b, 'top')).toEqual({ a0: 10, a1: 60, b0: 20, b1: 50 })
    expect(projectBox(b, 'side')).toEqual({ a0: 10, a1: 60, b0: 5, b1: 25 })
    expect(projectBox(b, 'rear')).toEqual({ a0: 20, a1: 50, b0: 5, b1: 25 })
  })
  it('dragging in top view keeps z; in side view keeps y', () => {
    const it0 = mk({ x: 10, y: 10, z: 30, rot: 0 })
    const top = moveInView(it0, 'top', 20, 15, v)
    expect([top.pos.x, top.pos.y, top.pos.z]).toEqual([30, 25, 30])
    const side = moveInView(it0, 'side', 5, -10, v)
    expect([side.pos.x, side.pos.y, side.pos.z]).toEqual([15, 10, 20])
  })
  it('moves are clamped to the cargo area', () => {
    const it0 = mk({ x: 150, y: 70, z: 0, rot: 0 })
    const m = moveInView(it0, 'top', 999, 999, v)
    expect([m.pos.x, m.pos.y]).toEqual([150, 70])
    expect(moveInView(it0, 'top', -999, -999, v).pos).toMatchObject({ x: 0, y: 0 })
  })
  it('detects overlap and out-of-bounds, but not touching boxes', () => {
    let ld = emptyLoadData()
    ld = { ...ld, vehicle: v }
    ld = addItem(ld, { name: 'A', l: 50, w: 30, h: 20 })
    ld = addItem(ld, { name: 'B', l: 50, w: 30, h: 20 })
    ld = addItem(ld, { name: 'C', l: 50, w: 30, h: 20 })
    const [a, b, c] = ld.items
    ld = updateItem(ld, a.id, { pos: { x: 0, y: 0, z: 0 } })
    ld = updateItem(ld, b.id, { pos: { x: 50, y: 0, z: 0 } })   // touching A
    ld = updateItem(ld, c.id, { pos: { x: 180, y: 0, z: 0 } })  // sticks out (180+50 > 200)
    let p = findProblems(ld.items, v)
    expect(p.overlapping.size).toBe(0)
    expect([...p.outside]).toEqual([c.id])
    ld = updateItem(ld, b.id, { pos: { x: 40, y: 0, z: 0 } })    // overlaps A
    p = findProblems(ld.items, v)
    expect(p.overlapping.has(a.id) && p.overlapping.has(b.id)).toBe(true)
    ld = updateItem(ld, b.id, { pos: { x: 40, y: 0, z: 20 } })   // stacked on A → fine
    expect(findProblems(ld.items, v).overlapping.size).toBe(0)
  })
  it('items inside a case are never checked', () => {
    let ld = { ...emptyLoadData(), vehicle: v }
    ld = addItem(ld, { name: 'Case', isCase: true })
    ld = addItem(ld, { name: 'In' })
    ld = updateItem(ld, ld.items[1].id, { parentId: ld.items[0].id })
    expect(findProblems(ld.items, v).overlapping.size).toBe(0)
  })
  it('rotate keeps the item inside', () => {
    const r = rotateItem(mk({ x: 150, y: 0, z: 0, rot: 0 }), v)
    expect(r.pos.rot).toBe(90)
    const b = boxOf(r)
    expect(b.x1).toBeLessThanOrEqual(200)
    expect(b.y1).toBeLessThanOrEqual(100)
  })
  it('autoPlace finds a free floor spot', () => {
    let ld = { ...emptyLoadData(), vehicle: v }
    ld = addItem(ld, { name: 'A', l: 100, w: 100, h: 20 })
    ld = addItem(ld, { name: 'B', l: 50, w: 30, h: 20 })
    ld = autoPlace(ld, ld.items[0].id)
    ld = autoPlace(ld, ld.items[1].id)
    expect(findProblems(ld.items, v).overlapping.size).toBe(0)
    expect(ld.items[1].pos.x).toBeGreaterThanOrEqual(100)
  })
})

describe('loading sequence', () => {
  it('sorts by loadOrder, unordered last, ignores packed items', () => {
    let ld = build()
    ld = updateItem(ld, byName(ld, 'Mixer').id, { loadOrder: 1 })
    ld = updateItem(ld, byName(ld, 'Guitar case').id, { loadOrder: 2 })
    ld = updateItem(ld, byName(ld, 'Strat').id, { parentId: byName(ld, 'Guitar case').id })
    expect(loadingSequence(ld.items).map(i => i.name)).toEqual(['Mixer', 'Guitar case', 'Cables'])
    expect(topLevel(ld.items)).toHaveLength(3)
  })
})
