const FOH_DIRECTIONS = ['bottom','top','left','right','bottom-left','bottom-right','top-left','top-right']

const ARROW_MAP = {
  'bottom':       { text: '▼ FOH / Audience', style: { bottom: 10, left: '50%', transform: 'translateX(-50%)' } },
  'top':          { text: '▲ FOH / Audience', style: { top: 10,    left: '50%', transform: 'translateX(-50%)' } },
  'left':         { text: '◀ FOH',            style: { left: 10,   top:  '50%', transform: 'translateY(-50%)' } },
  'right':        { text: 'FOH ▶',            style: { right: 10,  top:  '50%', transform: 'translateY(-50%)' } },
  'bottom-left':  { text: '↙ FOH',            style: { bottom: 10, left: 10 } },
  'bottom-right': { text: 'FOH ↘',            style: { bottom: 10, right: 10 } },
  'top-left':     { text: '↖ FOH',            style: { top: 10,    left: 10 } },
  'top-right':    { text: 'FOH ↗',            style: { top: 10,    right: 10 } },
}

export default function StageOutlineNode({ id, data, selected }) {
  const {
    width = 600, height = 400,
    fohDirection = 'bottom',
    label = 'Stage',
  } = data

  const arrow = ARROW_MAP[fohDirection] || ARROW_MAP.bottom

  return (
    <div
      className={'stage-outline' + (selected ? ' selected' : '')}
      style={{ width, height, position: 'relative' }}
    >
      <div className="stage-outline-label">{label}</div>
      <div className="stage-outline-foh" style={{ ...arrow.style, position: 'absolute' }}>
        {arrow.text}
      </div>
    </div>
  )
}

export { FOH_DIRECTIONS }
