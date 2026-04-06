import { describe, it, expect } from 'vitest'
import { FACTORY_DEVICE_META } from '../constants/factoryDeviceMeta'
import { CONNECTOR_TYPES } from '../constants/connectorTypes'

describe('FACTORY_DEVICE_META', () => {
  it('is a non-empty object', () => {
    expect(Object.keys(FACTORY_DEVICE_META).length).toBeGreaterThan(10)
  })

  it('all keys follow category/name format', () => {
    for (const key of Object.keys(FACTORY_DEVICE_META)) {
      expect(key, `Key "${key}" missing slash`).toContain('/')
    }
  })

  it('each entry has tags array', () => {
    for (const [key, meta] of Object.entries(FACTORY_DEVICE_META)) {
      expect(Array.isArray(meta.tags), `${key}.tags not array`).toBe(true)
      expect(meta.tags.length, `${key}.tags empty`).toBeGreaterThan(0)
    }
  })

  it('port connectors reference valid CONNECTOR_TYPES', () => {
    for (const [key, meta] of Object.entries(FACTORY_DEVICE_META)) {
      for (const port of [...(meta.defaultInputs||[]), ...(meta.defaultOutputs||[])]) {
        if (port.connector) {
          expect(CONNECTOR_TYPES, `${key} port uses unknown connector "${port.connector}"`).toContain(port.connector)
        }
      }
    }
  })
})
