import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'
import { CABLE_TYPES } from '../../constants/cableTypes'

export default function CableEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data = {}, selected,
}) {
  const { cableType = 'XLR', label = '' } = data
  const cable = CABLE_TYPES[cableType] || CABLE_TYPES.XLR

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  })

  const strokeWidth = selected ? 3 : 2

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: cable.color,
          strokeWidth,
          strokeDasharray: cable.dash || undefined,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              fontFamily: 'inherit',
              background: '#0a0a12',
              color: cable.color,
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${cable.color}`,
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
