import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { COMPASS, computeStageLayout } from '../../constants/stageDirections'

const PRESET_COLORS = ['#6366f1','#3B82F6','#10B981','#F59E0B','#F97316','#8B5CF6','#EC4899','#14B8A6','#84CC16']

export default function StagePanel() {
  const { t } = useTranslation('t')
  const {
    selectedNodeId, selectedEdgeId,
    stageData, updateStageData,
    settings, deleteSelected, clearSelection,
    openModal,
  } = useStore()

  const node = stageData.nodes?.find(n => n.id === selectedNodeId)
  const edge = stageData.edges?.find(e => e.id === selectedEdgeId)

  // Node form
  const [label,      setLabel]      = useState('')
  const [stageRole,  setStageRole]  = useState(null)
  const [stageColor, setStageColor] = useState(null)
  const [notes,      setNotes]      = useState('')

  useEffect(() => {
    if (!node) return
    setLabel(node.data.label || '')
    setStageRole(node.data.stageRole || null)
    setStageColor(node.data.stageColor || null)
    setNotes(node.data.notes || '')
  }, [selectedNodeId])

  const flushNode = (o = {}) => {
    if (!node) return
    const updated = {
      ...stageData,
      nodes: stageData.nodes.map(n => n.id !== node.id ? n : {
        ...n,
        data: {
          ...n.data,
          label:      'label'      in o ? o.label      : label,
          stageRole:  'stageRole'  in o ? o.stageRole  : stageRole,
          stageColor: 'stageColor' in o ? o.stageColor : stageColor,
          notes:      'notes'      in o ? o.notes      : notes,
        }
      })
    }
    updateStageData(updated)
  }

  // Edge form
  const [edgeLabel,    setEdgeLabel]    = useState('')
  const [edgeRole,     setEdgeRole]     = useState(null)
  const [edgeColor,    setEdgeColor]    = useState('#888888')

  useEffect(() => {
    if (!edge) return
    setEdgeLabel(edge.data?.label || '')
    setEdgeRole(edge.data?.stageRole || null)
    setEdgeColor(edge.data?.color || '#888888')
  }, [selectedEdgeId])

  const flushEdge = (o = {}) => {
    if (!edge) return
    const updated = {
      ...stageData,
      edges: stageData.edges.map(e => e.id !== edge.id ? e : {
        ...e,
        data: {
          ...e.data,
          label:     'label'     in o ? o.label     : edgeLabel,
          stageRole: 'stageRole' in o ? o.stageRole : edgeRole,
          color:     'color'     in o ? o.color     : edgeColor,
        }
      })
    }
    updateStageData(updated)
  }

  const fohColor = settings.stageFohColor || '#EF4444'

  const RolePicker = ({ value, onChange }) => (
    <div style={{display:'flex',gap:6}}>
      {[null,'personal','foh'].map(r => (
        <button key={String(r)}
          className={'props-btn' + (value===r?' accent':'')}
          style={{flex:1,fontSize:11}}
          onClick={() => onChange(r)}
        >
          {r === null ? 'None' : r === 'foh' ? 'H (House)' : 'P (Personal)'}
        </button>
      ))}
    </div>
  )

  return (
    <div className="props-panel">
      <div className="props-header">
        {node ? 'Stage Device' : edge ? 'Stage Cable' : 'Stage Properties'}
      </div>

      {!node && !edge && (
        <div className="props-empty">Select a device or cable to edit.</div>
      )}

      {/* ── Node properties ── */}
      {node && node.type === 'stageDevice' && (
        <div className="props-body">
          <div className="field">
            <label>Label</label>
            <input value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={() => flushNode()} />
          </div>

          <div className="field">
            <label>Role</label>
            <RolePicker value={stageRole} onChange={r => { setStageRole(r); flushNode({ stageRole: r }) }} />
          </div>

          {stageRole === 'personal' && (
            <div className="field">
              <label>Personal color</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                {PRESET_COLORS.map(c => (
                  <div key={c} onClick={() => { setStageColor(c); flushNode({ stageColor: c }) }}
                    style={{
                      width:18,height:18,borderRadius:'50%',background:c,cursor:'pointer',
                      outline: stageColor===c ? '2px solid white' : 'none', outlineOffset:2
                    }}
                  />
                ))}
                <input type="color" value={stageColor||'#6366f1'}
                  onChange={e => { setStageColor(e.target.value); flushNode({ stageColor: e.target.value }) }}
                  style={{width:22,height:22,padding:0,border:'none',borderRadius:'50%',cursor:'pointer'}} />
              </div>
            </div>
          )}

          <div className="field">
            <label>Notes</label>
            <textarea value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => flushNode()}
              placeholder="Monitor mix, special requirements..."
              style={{minHeight:60}} />
          </div>

          <div className="props-actions" style={{marginTop:8}}>
            <button className="props-btn danger" onClick={deleteSelected}>Delete</button>
          </div>
        </div>
      )}

      {/* ── Stage Setup — always visible ── */}
      <StageSetupPanel />

      {/* ── Edge properties ── */}
      {edge && (
        <div className="props-body">
          <div className="field">
            <label>Cable label</label>
            <input value={edgeLabel}
              onChange={e => setEdgeLabel(e.target.value)}
              onBlur={() => flushEdge()}
              placeholder="e.g. XLR from drums" />
          </div>
          <div className="field">
            <label>Role</label>
            <RolePicker value={edgeRole} onChange={r => { setEdgeRole(r); flushEdge({ stageRole: r, color: r==='foh' ? fohColor : '#888888' }) }} />
          </div>
          {edgeRole !== 'foh' && (
            <div className="field">
              <label>Color</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                {PRESET_COLORS.map(c => (
                  <div key={c} onClick={() => { setEdgeColor(c); flushEdge({ color: c }) }}
                    style={{
                      width:18,height:18,borderRadius:'50%',background:c,cursor:'pointer',
                      outline: edgeColor===c ? '2px solid white' : 'none', outlineOffset:2
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="props-actions" style={{marginTop:8}}>
            <button className="props-btn danger" onClick={deleteSelected}>Delete</button>
          </div>
        </div>
      )}

      {/* ── Rider form (always shown at bottom) ── */}
      <RiderForm />
    </div>
  )
}

// RiderField defined at module level to prevent unmount/remount on each keystroke
function RiderField({ fieldKey, label, placeholder, rows = 3 }) {
  const { stageData, updateStageData } = useStore(s => ({ stageData: s.stageData, updateStageData: s.updateStageData }))
  const [val, setVal] = useState(stageData.rider?.[fieldKey] || '')

  // Sync from store if fieldKey changes (e.g. project loaded)
  const riderVal = stageData.rider?.[fieldKey] || ''
  useEffect(() => { setVal(riderVal) }, [riderVal])

  const flush = () => updateStageData({ rider: { ...stageData.rider, [fieldKey]: val } })

  return (
    <div className="field" style={{marginBottom:8}}>
      <label style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-secondary)',marginBottom:3,display:'block'}}>{label}</label>
      <textarea
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={flush}
        placeholder={placeholder}
        style={{minHeight: rows*22, fontSize:12, resize:'vertical'}}
      />
    </div>
  )
}

function RiderForm() {
  return (
    <div className="stage-rider-panel">
      <div className="cable-panel-header">
        <span>Rider / Notes</span>
      </div>
      <div style={{padding:'8px 12px',overflowY:'auto',flex:1}}>
        <RiderField fieldKey="techRequirements" label="Technical requirements" placeholder="PA system, monitor sends, DI boxes needed..." />
        <RiderField fieldKey="monitoring"       label="Monitoring"             placeholder="Wedges, IEM systems, mix positions..." />
        <RiderField fieldKey="backline"         label="Backline"               placeholder="What band brings vs. what venue provides..." />
        <RiderField fieldKey="contact"          label="Contact"                placeholder="Production manager, tech contact..." rows={2} />
        <RiderField fieldKey="notes"            label="Notes"                  placeholder="Any additional notes for the crew..." />
      </div>
    </div>
  )
}

// ── Stage Setup Panel — always visible at top of right panel ──────────
function StageSetupPanel() {
  const { stageData, updateStageData, openModal } = useStore()
  const stages = stageData.stages || []

  const updateBgNode = (stageId, patch) => {
    const newStages = stages.map(s => s.id === stageId ? { ...s, ...patch } : s)
    const layout = computeStageLayout(newStages)
    const newBgNodes = layout.map(s => ({
      id:          'bg-' + s.id,
      type:        'stageBackground',
      position:    { x: s.x, y: s.y },
      draggable:   false,
      selectable:  false,
      connectable: false,
      zIndex:      -1,
      data: { label: s.label, fohDirection: s.fohDirection, width: s.width, height: s.height, stageId: s.id },
      style: { width: s.width, height: s.height, pointerEvents: 'none' },
    }))
    const deviceNodes = (stageData.nodes || []).filter(n => n.type !== 'stageBackground')
    updateStageData({ stages: newStages, nodes: [...newBgNodes, ...deviceNodes] })
  }

  if (!stageData.initialized || stages.length === 0) {
    return (
      <div className="stage-rider-panel" style={{flex:'none'}}>
        <div className="cable-panel-header"><span>Stage Setup</span></div>
        <div style={{padding:'10px 12px'}}>
          <button className="props-btn accent" style={{width:'100%'}}
            onClick={() => openModal('stageSetup')}>
            ＋ Configure Stage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="stage-rider-panel" style={{flex:'none'}}>
      <div className="cable-panel-header">
        <span>Stage Setup</span>
        <button className="cable-panel-add" onClick={() => openModal('stageSetup')} title="Reconfigure">✎</button>
      </div>
      <div style={{padding:'8px 12px', display:'flex', flexDirection:'column', gap:8}}>
        {stages.map((s, i) => (
          <div key={s.id} style={{borderBottom:'1px solid var(--border)',paddingBottom:8}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>
              {s.label || `Stage ${i+1}`}
            </div>
            <div className="field" style={{marginBottom:4}}>
              <label>Audience direction</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                {COMPASS.map(d => (
                  <button key={d}
                    className={'props-btn' + (s.fohDirection===d?' accent':'')}
                    style={{padding:'2px 5px',fontSize:10,minWidth:0}}
                    onClick={() => updateBgNode(s.id, {fohDirection: d})}
                  >{d}</button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <div className="field" style={{flex:1}}>
                <label>W</label>
                <input type="number" min={200} max={2000} step={50} value={s.width}
                  onChange={e => updateBgNode(s.id, {width: parseInt(e.target.value)||600})} />
              </div>
              <div className="field" style={{flex:1}}>
                <label>H</label>
                <input type="number" min={150} max={2000} step={50} value={s.height}
                  onChange={e => updateBgNode(s.id, {height: parseInt(e.target.value)||400})} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
