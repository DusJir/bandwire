/**
 * i18n coverage test
 * Ensures every t('key') call in JSX components has a corresponding entry in en.js
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const SRC = join(__dirname, '..')
const EN_JS = readFileSync(join(SRC, 'i18n/locales/en.js'), 'utf8')

function getAllJsxFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (!['node_modules', 'test', 'locales'].includes(entry)) {
        results.push(...getAllJsxFiles(full))
      }
    } else if (entry.endsWith('.jsx') || (entry.endsWith('.js') && !entry.endsWith('.test.js'))) {
      results.push(full)
    }
  }
  return results
}

function keyExistsInEn(key) {
  // Match:  key: or  'key': or  "key":
  return new RegExp(`[\\s,{]${key}\\s*:`).test(EN_JS)
}

describe('i18n coverage', () => {
  const files = getAllJsxFiles(join(SRC, 'components'))

  it('all t("key") calls in components have entries in en.js', () => {
    const missing = []

    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      const keys = [...src.matchAll(/\bt\('([a-zA-Z][a-zA-Z0-9]+)'\)/g)].map(m => m[1])

      for (const key of keys) {
        if (!keyExistsInEn(key)) {
          const rel = file.replace(SRC + '/', '')
          missing.push(`${rel}: '${key}'`)
        }
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing i18n keys in en.js:\n${missing.map(m => '  ' + m).join('\n')}`
      )
    }
  })
})
