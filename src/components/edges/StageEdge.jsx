import { getStraightPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'
import useStore from '../../store/useStore'

export default function StageEdge({
  id, source, sourceX, sourceY, targetX, targetY,
  data = {}, selected,
}) {
  const settings  = useStore(s => s.settings)
  const stageData = useStore(s => s.stageData)

  // Determine color from cable role
  const cableRole = data?.stageRole || null
  const fohColor  = settings.stageFohColor || '#EF4444'
  const color = cableRole === 'foh'
    ? fohColor
    : (data?.color || '#888888')

  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: data?.dash || undefined,
          opacity: 0.85,
        }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 9,
              background: 'var(--bg-panel)',
              color: color,
              padding: '1px 5px',
              borderRadius: 3,
              border: `1px solid ${color}`,
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >{data.label}</div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
