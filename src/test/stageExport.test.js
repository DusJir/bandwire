import { describe, it, expect } from 'vitest'

// Pure logic extracted from StageExportModal — test SVG/HTML generation
// We test the data transformation, not the React component itself

const buildRiderHtml = (projectName, rider) => {
  const sections = [
    ['Technical Requirements', rider.techRequirements],
    ['Monitoring',             rider.monitoring],
    ['Backline',               rider.backline],
    ['Contact',                rider.contact],
    ['Notes',                  rider.notes],
  ].filter(([, v]) => v?.trim())
  return { sections, hasContent: sections.length > 0 }
}

const getNodeColor = (node, mode, fohColor, personalColor) => {
  if (node.type === 'stageBackground' || node.type === 'stageOutline') return null
  const role = node.data?.stageRole
  if (mode === 'full') {
    return role === 'foh' ? fohColor : role === 'personal' ? (node.data.stageColor || personalColor) : '#888'
  }
  if (mode === 'engineer') return role === 'foh' ? fohColor : '#ccc'
  if (mode === 'band')     return role === 'personal' ? (node.data.stageColor || personalColor) : '#ccc'
  return '#888'
}

describe('rider HTML builder', () => {
  it('returns empty sections for empty rider', () => {
    const result = buildRiderHtml('Test', {})
    expect(result.hasContent).toBe(false)
    expect(result.sections).toHaveLength(0)
  })

  it('includes only populated fields', () => {
    const result = buildRiderHtml('Test', { techRequirements: 'PA needed', notes: 'Call ahead' })
    expect(result.sections).toHaveLength(2)
    expect(result.sections[0][0]).toBe('Technical Requirements')
    expect(result.sections[1][0]).toBe('Notes')
  })

  it('filters out whitespace-only fields', () => {
    const result = buildRiderHtml('Test', { techRequirements: '   ', notes: 'real note' })
    expect(result.sections).toHaveLength(1)
  })
})

describe('stage node color logic', () => {
  const foh = '#EF4444'
  const personal = '#6366f1'

  const fohNode      = { type: 'stageDevice', data: { stageRole: 'foh' } }
  const personalNode = { type: 'stageDevice', data: { stageRole: 'personal' } }
  const customNode   = { type: 'stageDevice', data: { stageRole: 'personal', stageColor: '#00FF00' } }
  const noRoleNode   = { type: 'stageDevice', data: { stageRole: null } }
  const outlineNode  = { type: 'stageOutline', data: {} }

  it('full mode: FOH node gets FOH color', () => {
    expect(getNodeColor(fohNode, 'full', foh, personal)).toBe(foh)
  })
  it('full mode: personal node gets personal color', () => {
    expect(getNodeColor(personalNode, 'full', foh, personal)).toBe(personal)
  })
  it('full mode: custom color overrides personal default', () => {
    expect(getNodeColor(customNode, 'full', foh, personal)).toBe('#00FF00')
  })
  it('full mode: no-role node gets grey', () => {
    expect(getNodeColor(noRoleNode, 'full', foh, personal)).toBe('#888')
  })
  it('engineer mode: FOH highlighted, personal greyed', () => {
    expect(getNodeColor(fohNode, 'engineer', foh, personal)).toBe(foh)
    expect(getNodeColor(personalNode, 'engineer', foh, personal)).toBe('#ccc')
  })
  it('band mode: personal highlighted, FOH greyed', () => {
    expect(getNodeColor(personalNode, 'band', foh, personal)).toBe(personal)
    expect(getNodeColor(fohNode, 'band', foh, personal)).toBe('#ccc')
  })
  it('outline node always returns null', () => {
    expect(getNodeColor(outlineNode, 'full', foh, personal)).toBeNull()
    expect(getNodeColor(outlineNode, 'engineer', foh, personal)).toBeNull()
  })
})
