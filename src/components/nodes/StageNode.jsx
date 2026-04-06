import { Handle, Position } from 'reactflow'
import useStore from '../../store/useStore'

export default function StageNode({ id, data, selected }) {
  const { label = 'Device', iconSrc, stageRole = null, stageColor } = data
  const settings = useStore(s => s.settings)

  const isFoh     = stageRole === 'foh'
  const isPersonal = stageRole === 'personal'
  const fohColor      = settings.stageFohColor      || '#EF4444'
  const personalColor = stageColor || settings.stagePersonalColor || '#6366f1'
  const accentColor   = isFoh ? fohColor : isPersonal ? personalColor : 'var(--border-active)'

  const rotation = data.stageRotation || 0

  return (
    <div
      className={'stage-node' + (selected ? ' selected' : '')}
      style={{ borderColor: selected ? 'var(--accent)' : accentColor }}
    >
      {/* Role badge — top-left */}
      {stageRole && (
        <div className="stage-node-badge" style={{ background: accentColor }}>
          {isFoh ? 'H' : 'P'}
        </div>
      )}

      {/* Inner content rotates with stage */}
      <div style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined,
                    display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
        <div className="stage-node-icon">
          {iconSrc
            ? <img src={iconSrc} alt={label} width={32} height={32} draggable={false} />
            : <span style={{fontSize:22}}>📦</span>
          }
        </div>
        <div className="stage-node-label">{label}</div>
      </div>

      {/* Two anchors only — no port rows */}
      <Handle type="source" position={Position.Right} id={`${id}__out`}
        style={{ right: -6, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, background: 'var(--accent)', border: 'none' }}
      />
      <Handle type="target" position={Position.Left} id={`${id}__in`}
        style={{ left: -6, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, background: 'var(--accent)', border: 'none' }}
      />
    </div>
  )
}
