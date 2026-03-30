import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import useStore from '../../store/useStore'

const BODY_H = 40
const SLOT_H = 20

export default memo(function RackNode({ id, data, selected }) {
  const { label = 'Rack', color, notes, inputs = [], outputs = [], physicalDevice } = data
  const scene = useStore(s => s.scenes['rack-' + id])
  const nodeCount = (scene?.nodes || []).filter(n => n.type !== 'rackPort').length

  const rackIconSrc = useStore(s =>
    s.iconsLibrary['rack']?.find(ic => ic.name === 'rack')?.src || null
  )

  const ins  = inputs.length  > 0 ? inputs  : []
  const outs = outputs.length > 0 ? outputs : []
  const portRows = Math.max(ins.length, outs.length, 1)
  const nodeHeight = BODY_H + portRows * SLOT_H + (notes ? 28 : 0)

  const handleTop = (i) => BODY_H + (i + 0.5) * SLOT_H
  const hid = (side, _, idx) => `${id}__${side}__${idx}`

  return (
    <div
      className={'hw-node rack-thumb' + (selected ? ' selected' : '')}
      style={{ height: nodeHeight, minWidth: 160, maxWidth: 220 }}
    >
      {color && <div className="hw-node-color-bar" style={{ background: color }} />}

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

      {/* Header */}
      <div className="hw-node-body" style={{ height: BODY_H }}>
        <div className="hw-node-icon">
          {rackIconSrc
            ? <img src={rackIconSrc} alt="Rack" draggable={false} />
            : <span style={{fontSize:20}}>🗄</span>
          }
        </div>
        <div className="hw-node-labels">
          <div className="hw-node-label">{label}</div>
          <div className="hw-node-model">
            {physicalDevice
              ? physicalDevice
              : nodeCount > 0 ? `${nodeCount} device${nodeCount !== 1 ? 's' : ''} · dbl-click` : 'double-click to open'
            }
          </div>
        </div>
        <div className="rack-thumb-badge">↗</div>
      </div>

      {/* Port rows */}
      {portRows > 0 && (ins.length > 0 || outs.length > 0) && (
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
      )}

      {notes && <div className="hw-node-notes">{notes}</div>}
    </div>
  )
})
