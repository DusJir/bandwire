import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { CONNECTOR_TYPES } from '../../constants/connectorTypes'

const PRESET_COLORS = ['#3B82F6','#10B981','#F59E0B','#F97316','#8B5CF6',
  '#EC4899','#EF4444','#14B8A6','#DC2626','#6B7280','#06B6D4','#84CC16']

export default function AddCableModal() {
  const { t } = useTranslation('t')
  const { closeModal, addCustomCableType } = useStore()

  const [label,        setLabel]        = useState('')
  const [color,        setColor]        = useState('#10B981')
  const [customColor,  setCustomColor]  = useState('#10B981')
  const [dash,         setDash]         = useState('')
  const [compatible,   setCompatible]   = useState([])
  const [error,        setError]        = useState('')

  const toggleConnector = (c) =>
    setCompatible(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])

  const handleSave = () => {
    if (!label.trim()) { setError('Name is required.'); return }
    addCustomCableType({
      label:       label.trim(),
      color:       color,
      dash:        dash || null,
      compatible:  compatible,
      desc:        '',
    })
    closeModal()
  }

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>Add Custom Cable</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Name *</label>
            <input value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. XLR to Jack" autoFocus />
            {error && <span className="field-error">{error}</span>}
          </div>

          <div className="field">
            <label>Color</label>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
              {PRESET_COLORS.map(c => (
                <div key={c}
                  onClick={() => { setColor(c); setCustomColor(c) }}
                  style={{
                    width:20, height:20, borderRadius:'50%', background:c, cursor:'pointer',
                    outline: color===c ? '2px solid white' : 'none', outlineOffset:2
                  }}
                />
              ))}
              <input type="color" value={customColor}
                onChange={e => { setCustomColor(e.target.value); setColor(e.target.value) }}
                style={{width:24,height:24,padding:0,border:'none',borderRadius:'50%',cursor:'pointer',background:'none'}}
              />
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
              <div style={{height:3,flex:1,background:color,borderRadius:2}} />
              <span style={{color:'var(--text-secondary)',fontSize:11}}>{color}</span>
            </div>
          </div>

          <div className="field">
            <label>Line style</label>
            <div style={{display:'flex',gap:8}}>
              {[['Solid',''],['Dashed','6 3'],['Dotted','2 4'],['Chain','5 2 1 2']].map(([n,d]) => (
                <button key={d}
                  className={'props-btn' + (dash===d?' accent':'')}
                  style={{fontSize:11,padding:'3px 8px'}}
                  onClick={() => setDash(d)}
                >
                  <svg width="32" height="8" viewBox="0 0 32 8">
                    <line x1="2" y1="4" x2="30" y2="4" stroke={color} strokeWidth="2.5"
                      strokeDasharray={d||undefined} strokeLinecap="round"/>
                  </svg>
                  <span style={{marginLeft:4}}>{n}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label style={{marginBottom:6,display:'block'}}>
              Compatible connectors
              <span style={{opacity:0.5,fontSize:10,marginLeft:6}}>(leave empty = works with all)</span>
            </label>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,maxHeight:120,overflowY:'auto'}}>
              {CONNECTOR_TYPES.map(c => (
                <button key={c}
                  className={'tag-chip small' + (compatible.includes(c)?' active':'')}
                  onClick={() => toggleConnector(c)}
                  style={{fontSize:10}}
                >{c}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="props-btn" onClick={closeModal}>Cancel</button>
          <button className="props-btn accent" onClick={handleSave}>Save Cable</button>
        </div>
      </div>
    </div>
  )
}
