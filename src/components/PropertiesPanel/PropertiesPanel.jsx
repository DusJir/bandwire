import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import { CABLE_TYPES } from '../../constants/cableTypes'
import { CONNECTOR_TYPES } from '../../constants/connectorTypes'

const NODE_COLORS = [null, '#6366f1', '#3B82F6', '#10B981', '#F59E0B', '#F97316', '#EC4899', '#EF4444']

export default function PropertiesPanel() {
  const { t } = useTranslation('t')
  const { selectedNodeId, selectedEdgeId, updateNodeData, updateEdgeData, deleteSelected } = useStore()
  const scene = useStore(s => s.currentScene())
  const node  = scene?.nodes.find(n => n.id === selectedNodeId)
  const edge  = scene?.edges.find(e => e.id === selectedEdgeId)

  // Node form
  const [label,   setLabel]   = useState('')
  const [model,   setModel]   = useState('')
  const [notes,   setNotes]   = useState('')
  const [color,   setColor]   = useState(null)
  const [inputs,  setInputs]  = useState([])
  const [outputs, setOutputs] = useState([])

  useEffect(() => {
    if (!node) return
    setLabel(node.data.label || '')
    setModel(node.data.model  || '')
    setNotes(node.data.notes  || '')
    setColor(node.data.color  || null)
    setInputs(node.data.inputs  || [])
    setOutputs(node.data.outputs || [])
  }, [selectedNodeId])

  const flush = (o = {}) => {
    if (!node) return
    updateNodeData(node.id, {
      label:   o.label   !== undefined ? o.label   : label,
      model:   o.model   !== undefined ? o.model   : model,
      notes:   o.notes   !== undefined ? o.notes   : notes,
      color:   o.color   !== undefined ? o.color   : color,
      inputs:  o.inputs  !== undefined ? o.inputs  : inputs,
      outputs: o.outputs !== undefined ? o.outputs : outputs,
    })
  }

  const addPort = (side) => {
    const p = { id: side + '-' + crypto.randomUUID().slice(0,8), label: '', connector: 'XLR' }
    if (side === 'in') { const n=[...inputs,p]; setInputs(n); flush({inputs:n}) }
    else               { const n=[...outputs,p]; setOutputs(n); flush({outputs:n}) }
  }
  const updatePort = (side, idx, field, val) => {
    if (side === 'in') {
      const n = inputs.map((p,i)=>i===idx?{...p,[field]:val}:p); setInputs(n); flush({inputs:n})
    } else {
      const n = outputs.map((p,i)=>i===idx?{...p,[field]:val}:p); setOutputs(n); flush({outputs:n})
    }
  }
  const removePort = (side, idx) => {
    if (side === 'in') { const n=inputs.filter((_,i)=>i!==idx); setInputs(n); flush({inputs:n}) }
    else               { const n=outputs.filter((_,i)=>i!==idx); setOutputs(n); flush({outputs:n}) }
  }

  // Edge form
  const [edgeLabel, setEdgeLabel] = useState('')
  const [edgeCable, setEdgeCable] = useState('XLR')
  useEffect(() => {
    if (!edge) return
    setEdgeLabel(edge.data?.label || '')
    setEdgeCable(edge.data?.cableType || 'XLR')
  }, [selectedEdgeId])
  const flushEdge = (o = {}) => {
    if (!edge) return
    updateEdgeData(edge.id, { data: {
      label:     o.label     !== undefined ? o.label     : edgeLabel,
      cableType: o.cableType !== undefined ? o.cableType : edgeCable,
    }})
  }

  return (
    <div className="props-panel">
      <div className="props-header">
        {node ? t('nodeProperties') : edge ? t('cableProperties') : t('properties')}
      </div>

      {!node && !edge && <div className="props-empty">Select a node or cable to edit its properties.</div>}

      {node && node.type !== 'rack' && (
        <>
          <div className="props-body">
            <div className="field"><label>Label</label>
              <input value={label} onChange={e=>{setLabel(e.target.value);flush({label:e.target.value})}} />
            </div>
            <div className="field"><label>Model / Make</label>
              <input value={model} onChange={e=>{setModel(e.target.value);flush({model:e.target.value})}} placeholder={t('modelPlaceholder')} />
            </div>
            <div className="field"><label>Notes</label>
              <textarea value={notes} onChange={e=>{setNotes(e.target.value);flush({notes:e.target.value})}} placeholder={t('notesPlaceholder')} />
            </div>
            <div className="field"><label>Color accent</label>
              <div className="color-swatches">
                {NODE_COLORS.map((c,i)=>(
                  <div key={i} className={'color-swatch'+(color===c?' active':'')}
                    style={{background:c||'#1e1e30',border:c?undefined:'1px dashed var(--border-active)'}}
                    onClick={()=>{setColor(c);flush({color:c})}} />
                ))}
              </div>
            </div>

            <div className="field-section-title">Inputs</div>
            <div className="port-list">
              {inputs.map((p,i)=>(
                <div key={p.id} className="port-item port-item-full">
                  <input value={p.label} onChange={e=>updatePort('in',i,'label',e.target.value)} placeholder={'In '+(i+1)} />
                  <select value={p.connector||'XLR'} onChange={e=>updatePort('in',i,'connector',e.target.value)} className="port-connector-select">
                    {CONNECTOR_TYPES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <button className="port-del-btn" onClick={()=>removePort('in',i)}>×</button>
                </div>
              ))}
              <button className="add-port-btn" onClick={()=>addPort('in')}>＋ Add input</button>
            </div>

            <div className="field-section-title">Outputs</div>
            <div className="port-list">
              {outputs.map((p,i)=>(
                <div key={p.id} className="port-item port-item-full">
                  <input value={p.label} onChange={e=>updatePort('out',i,'label',e.target.value)} placeholder={'Out '+(i+1)} />
                  <select value={p.connector||'XLR'} onChange={e=>updatePort('out',i,'connector',e.target.value)} className="port-connector-select">
                    {CONNECTOR_TYPES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <button className="port-del-btn" onClick={()=>removePort('out',i)}>×</button>
                </div>
              ))}
              <button className="add-port-btn" onClick={()=>addPort('out')}>＋ Add output</button>
            </div>
          </div>
          <div className="props-actions">
            <button className="props-btn danger" onClick={deleteSelected}>Delete node</button>
          </div>
        </>
      )}

      {node && node.type === 'rackPort' && (
        <>
          <div className="props-body">
            <div className="props-hint">
              This is a rack port gateway. It represents a cable connection crossing the rack boundary.
              Edit its label and connector in the rack node's port list (select the rack in main scene).
            </div>
          </div>
        </>
      )}

      {node && node.type === 'rack' && (
        <>
          <div className="props-body">
            <div className="field"><label>{t('rackLabel')}</label>
              <input value={label} onChange={e=>{setLabel(e.target.value);flush({label:e.target.value})}} />
            </div>
            <div className="field"><label>{t('notes')}</label>
              <textarea value={notes} onChange={e=>{setNotes(e.target.value);flush({notes:e.target.value})}} placeholder={t('rackNotesPlaceholder')} />
            </div>
            <div className="field"><label>{t('colorAccent')}</label>
              <div className="color-swatches">
                {NODE_COLORS.map((c,i)=>(
                  <div key={i} className={'color-swatch'+(color===c?' active':'')}
                    style={{background:c||'#1e1e30',border:c?undefined:'1px dashed var(--border-active)'}}
                    onClick={()=>{setColor(c);flush({color:c})}} />
                ))}
              </div>
            </div>

            <div className="field-section-title">{t('inputs')} <span style={{fontSize:10,opacity:0.5}}>— connectable in main scene</span></div>
            <div className="port-list">
              {inputs.map((p,i)=>(
                <div key={p.id} className="port-item port-item-full">
                  <input value={p.label} onChange={e=>updatePort('in',i,'label',e.target.value)} placeholder={'In '+(i+1)} />
                  <select value={p.connector||'XLR'} onChange={e=>updatePort('in',i,'connector',e.target.value)} className="port-connector-select">
                    {CONNECTOR_TYPES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <button className="port-del-btn" onClick={()=>removePort('in',i)}>×</button>
                </div>
              ))}
              <button className="add-port-btn" onClick={()=>addPort('in')}>{t('addInput')}</button>
            </div>

            <div className="field-section-title">{t('outputs')} <span style={{fontSize:10,opacity:0.5}}>— connectable in main scene</span></div>
            <div className="port-list">
              {outputs.map((p,i)=>(
                <div key={p.id} className="port-item port-item-full">
                  <input value={p.label} onChange={e=>updatePort('out',i,'label',e.target.value)} placeholder={'Out '+(i+1)} />
                  <select value={p.connector||'XLR'} onChange={e=>updatePort('out',i,'connector',e.target.value)} className="port-connector-select">
                    {CONNECTOR_TYPES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <button className="port-del-btn" onClick={()=>removePort('out',i)}>×</button>
                </div>
              ))}
              <button className="add-port-btn" onClick={()=>addPort('out')}>{t('addOutput')}</button>
            </div>

            <div className="props-hint">Define ports above → double-click rack to open inner scene → port gateways appear automatically.</div>
          </div>
          <div className="props-actions">
            <button className="props-btn danger" onClick={deleteSelected}>{t('deleteRack')}</button>
          </div>
        </>
      )}

      {edge && (
        <>
          <div className="props-body">
            <div className="field"><label>Cable label</label>
              <input value={edgeLabel} onChange={e=>{setEdgeLabel(e.target.value);flushEdge({label:e.target.value})}} placeholder={t('cableLabelPlaceholder')} />
            </div>
            <div className="field"><label>Cable type</label>
              <div className="cable-type-grid">
                {Object.entries(CABLE_TYPES).map(([key,def])=>(
                  <div key={key} className={'cable-type-option'+(edgeCable===key?' selected':'')}
                    style={{color:def.color}} onClick={()=>{setEdgeCable(key);flushEdge({cableType:key})}}>
                    <div className="cable-swatch" style={{background:def.color}} />
                    <span className="cable-type-name">{def.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="props-actions">
            <button className="props-btn danger" onClick={deleteSelected}>Delete cable</button>
          </div>
        </>
      )}
    </div>
  )
}
