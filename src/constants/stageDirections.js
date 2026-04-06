// 8 compass directions for stage FOH (audience direction)
export const COMPASS = ['N','NE','E','SE','S','SW','W','NW']

export const COMPASS_LABELS = {
  N:  '↑ N',  NE: '↗ NE', E:  '→ E',  SE: '↘ SE',
  S:  '↓ S',  SW: '↙ SW', W:  '← W',  NW: '↖ NW',
}

// Arrow text for SVG export (stage is rotated, arrow always points down on stage)
export const COMPASS_ARROW = {
  N:  '↑ Audience', NE: '↗ Audience', E:  '→ Audience', SE: '↘ Audience',
  S:  '↓ Audience', SW: '↙ Audience', W:  '← Audience', NW: '↖ Audience',
}

// CSS rotation degrees — stage rotates so ↓ arrow points toward audience
export const DIR_ROTATION = {
  N: 180, NE: 135, E: 90, SE: 45, S: 0, SW: -45, W: -90, NW: -135,
}

// Base compass grid offset per direction
// Two stages with the SAME direction will be placed side-by-side (spread),
// not stacked on the same grid cell.

/**
 * Compute canvas positions for stages.
 *
 * Rule: stages are placed LEFT TO RIGHT in definition order.
 * The FOH direction ONLY affects rotation — not position.
 * Gap between stages: 20px (based on unrotated bounding box).
 *
 * Returns [{...stage, x, y}]
 */
export function computeStageLayout(stages) {
  if (!stages || stages.length === 0) return []

  const GAP = 20
  let x = 100
  const y = 150   // leave vertical room for label above stage

  return stages.map(stage => {
    const result = { ...stage, x, y }
    x += (stage.width || 600) + GAP
    return result
  })
}
