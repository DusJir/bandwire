import { useTranslation } from 'react-i18next'
import { useState, useEffect, useMemo } from 'react'
import useStore from '../../store/useStore'
import { CABLE_TYPES } from '../../constants/cableTypes'
import { CONNECTOR_TYPES } from '../../constants/connectorTypes'

const NODE_COLORS = [null,'#6366f1','#3B82F6','#10B981','#F59E0B','#F97316','#EC4899','#EF4444']

export default function PropertiesPanel() {
  const { t } = useTranslation('t')
  const {
    selectedNodeId, selectedEdgeId,
    updateNodeData, updateEdgeData, deleteSelected,
    selectedCableType, setSelectedCableType,
    customCableTypes, openModal, deleteCustomCableType,
    scenes,
  } = useStore()
  const scene = useStore(s => s.currentScene())
  const node  = scene?.nodes.find(n => n.id === selectedNodeId)
  const edge  = scene?.edges.find(e => e.id === selectedEdgeId)

  // All cable types: built-in + custom
  const allCableTypes = useMemo(() => ({
    ...CABLE_TYPES,
    ...Object.fromEntries((customCableTypes || []).map(c => [c.id, c])),
  }), [customCableTypes])

  // Node form state
  const [label,   setLabel]   = useState('')
  const [model,   setModel]   = useState('')
  const [notes,   setNotes]   = useState('')
  const [color,   setColor]   = useState(null)
  const [inputs,        setInputs]        = useState([])
  const [outputs,       setOutputs]       = useState([])
  const [physicalDevice, setPhysicalDevice] = useState('')

  useEffect(() => {
    if (!node) return
    setLabel(node.data.label  || '')
    setModel(node.data.model  || '')
    setNotes(node.data.notes  || '')
    setColor(node.data.color  || null)
    setInputs(node.data.inputs  || [])
    setOutputs(node.data.outputs || [])
    setPhysicalDevice(node.data.physicalDevice || '')
  }, [selectedNodeId])

  const flush = (o = {}) => {
    if (!node) return
    updateNodeData(node.id, {
      label:          o.label          !== undefined ? o.label          : label,
      model:          o.model          !== undefined ? o.model          : model,
      notes:          o.notes          !== undefined ? o.notes          : notes,
      color:          o.color          !== undefined ? o.color          : color,
      inputs:         o.inputs         !== undefined ? o.inputs         : inputs,
      outputs:        o.outputs        !== undefined ? o.outputs        : outputs,
      physicalDevice: o.physicalDevice !== undefined ? o.physicalDevice : physicalDevice,
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

  // How many scenes use this custom device
  const countUsages = (deviceId) => {
    let count = 0
    for (const scene of Object.values(scenes || {})) {
      count += (scene?.nodes || []).filter(n => n.data?.deviceId === deviceId || n.data?.label === deviceId).length
    }
    return count
  }

  const handleDeleteCustomDevice = (deviceId, deviceName) => {
    const usages = countUsages(deviceId)
    const msg = usages > 0
      ? `"${deviceName}" is used in ${usages} place${usages>1?'s':''} on the canvas. Existing nodes will keep their current state but lose the device definition. Delete anyway?`
      : `Delete "${deviceName}"?`
    openModal('confirm', {
      title:        'Delete Custom Device',
      message:      msg,
      confirmLabel: 'Delete',
      onConfirm:    () => { useStore.getState().deleteCustomDevice(deviceId) },
    })
  }

  const handleDeleteCustomCable = (id, label) => {
    openModal('confirm', {
      title:        'Delete Custom Cable',
      message:      `Delete "${label}"? Existing connections using this cable type will revert to default.`,
      confirmLabel: 'Delete',
      onConfirm:    () => deleteCustomCableType(id),
    })
  }

  // ── Port list helper ─────────────────────────────────────────
  const PortList = ({ side, ports, addLabel, placeholder }) => (
    <div className="port-list">
      {ports.map((p,i) => (
        <div key={p.id} className="port-item port-item-full">
          <input value={p.label} onChange={e=>updatePort(side,i,'label',e.target.value)}
            placeholder={placeholder + ' ' + (i+1)} />
          <select value={p.connector||'XLR'} onChange={e=>updatePort(side,i,'connector',e.target.value)}
            className="port-connector-select">
            {CONNECTOR_TYPES.map(c=><option key={c}>{c}</option>)}
          </select>
          <button className="port-del-btn" onClick={()=>removePort(side,i)}>×</button>
        </div>
      ))}
      <button className="add-port-btn" onClick={()=>addPort(side)}>{addLabel}</button>
    </div>
  )

  // ── Cable type panel (always shown at bottom) ─────────────────
  const CablePanel = () => (
    <div className="cable-panel">
      <div className="cable-panel-header">
        <span>Cable type</span>
        <button className="cable-panel-add" onClick={() => openModal('addCable')} title="Add custom cable">＋</button>
      </div>
      <div className="cable-panel-list">
        {/* Built-in */}
        {Object.entries(CABLE_TYPES).map(([key, def]) => (
          <button key={key}
            className={'cable-panel-item' + (selectedCableType===key?' active':'')}
            onClick={() => setSelectedCableType(key)}
            title={def.desc}
          >
            <div className="cable-panel-swatch" style={{background: def.color,
              borderStyle: def.dash ? 'dashed' : 'solid'}} />
            <span className="cable-panel-label">{def.label.split(' ')[0]}</span>
            <span className="cable-panel-badge factory">F</span>
          </button>
        ))}
        {/* Custom */}
        {(customCableTypes || []).map(cable => (
          <button key={cable.id}
            className={'cable-panel-item' + (selectedCableType===cable.id?' active':'')}
            onClick={() => setSelectedCableType(cable.id)}
            title={cable.label}
          >
            <div className="cable-panel-swatch" style={{background: cable.color,
              borderStyle: cable.dash ? 'dashed' : 'solid'}} />
            <span className="cable-panel-label">{cable.label.split(' ')[0]}</span>
            <button className="cable-panel-badge custom-del"
              onClick={e => { e.stopPropagation(); handleDeleteCustomCable(cable.id, cable.label) }}
              title="Delete custom cable"
            >×</button>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="props-panel">
      <div className="props-header">
        {node ? t('nodeProperties') : edge ? t('cableProperties') : t('properties')}
      </div>

      {/* ── Empty state ── */}
      {!node && !edge && (
        <div className="props-empty">{t('selectToEdit')}</div>
      )}

      {/* ── Hardware node ── */}
      {node && node.type !== 'rack' && node.type !== 'rackPort' && (
        <>
          <div className="props-body">
            <div className="field"><label>{t('label')}</label>
              <input value={label} onChange={e=>{setLabel(e.target.value);flush({label:e.target.value})}} />
            </div>
            <div className="field"><label>{t('modelMake')}</label>
              <input value={model} onChange={e=>{setModel(e.target.value);flush({model:e.target.value})}}
                placeholder={t('modelPlaceholder')} />
            </div>
            <div className="field"><label>{t('notes')}</label>
              <textarea value={notes} onChange={e=>{setNotes(e.target.value);flush({notes:e.target.value})}}
                placeholder={t('notesPlaceholder')} />
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
            <div className="field-section-title">{t('inputs')}</div>
            <PortList side="in" ports={inputs} addLabel={t('addInput')} placeholder="In" />
            <div className="field-section-title">{t('outputs')}</div>
            <PortList side="out" ports={outputs} addLabel={t('addOutput')} placeholder="Out" />

            {/* Delete custom device button with X badge logic */}
            {node.data?.source === 'custom' && (
              <div style={{marginTop:8}}>
                <button className="props-btn danger" style={{width:'100%'}}
                  onClick={() => handleDeleteCustomDevice(node.data.deviceId || node.data.label, node.data.label)}>
                  Delete Custom Device Definition
                </button>
              </div>
            )}
          </div>
          <div className="props-actions">
            <button className="props-btn danger" onClick={deleteSelected}>{t('deleteNode')}</button>
          </div>
        </>
      )}

      {/* ── Rack port gateway ── */}
      {node && node.type === 'rackPort' && (
        <div className="props-body">
          <div className="props-hint">
            Gateway node — edit label and connector in the rack's port list (select the rack node in the main scene).
          </div>
        </div>
      )}

      {/* ── Rack node ── */}
      {node && node.type === 'rack' && (
        <>
          <div className="props-body">
            <div className="field"><label>{t('rackLabel')}</label>
              <input value={label} onChange={e=>{setLabel(e.target.value);flush({label:e.target.value})}} />
            </div>
            <div className="field"><label>{t('notes')}</label>
              <textarea value={notes} onChange={e=>{setNotes(e.target.value);flush({notes:e.target.value})}}
                placeholder={t('rackNotesPlaceholder')} />
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

            {/* Physical device — optional metadata for rack boundary */}
            <div className="field">
              <label style={{display:'flex',alignItems:'center',gap:6}}>
                Physical boundary device
                <span style={{fontSize:10,opacity:0.45,fontWeight:400}}>optional</span>
              </label>
              <input
                value={physicalDevice}
                onChange={e=>{setPhysicalDevice(e.target.value);flush({physicalDevice:e.target.value})}}
                placeholder="e.g. Patch Bay, Stage Box, D-Sub..."
              />
              <div style={{fontSize:10,color:'var(--text-dim)',marginTop:4,lineHeight:1.5}}>
                If the rack's external ports are physically on a specific device (e.g. a patch bay), name it here.
                Leave empty if ports are direct connections.
              </div>
            </div>

            <div className="field-section-title">
              {t('inputs')}
              <span style={{opacity:0.5,fontSize:10,marginLeft:6}}>— connectable in main scene</span>
            </div>
            <div className="port-list">
              {inputs.map((p,i) => (
                <div key={p.id} className="port-item port-item-full">
                  <input value={p.label} onChange={e=>updatePort('in',i,'label',e.target.value)} placeholder={'In '+(i+1)} />
                  <select value={p.connector||'XLR'} onChange={e=>updatePort('in',i,'connector',e.target.value)}
                    className="port-connector-select">
                    {CONNECTOR_TYPES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <button className="port-del-btn" onClick={()=>removePort('in',i)}>×</button>
                </div>
              ))}
              <button className="add-port-btn" onClick={()=>addPort('in')}>{t('addInput')}</button>
            </div>

            <div className="field-section-title">
              {t('outputs')}
              <span style={{opacity:0.5,fontSize:10,marginLeft:6}}>— connectable in main scene</span>
            </div>
            <div className="port-list">
              {outputs.map((p,i) => (
                <div key={p.id} className="port-item port-item-full">
                  <input value={p.label} onChange={e=>updatePort('out',i,'label',e.target.value)} placeholder={'Out '+(i+1)} />
                  <select value={p.connector||'XLR'} onChange={e=>updatePort('out',i,'connector',e.target.value)}
                    className="port-connector-select">
                    {CONNECTOR_TYPES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <button className="port-del-btn" onClick={()=>removePort('out',i)}>×</button>
                </div>
              ))}
              <button className="add-port-btn" onClick={()=>addPort('out')}>{t('addOutput')}</button>
            </div>

            <div className="props-hint" style={{marginTop:8}}>
              Define ports → double-click rack to open inner scene → gateways appear automatically.
            </div>
          </div>
          <div className="props-actions">
            <button className="props-btn danger" onClick={deleteSelected}>{t('deleteRack')}</button>
          </div>
        </>
      )}

      {/* ── Edge / cable ── */}
      {edge && (
        <>
          <div className="props-body">
            <div className="field"><label>{t('cableLabel')}</label>
              <input value={edgeLabel}
                onChange={e=>{setEdgeLabel(e.target.value);flushEdge({label:e.target.value})}}
                placeholder={t('cableLabelPlaceholder')} />
            </div>
            <div className="field"><label>{t('cableType')}</label>
              <div className="cable-type-grid">
                {Object.entries(allCableTypes).map(([key,def])=>(
                  <div key={key}
                    className={'cable-type-option'+(edgeCable===key?' selected':'')}
                    style={{color:def.color}}
                    onClick={()=>{setEdgeCable(key);flushEdge({cableType:key})}}>
                    <div className="cable-swatch" style={{background:def.color}} />
                    <span className="cable-type-name">{def.label?.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="props-actions">
            <button className="props-btn danger" onClick={deleteSelected}>{t('deleteCable')}</button>
          </div>
        </>
      )}

      {/* ── Cable panel — always at bottom ── */}
      <CablePanel />
    </div>
  )
}
