#!/usr/bin/env node
// Regenerates public/icon-manifest.json from public/icons/**/*.svg
const fs   = require('fs')
const path = require('path')

const iconsDir  = path.join(__dirname, '../public/icons')
const outputFile = path.join(__dirname, '../public/icon-manifest.json')

const icons = []

for (const category of fs.readdirSync(iconsDir).sort()) {
  const catPath = path.join(iconsDir, category)
  if (!fs.statSync(catPath).isDirectory()) continue
  for (const file of fs.readdirSync(catPath).sort()) {
    if (!file.endsWith('.svg')) continue
    const name = file.replace('.svg', '')
    icons.push({
      category,
      name,
      path: `icons/${category}/${file}`,
    })
  }
}

fs.writeFileSync(outputFile, JSON.stringify(icons, null, 2))
console.log(`Generated icon-manifest.json: ${icons.length} icons`)
