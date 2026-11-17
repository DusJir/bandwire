import { describe, it, expect } from 'vitest'
import { buildRows, groupRows, listGroupNames, moveGroup, renderLegendHtml, buildExportHtml, escapeHtml } from '../utils/legend'

const node = (id, label, ins = [], outs = []) => ({
  id, data: { label,
    inputs:  ins.map(l => ({ label: l, connector: 'XLR' })),
    outputs: outs.map(l => ({ label: l, connector: 'XLR' })) },
})
const edge = (id, s, si, t, ti, cableType = 'XLR') => ({
  id, source: s, sourceHandle: `${s}__out__${si}`, target: t, targetHandle: `${t}__in__${ti}`, data: { cableType },
})
const scene = {
  label: 'Main',
  nodes: [node('a', 'Sampler', ['In'], ['Out L', 'Out R']), node('b', 'Mixer', ['Ch1', 'Ch2'], ['Main']), node('c', 'Amp', ['In'], [])],
  edges: [edge('e1', 'a', 0, 'b', 0), edge('e2', 'a', 1, 'b', 1), edge('e3', 'b', 0, 'c', 0, 'TRS')],
}

describe('legend rows', () => {
  it('builds one row per cable with uppercase device and port text', () => {
    const rows = buildRows(scene)
    expect(rows).toHaveLength(3)
    expect(rows[0].src).toBe('SAMPLER OUT L (XLR)')
    expect(rows[0].tgt).toBe('MIXER CH1 (XLR)')
    expect(rows[0].srcPort).toBe('OUT L (XLR)')
  })
  it('skips edges whose nodes are missing', () => {
    const rows = buildRows({ ...scene, edges: [edge('x', 'a', 0, 'zzz', 0)] })
    expect(rows).toHaveLength(0)
  })
})

describe('legend grouping', () => {
  const rows = buildRows(scene)
  it('no grouping gives a single unnamed group in connection order', () => {
    const g = groupRows(rows, { groupBy: 'none' })
    expect(g).toHaveLength(1)
    expect(g[0].items.map(i => i.row.tgt)).toEqual(['MIXER CH1 (XLR)', 'MIXER CH2 (XLR)', 'AMP IN (XLR)'])
  })
  it('groups by source device, A-Z by default', () => {
    expect(groupRows(rows, { groupBy: 'source' }).map(g => g.name)).toEqual(['MIXER', 'SAMPLER'])
  })
  it('groups by cable type', () => {
    const names = groupRows(rows, { groupBy: 'cable' }).map(g => g.name)
    expect(names).toHaveLength(2)
  })
  it('device grouping lists each cable under both ends with IN/OUT', () => {
    const g = groupRows(rows, { groupBy: 'device' })
    const mixer = g.find(x => x.name === 'MIXER')
    expect(mixer.items.map(i => i.dir)).toEqual(['in', 'in', 'out'])
    const total = g.reduce((n, x) => n + x.items.length, 0)
    expect(total).toBe(rows.length * 2)
  })
  it('ioOrder out-first puts outputs before inputs', () => {
    const g = groupRows(rows, { groupBy: 'device', ioOrder: 'out-first' })
    expect(g.find(x => x.name === 'MIXER').items.map(i => i.dir)).toEqual(['out', 'in', 'in'])
  })
  it('custom group order wins, unknown names are ignored, rest is appended', () => {
    const g = groupRows(rows, { groupBy: 'device', groupOrder: ['SAMPLER', 'NOPE', 'AMP'] })
    expect(g.map(x => x.name)).toEqual(['SAMPLER', 'AMP', 'MIXER'])
  })
  it('moveGroup swaps neighbours and stays in range', () => {
    expect(moveGroup(['A', 'B', 'C'], 'B', -1)).toEqual(['B', 'A', 'C'])
    expect(moveGroup(['A', 'B', 'C'], 'A', -1)).toEqual(['A', 'B', 'C'])
    expect(moveGroup(['A', 'B', 'C'], 'C', 1)).toEqual(['A', 'B', 'C'])
  })
  it('listGroupNames honours custom order', () => {
    expect(listGroupNames(rows, { groupBy: 'device', groupOrder: ['SAMPLER'] })[0]).toBe('SAMPLER')
  })
})

describe('legend html', () => {
  it('escapes HTML in labels', () => {
    expect(escapeHtml('<b>"x"&')).toBe('&lt;b&gt;&quot;x&quot;&amp;')
    const s = { ...scene, nodes: [node('a', '<script>', [], ['o']), node('b', 'B', ['i'], [])], edges: [edge('e', 'a', 0, 'b', 0)] }
    const html = renderLegendHtml(buildRows(s), {}, 'light')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;SCRIPT&gt;')
  })
  it('respects column count (clamped 1..3)', () => {
    expect(renderLegendHtml(buildRows(scene), { columns: 2 })).toContain('column-count:2')
    expect(renderLegendHtml(buildRows(scene), { columns: 9 })).toContain('column-count:3')
  })
  it('export html: light theme is white, side layout is a row, no legend when disabled', () => {
    const base = { dataUrl: 'data:image/png;base64,AA', imgSize: { w: 800, h: 400 }, rows: buildRows(scene), appTitle: 'T' }
    const light = buildExportHtml({ ...base, config: { layout: 'side' }, theme: 'light', includeLegend: true })
    expect(light).toContain('#ffffff')
    expect(light).toContain('flex-direction: row')
    expect(light).toContain('landscape')
    const none = buildExportHtml({ ...base, config: {}, theme: 'dark', includeLegend: false })
    expect(none).not.toContain('class="legend"')
    expect(none).toContain('#0a0a12')
  })
  it('portrait page for tall diagrams with legend below', () => {
    const html = buildExportHtml({ dataUrl: 'x', imgSize: { w: 400, h: 900 }, rows: [], config: { layout: 'below' }, theme: 'light', appTitle: 'T', includeLegend: true })
    expect(html).toContain('A4 portrait')
  })
})
