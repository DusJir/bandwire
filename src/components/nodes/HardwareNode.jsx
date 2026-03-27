import { memo } from 'react'
import { Handle, Position } from 'reactflow'

const BODY_H = 40   // px — icon + label header
const SLOT_H = 20   // px — height per port row

export default memo(function HardwareNode({ id, data, selected }) {
  const { label, model, iconSrc, inputs = [], outputs = [], color, notes } = data

  const ins  = inputs.length  > 0 ? inputs  : [{ label: '', connector: '' }]
  const outs = outputs.length > 0 ? outputs : [{ label: '', connector: '' }]

  const portRows = Math.max(ins.length, outs.length)
  const nodeHeight = BODY_H + portRows * SLOT_H + (notes ? 28 : 0)

  // Handle top = body + (row index + 0.5) * slot — exactly center of each row
  const handleTop = (i) => BODY_H + (i + 0.5) * SLOT_H

  const hid = (side, _, idx) => `${id}__${side}__${idx}`

  return (
    <div
      className={'hw-node' + (selected ? ' selected' : '')}
      style={{ height: nodeHeight, minWidth: 160, maxWidth: 220 }}
    >
      {color && <div className="hw-node-color-bar" style={{ background: color }} />}

      {/* Input handles — pixel-perfect aligned to rows */}
      {ins.map((p, i) => (
        <Handle
          key={hid('in', p, i)}
          type="target"
          position={Position.Left}
          id={hid('in', p, i)}
          style={{ top: handleTop(i) }}
          title={[p.label, p.connector].filter(Boolean).join(' · ')}
        />
      ))}

      {/* Output handles */}
      {outs.map((p, i) => (
        <Handle
          key={hid('out', p, i)}
          type="source"
          position={Position.Right}
          id={hid('out', p, i)}
          style={{ top: handleTop(i) }}
          title={[p.label, p.connector].filter(Boolean).join(' · ')}
        />
      ))}

      {/* Header: icon + label */}
      <div className="hw-node-body" style={{ height: BODY_H }}>
        {iconSrc && (
          <div className="hw-node-icon">
            <img src={iconSrc} alt={label} draggable={false} />
          </div>
        )}
        <div className="hw-node-labels">
          <div className="hw-node-label">{label || 'Device'}</div>
          {model && <div className="hw-node-model">{model}</div>}
        </div>
      </div>

      {/* Port rows — height matches handle spacing exactly */}
      <div className="hw-port-rows">
        {Array.from({ length: portRows }).map((_, i) => {
          const inp = ins[i]
          const out = outs[i]
          return (
            <div key={i} className="hw-port-row" style={{ height: SLOT_H }}>
              <div className="hw-port-cell hw-port-cell-in">
                {inp?.label && (
                  <>
                    <span className="hw-node-port-label">{inp.label}</span>
                    {inp.connector && <span className="port-connector-tag">{inp.connector}</span>}
                  </>
                )}
              </div>
              <div className="hw-port-cell hw-port-cell-out">
                {out?.label && (
                  <>
                    {out.connector && <span className="port-connector-tag">{out.connector}</span>}
                    <span className="hw-node-port-label">{out.label}</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {notes && <div className="hw-node-notes">{notes}</div>}
    </div>
  )
})
