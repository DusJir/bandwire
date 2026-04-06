import React, { useState } from 'react'

import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { COMPASS_LABELS, computeStageLayout } from '../../constants/stageDirections'

function CompassPicker({ value, onChange }) {
  // 3×3 grid, center empty
  const grid = [
    ['NW','N','NE'],
    ['W', '' ,'E' ],
    ['SW','S','SE'],
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,36px)', gap:2 }}>
      {grid.flat().map((dir, i) => dir === '' ? (
        <div key={i} />
      ) : (
        <button key={dir}
          className={'props-btn' + (value === dir ? ' accent' : '')}
          style={{ padding:'4px 0', fontSize:11, fontWeight:700, minWidth:0 }}
          onClick={() => onChange(dir)}
          title={dir}
        >{COMPASS_LABELS[dir].split(' ')[1]}</button>
      ))}
    </div>
  )
}

function StageEntry({ stage, index, onChange }) {
  const [labelVal, setLabelVal] = React.useState(stage.label || `Stage ${index + 1}`)

  return (
    <div style={{ padding:'12px', background:'var(--bg-input)', borderRadius:8, marginBottom:8 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>
        Stage {index + 1}
      </div>

      <div className="field" style={{ marginBottom:10 }}>
        <label>Label</label>
        <input
          value={labelVal}
          onChange={e => setLabelVal(e.target.value)}
          onBlur={() => onChange({ ...stage, label: labelVal || `Stage ${index + 1}` })}
          style={{ width:'100%' }}
        />
      </div>

      <div className="field" style={{ marginBottom:10 }}>
        <label>Audience direction</label>
        <CompassPicker value={stage.fohDirection} onChange={dir => onChange({ ...stage, fohDirection: dir })} />
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <div className="field" style={{ flex:1 }}>
          <label>Width (px)</label>
          <input type="number" min={200} max={2000} step={50}
            value={stage.width}
            onChange={e => onChange({ ...stage, width: parseInt(e.target.value) || 600 })}
          />
        </div>
        <div className="field" style={{ flex:1 }}>
          <label>Height (px)</label>
          <input type="number" min={150} max={2000} step={50}
            value={stage.height}
            onChange={e => onChange({ ...stage, height: parseInt(e.target.value) || 400 })}
          />
        </div>
      </div>
    </div>
  )
}

export default function StageSetupModal() {
  const { t }          = useTranslation('t')
  const { closeModal, updateStageData, stageData, settings } = useStore()

  const defaultDir = settings.defaultStageFohDirection || 'S'
  const defaultW   = settings.defaultStageWidth        || 600
  const defaultH   = settings.defaultStageHeight       || 400

  const makeStage = (i) => ({
    id:           'stage-' + (i + 1),
    label:        i === 0 ? 'Stage' : `Stage ${i + 1}`,
    fohDirection: defaultDir,
    width:        defaultW,
    height:       defaultH,
  })

  const [count,  setCount]  = useState(1)
  const [stages, setStages] = useState([makeStage(0)])

  const handleCountChange = (n) => {
    setCount(n)
    setStages(prev => {
      if (n > prev.length) {
        const extra = Array.from({ length: n - prev.length }, (_, i) => makeStage(prev.length + i))
        return [...prev, ...extra]
      }
      return prev.slice(0, n)
    })
  }

  const updateStage = (i, updated) => {
    setStages(prev => prev.map((s, idx) => idx === i ? updated : s))
  }

  const handleConfirm = () => {
    const layout = computeStageLayout(stages)
    // Build background nodes from layout
    const bgNodes = layout.map(s => ({
      id:         'bg-' + s.id,
      type:       'stageBackground',
      position:   { x: s.x, y: s.y },
      draggable:  false,
      selectable: false,
      connectable: false,
      zIndex:     -1,
      data: {
        label:       s.label,
        fohDirection: s.fohDirection,
        width:        s.width,
        height:       s.height,
        stageId:      s.id,
      },
      style: { width: s.width, height: s.height, pointerEvents: 'none' },
    }))

    // Preserve existing device nodes and edges, replace background nodes
    const existingDevices = (stageData.nodes || []).filter(n => n.type !== 'stageBackground')
    updateStageData({
      initialized: true,
      stages,
      nodes: [...bgNodes, ...existingDevices],
    })
    closeModal()
  }

  return (
    <div className="modal-backdrop" onMouseDown={closeModal}>
      <div className="modal" onMouseDown={e => e.stopPropagation()} style={{ width:520, maxHeight:'90vh' }}>
        <div className="modal-header">
          <span>🎸 Stage Setup</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>

        <div className="modal-body" style={{ overflowY:'auto' }}>
          <div className="field" style={{ marginBottom:16 }}>
            <label>Number of stages</label>
            <div style={{ display:'flex', gap:6 }}>
              {[1,2,3,4,5,6,7,8].map(n => (
                <button key={n}
                  className={'props-btn' + (count === n ? ' accent' : '')}
                  style={{ flex:1, padding:'6px 0', fontSize:13 }}
                  onClick={() => handleCountChange(n)}
                >{n}</button>
              ))}
            </div>
          </div>

          {stages.map((s, i) => (
            <StageEntry key={i} stage={s} index={i} onChange={u => updateStage(i, u)} />
          ))}

          <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:8, lineHeight:1.6 }}>
            Stages are automatically positioned based on audience direction.
            You can adjust positions and sizes anytime in the Stage Setup panel.
          </div>
        </div>

        <div className="modal-footer">
          <button className="props-btn" onClick={closeModal}>{t('cancel')}</button>
          <button className="props-btn accent" onClick={handleConfirm}>Create Stage</button>
        </div>
      </div>
    </div>
  )
}
