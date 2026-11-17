import { describe, it, expect, beforeAll, vi } from 'vitest'
import { emptyLoadData, addItem, updateItem, autoPlace } from '../utils/load'

let buildLoadListHtml, buildVanHtml
beforeAll(async () => {
  // i18n bootstrap reads localStorage, which the node test environment lacks
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
  ;({ buildLoadListHtml, buildVanHtml } = await import('../components/Load/loadExport'))
})

const sample = () => {
  let ld = emptyLoadData()
  ld = addItem(ld, { name: 'Guitar <case>', isCase: true, category: 'Backline', loadOrder: 2 })
  ld = addItem(ld, { name: 'Strat', category: 'Backline' })
  ld = addItem(ld, { name: 'Mixer', category: 'FOH', qty: 3, note: 'first' })
  ld = updateItem(ld, ld.items[1].id, { parentId: ld.items[0].id })
  ld = autoPlace(ld, ld.items[0].id)
  ld = autoPlace(ld, ld.items[2].id)
  return ld
}

describe('load list html', () => {
  it('contains every item, escapes html, groups case contents under the case', () => {
    const html = buildLoadListHtml(sample(), 'My <Band>')
    expect(html).toContain('Guitar &lt;case&gt;')
    expect(html).toContain('My &lt;Band&gt;')
    expect(html).not.toContain('<case>')
    expect(html.indexOf('Guitar')).toBeLessThan(html.indexOf('Strat'))
    expect(html).toContain('3×')
    expect(html).toContain('A4 portrait')
  })
  it('has two tick boxes per row (out / back) and a loading-order column only when used', () => {
    const withOrder = buildLoadListHtml(sample(), 'x')
    expect(withOrder).toContain('<th class="n">#</th>')
    const ld = { ...sample(), items: sample().items.map(i => ({ ...i, loadOrder: null })) }
    expect(buildLoadListHtml(ld, 'x')).not.toContain('<th class="n">#</th>')
    const rows = (withOrder.match(/class="box"/g) || []).length
    expect(rows % 2).toBe(0)
  })
})

describe('van plan html', () => {
  it('renders three views as static svg and the loading sequence', () => {
    const html = buildVanHtml(sample(), 'x')
    expect((html.match(/<svg/g) || []).length).toBe(3)
    expect(html).toContain('A4 landscape')
    expect(html).toContain('Mixer')
    expect(html).not.toContain('cursor:grab')
  })
})
