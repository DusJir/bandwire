import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'
import { CABLE_TYPES } from '../../constants/cableTypes'
import useStore from '../../store/useStore'

export default function CableEdge({
  id, source, target, sourceHandleId, targetHandleId,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data = {}, selected,
}) {
  const { cableType = 'XLR', label = '' } = data

  const customCableTypes = useStore(s => s.customCableTypes)
  const settings         = useStore(s => s.settings)
  const scene            = useStore(s => s.currentScene())

  // Merge factory + custom into one lookup
  const allCables = {
    ...CABLE_TYPES,
    ...Object.fromEntries((customCableTypes || []).map(c => [c.id, c])),
  }
  const cable = allCables[cableType] || CABLE_TYPES.XLR

  // Mismatch detection — only when setting is enabled and cable has compatible list
  const hasMismatch = settings?.enforceConnectorTypes && (() => {
    if (!cable.compatible?.length) return false
    const nodes = scene?.nodes || []
    const srcNode = nodes.find(n => n.id === source)
    const tgtNode = nodes.find(n => n.id === target)

    // Find the specific port by handle ID (format: nodeId__side__idx)
    const getConnector = (node, handleId, side) => {
      if (!node || !handleId) return null
      const parts = handleId.split('__')
      const idx = parseInt(parts[2])
      const ports = side === 'out' ? node.data?.outputs : node.data?.inputs
      return ports?.[idx]?.connector || null
    }

    const srcConnector = getConnector(srcNode, sourceHandleId, 'out')
    const tgtConnector = getConnector(tgtNode, targetHandleId, 'in')

    const srcOk = !srcConnector || cable.compatible.includes(srcConnector)
    const tgtOk = !tgtConnector || cable.compatible.includes(tgtConnector)
    return !srcOk || !tgtOk
  })()

  const strokeColor = hasMismatch ? '#EF4444' : cable.color
  const strokeWidth = selected ? 3 : 2

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: hasMismatch ? '4 3' : (cable.dash || undefined),
        }}
      />
      {(label || hasMismatch) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              fontFamily: 'inherit',
              background: hasMismatch ? '#3f0f0f' : '#0a0a12',
              color: strokeColor,
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${strokeColor}`,
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
            className="nodrag nopan"
            title={hasMismatch ? `Connector mismatch — ${cable.label} is not compatible with this port` : undefined}
          >
            {hasMismatch ? `⚠ ${label || cable.label.split(' ')[0]}` : label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
