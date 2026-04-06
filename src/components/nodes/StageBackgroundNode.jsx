// For direction at angle θ from North, CSS rotation = θ - 180
// N=0°, NE=45°, E=90°, SE=135°, S=180°, SW=225°, W=270°, NW=315°
const DIR_ROTATION = {
  N: 180, NE: -135, E: -90, SE: -45, S: 0, SW: 45, W: 90, NW: 135,
}

export default function StageBackgroundNode({ data }) {
  const {
    width        = 600,
    height       = 400,
    fohDirection = 'S',
    label        = 'Stage',
  } = data

  const rotation = DIR_ROTATION[fohDirection] ?? 0
  const color    = 'var(--border-active)'

  return (
    <div style={{
      width,
      height,
      position:        'relative',
      boxSizing:       'border-box',
      userSelect:      'none',
      border:          `2px dashed ${color}`,
      borderRadius:    10,
      background:      'rgba(99,102,241,0.04)',
      transform:       `rotate(${rotation}deg)`,
      transformOrigin: 'center center',
    }}>
      {/* Label — rotates with stage */}
      <div style={{
        position:      'absolute',
        top:           10,
        left:          '50%',
        transform:     'translateX(-50%)',
        fontSize:      11,
        fontWeight:    700,
        color,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        whiteSpace:    'nowrap',
        pointerEvents: 'none',
      }}>{label}</div>

      {/* Arrow always ↓ → points toward audience after rotation */}
      <div style={{
        position:      'absolute',
        bottom:        12,
        left:          '50%',
        transform:     'translateX(-50%)',
        fontSize:      20,
        color,
        lineHeight:    1,
        pointerEvents: 'none',
      }}>↓</div>
    </div>
  )
}
