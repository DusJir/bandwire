import { memo } from 'react'
import { Handle, Position } from 'reactflow'

// Gateway node inside a rack scene representing a connection from/to the outside
export default memo(function RackPortNode({ id, data, selected }) {
  const { label, connector, direction } = data
  // direction: 'in' = signal comes from outside into rack, 'out' = signal goes from rack to outside

  const isIn = direction === 'in'

  return (
    <div className={'rack-port-node' + (selected ? ' selected' : '') + (isIn ? ' rack-port-in' : ' rack-port-out')}>
      <div className="rack-port-direction">{isIn ? '↓ IN' : 'OUT ↑'}</div>
      <div className="rack-port-label">{label || (isIn ? 'In' : 'Out')}</div>
      {connector && <div className="rack-port-connector">{connector}</div>}
      {/* IN port: signal enters rack from outside, so inside rack it's a SOURCE */}
      {isIn && (
        <Handle
          type="source"
          position={Position.Bottom}
          id={`${id}__out__0`}
          title={label}
        />
      )}
      {/* OUT port: signal leaves rack to outside, so inside rack it's a TARGET */}
      {!isIn && (
        <Handle
          type="target"
          position={Position.Top}
          id={`${id}__in__0`}
          title={label}
        />
      )}
    </div>
  )
})
