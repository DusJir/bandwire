import { describe, it, expect } from 'vitest'
import { CABLE_TYPES } from '../constants/cableTypes'
import { CONNECTOR_TYPES } from '../constants/connectorTypes'

describe('CABLE_TYPES', () => {
  it('has required built-in types', () => {
    expect(CABLE_TYPES).toHaveProperty('XLR')
    expect(CABLE_TYPES).toHaveProperty('TRS')
    expect(CABLE_TYPES).toHaveProperty('MIDI')
    expect(CABLE_TYPES).toHaveProperty('USB')
    expect(CABLE_TYPES).toHaveProperty('SPEAKER')
  })

  it('each type has label and color', () => {
    for (const [key, def] of Object.entries(CABLE_TYPES)) {
      expect(def.label, `${key} missing label`).toBeTruthy()
      expect(def.color, `${key} missing color`).toMatch(/^#[0-9a-fA-F]{3,6}$/)
    }
  })

  it('each type has compatible array', () => {
    for (const [key, def] of Object.entries(CABLE_TYPES)) {
      expect(Array.isArray(def.compatible), `${key}.compatible not array`).toBe(true)
    }
  })

  it('compatible connectors reference real CONNECTOR_TYPES', () => {
    for (const [key, def] of Object.entries(CABLE_TYPES)) {
      for (const c of def.compatible) {
        expect(CONNECTOR_TYPES, `${key} references unknown connector "${c}"`).toContain(c)
      }
    }
  })
})

describe('CONNECTOR_TYPES', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(CONNECTOR_TYPES)).toBe(true)
    expect(CONNECTOR_TYPES.length).toBeGreaterThan(10)
    for (const c of CONNECTOR_TYPES) {
      expect(typeof c).toBe('string')
    }
  })

  it('contains common types', () => {
    expect(CONNECTOR_TYPES).toContain('XLR')
    expect(CONNECTOR_TYPES).toContain('TRS 1/4"')
    expect(CONNECTOR_TYPES).toContain('MIDI DIN 5')
    expect(CONNECTOR_TYPES).toContain('USB-A')
  })

  it('has no duplicates', () => {
    const unique = new Set(CONNECTOR_TYPES)
    expect(unique.size).toBe(CONNECTOR_TYPES.length)
  })
})
