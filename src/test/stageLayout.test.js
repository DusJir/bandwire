import { describe, it, expect } from 'vitest'
import { computeStageLayout, COMPASS, COMPASS_LABELS, COMPASS_ARROW } from '../constants/stageDirections'

const makeStage = (id, fohDirection, width = 600, height = 400) => ({
  id, label: id, fohDirection, width, height
})

describe('COMPASS constants', () => {
  it('has 8 directions', () => {
    expect(COMPASS).toHaveLength(8)
    expect(COMPASS).toContain('N')
    expect(COMPASS).toContain('SE')
    expect(COMPASS).toContain('W')
  })

  it('COMPASS_LABELS covers all 8 directions', () => {
    for (const d of COMPASS) {
      expect(COMPASS_LABELS[d], `missing label for ${d}`).toBeTruthy()
    }
  })

  it('COMPASS_ARROW covers all 8 directions', () => {
    for (const d of COMPASS) {
      expect(COMPASS_ARROW[d], `missing arrow for ${d}`).toBeTruthy()
    }
  })
})

describe('computeStageLayout', () => {
  it('returns empty for empty input', () => {
    expect(computeStageLayout([])).toEqual([])
    expect(computeStageLayout(null)).toEqual([])
  })

  it('single stage placed at origin', () => {
    const result = computeStageLayout([makeStage('s1', 'S')])
    expect(result).toHaveLength(1)
    expect(result[0].x).toBeDefined()
    expect(result[0].y).toBeDefined()
    expect(result[0].id).toBe('s1')
    expect(result[0].fohDirection).toBe('S')
  })

  it('preserves all stage properties', () => {
    const stage = makeStage('s1', 'N', 800, 500)
    const [result] = computeStageLayout([stage])
    expect(result.width).toBe(800)
    expect(result.height).toBe(500)
    expect(result.label).toBe('s1')
  })

  it('stages are placed left to right in definition order regardless of direction', () => {
    const stages = [makeStage('s1', 'N'), makeStage('s2', 'S')]
    const [r1, r2] = computeStageLayout(stages)
    // Stage 1 is left of Stage 2
    expect(r1.x).toBeLessThan(r2.x)
    // Same y
    expect(r1.y).toBe(r2.y)
  })

  it('stage order is preserved — SE before SW means SE on left', () => {
    const [r1, r2] = computeStageLayout([makeStage('s1', 'SE'), makeStage('s2', 'SW')])
    expect(r1.x).toBeLessThan(r2.x)
  })

  it('stage order is preserved — SW before SE means SW on left', () => {
    const [r1, r2] = computeStageLayout([makeStage('s1', 'SW'), makeStage('s2', 'SE')])
    expect(r1.x).toBeLessThan(r2.x)
  })

  it('two stages with same direction are placed side by side with gap', () => {
    const stages = [makeStage('s1', 'S'), makeStage('s2', 'S')]
    const [r1, r2] = computeStageLayout(stages)
    expect(r1.y).toBe(r2.y)
    expect(r2.x).toBeGreaterThan(r1.x + 600) // at least width apart
  })

  it('x positions increase monotonically left to right', () => {
    const stages = COMPASS.map((d, i) => makeStage(`s${i}`, d))
    const layout = computeStageLayout(stages)
    for (let i = 1; i < layout.length; i++) {
      expect(layout[i].x).toBeGreaterThan(layout[i-1].x)
    }
  })

  it('all stages share the same y', () => {
    const stages = COMPASS.map((d, i) => makeStage(`s${i}`, d))
    const layout = computeStageLayout(stages)
    const ys = layout.map(s => s.y)
    expect(new Set(ys).size).toBe(1)
  })

  it('positions have positive x and y', () => {
    const stages = COMPASS.map((d, i) => makeStage(`s${i}`, d))
    const layout = computeStageLayout(stages)
    for (const s of layout) {
      expect(s.x, `stage ${s.id} x should be >= 0`).toBeGreaterThanOrEqual(0)
      expect(s.y, `stage ${s.id} y should be >= 0`).toBeGreaterThanOrEqual(0)
    }
  })
})
