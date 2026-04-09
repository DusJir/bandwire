import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

const NAV = [
  { id: 'appearance', label: '🎨 Appearance' },
  { id: 'language',   label: '🌐 Language'   },
  { id: 'cables',     label: '🔌 Cables'     },
  { id: 'stage',      label: '🎸 Stage'      },
  { id: 'exports',    label: '📤 Exports'    },
  { id: 'shortcuts',  label: '⌨️ Shortcuts'  },
]

const LANGUAGES = [
  { code: 'en', label: 'English'  },
  { code: 'cs', label: 'Čeština' },
  { code: 'de', label: 'Deutsch'  },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español'  },
  { code: 'it', label: 'Italiano' },
  { code: 'ru', label: 'Русский'  },
]

const SHORTCUTS = [
  ['Ctrl+S',           'Save project'],
  ['Ctrl+O',           'Open project'],
  ['Ctrl+N',           'New project'],
  ['Ctrl+E',           'Export'],
  ['Delete/Backspace', 'Delete selected'],
  ['Escape',           'Close modal / deselect'],
]

const COMPASS = ['N','NE','E','SE','S','SW','W','NW']

function RadioGroup({ options, value, onChange }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {options.map(o => (
        <label key={o.value} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
          <div style={{
            width:16, height:16, borderRadius:'50%', flexShrink:0,
            border: `2px solid ${value===o.value ? 'var(--accent)' : 'var(--border-active)'}`,
            background: value===o.value ? 'var(--accent)' : 'transparent',
            display:'flex',alignItems:'center',justifyContent:'center',
          }} onClick={() => onChange(o.value)}>
            {value===o.value && <div style={{width:6,height:6,borderRadius:'50%',background:'white'}}/>}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{o.label}</div>
            {o.hint && <div style={{fontSize:11,color:'var(--text-secondary)'}}>{o.hint}</div>}
          </div>
        </label>
      ))}
    </div>
  )
}

function ColorPicker({ value, onChange, label }) {
  return (
    <div>
      <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:6}}>{label}</div>
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <input type="color" value={value}
          onChange={e => onChange(e.target.value)}
          style={{width:36,height:36,padding:0,border:'1px solid var(--border)',borderRadius:8,cursor:'pointer'}}
        />
        <span style={{fontSize:11,fontFamily:'monospace',color:'var(--text-secondary)'}}>{value}</span>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',
        color:'var(--text-secondary)',marginBottom:12,paddingBottom:6,
        borderBottom:'1px solid var(--border)'}}>{title}</div>
      {children}
    </div>
  )
}

function StageDimInputs({ settings, updateSettings }) {
  const [w, setW] = React.useState(settings.defaultStageWidth  || 600)
  const [h, setH] = React.useState(settings.defaultStageHeight || 400)

  // Sync if settings change externally
  React.useEffect(() => { setW(settings.defaultStageWidth  || 600) }, [settings.defaultStageWidth])
  React.useEffect(() => { setH(settings.defaultStageHeight || 400) }, [settings.defaultStageHeight])

  return (
    <div style={{display:'flex',gap:12}}>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:6}}>Default width (px)</div>
        <input type="number" min={200} max={2000} step={50}
          value={w}
          onChange={e => setW(e.target.value)}
          onBlur={e => updateSettings({ defaultStageWidth: parseInt(e.target.value)||600 })}
          style={{width:'100%'}}
        />
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:6}}>Default height (px)</div>
        <input type="number" min={150} max={2000} step={50}
          value={h}
          onChange={e => setH(e.target.value)}
          onBlur={e => updateSettings({ defaultStageHeight: parseInt(e.target.value)||400 })}
          style={{width:'100%'}}
        />
      </div>
    </div>
  )
}

export default function SettingsModal() {
  const { t, i18n } = useTranslation('t')
  const { closeModal, settings, updateSettings, theme, toggleTheme } = useStore()
  const [activeTab, setActiveTab] = useState('appearance')

  const renderContent = () => {
    switch(activeTab) {

      case 'appearance': return (
        <div>
          <Section title="Theme">
            <RadioGroup
              value={theme}
              onChange={v => { if (v !== theme) toggleTheme() }}
              options={[
                { value: 'light', label: 'Light', hint: 'Default — bright interface' },
                { value: 'dark',  label: 'Dark',  hint: 'Easy on the eyes in low-light conditions' },
              ]}
            />
          </Section>
        </div>
      )

      case 'language': return (
        <div>
          <Section title="Interface Language">
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {LANGUAGES.map(l => (
                <label key={l.code} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                  <div style={{
                    width:16,height:16,borderRadius:'50%',flexShrink:0,
                    border:`2px solid ${i18n.language===l.code?'var(--accent)':'var(--border-active)'}`,
                    background:i18n.language===l.code?'var(--accent)':'transparent',
                    display:'flex',alignItems:'center',justifyContent:'center',
                  }} onClick={() => i18n.changeLanguage(l.code)}>
                    {i18n.language===l.code && <div style={{width:6,height:6,borderRadius:'50%',background:'white'}}/>}
                  </div>
                  <span style={{fontSize:13,color:'var(--text-primary)'}}>{l.label}</span>
                </label>
              ))}
            </div>
          </Section>
        </div>
      )

      case 'cables': return (
        <div>
          <Section title="Connector Compatibility">
            <RadioGroup
              value={settings.enforceConnectorTypes ? 'yes' : 'no'}
              onChange={v => updateSettings({ enforceConnectorTypes: v === 'yes' })}
              options={[
                { value: 'yes', label: 'Warn on connector mismatch', hint: 'Show a warning when cable type doesn\'t match port connector type' },
                { value: 'no',  label: 'Allow all connections', hint: 'No warnings — connect any cable to any port' },
              ]}
            />
          </Section>
        </div>
      )

      case 'stage': return (
        <div>
          <Section title="Default Colors">
            <div style={{display:'flex',gap:24}}>
              <ColorPicker label="H (House/FOH) color"
                value={settings.stageFohColor || '#EF4444'}
                onChange={v => updateSettings({ stageFohColor: v })}
              />
              <ColorPicker label="P (Personal/Band) color"
                value={settings.stagePersonalColor || '#6366f1'}
                onChange={v => updateSettings({ stagePersonalColor: v })}
              />
            </div>
          </Section>

          <Section title="Default Stage Setup">
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>
                Number of stages
              </div>
              <div style={{display:'flex',gap:5}}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button key={n}
                    className={'props-btn' + ((settings.defaultStageCount||1)===n?' accent':'')}
                    style={{flex:1,padding:'5px 0',fontSize:12}}
                    onClick={() => updateSettings({ defaultStageCount: n })}
                  >{n}</button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>
                Default audience direction
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
                {COMPASS.map(d => (
                  <button key={d}
                    className={'props-btn' + (settings.defaultStageFohDirection===d?' accent':'')}
                    style={{padding:'5px 0',fontSize:12}}
                    onClick={() => updateSettings({ defaultStageFohDirection: d })}
                  >{d}</button>
                ))}
              </div>
            </div>

            <StageDimInputs settings={settings} updateSettings={updateSettings} />
          </Section>
        </div>
      )

      case 'exports': return (
        <div>
          <Section title="Schema Export">
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Default format</div>
              <RadioGroup
                value={settings.defaultExportFormat || 'html'}
                onChange={v => updateSettings({ defaultExportFormat: v })}
                options={[
                  { value: 'html', label: 'HTML', hint: 'Interactive, best for sharing and viewing in browser' },
                  { value: 'png',  label: 'PNG',  hint: 'Flat image, good for printing and embedding' },
                ]}
              />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:14}}>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <div style={{
                  width:16,height:16,borderRadius:3,flexShrink:0,
                  border:`2px solid ${settings.defaultExportLegend?'var(--accent)':'var(--border-active)'}`,
                  background:settings.defaultExportLegend?'var(--accent)':'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }} onClick={() => updateSettings({ defaultExportLegend: !settings.defaultExportLegend })}>
                  {settings.defaultExportLegend && <span style={{color:'white',fontSize:10,fontWeight:700}}>✓</span>}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>Include signal legend</div>
                  <div style={{fontSize:11,color:'var(--text-secondary)'}}>Show cable type legend in export</div>
                </div>
              </label>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <div style={{
                  width:16,height:16,borderRadius:3,flexShrink:0,
                  border:`2px solid ${settings.defaultExportColor?'var(--accent)':'var(--border-active)'}`,
                  background:settings.defaultExportColor?'var(--accent)':'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }} onClick={() => updateSettings({ defaultExportColor: !settings.defaultExportColor })}>
                  {settings.defaultExportColor && <span style={{color:'white',fontSize:10,fontWeight:700}}>✓</span>}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>Color export</div>
                  <div style={{fontSize:11,color:'var(--text-secondary)'}}>Uncheck for black & white</div>
                </div>
              </label>
            </div>
          </Section>

          <Section title="Stage Plan Export">
            <div style={{fontSize:12,color:'var(--text-secondary)'}}>
              Stage plan exports follow the format selected in the export dialog. Use the Stage Export button (🎸 → Export) for detailed options including engineer, band, and rider views.
            </div>
          </Section>
        </div>
      )

      case 'shortcuts': return (
        <div>
          <Section title="Keyboard Shortcuts">
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {SHORTCUTS.map(([key, action]) => (
                <div key={key} style={{display:'flex',justifyContent:'space-between',
                  alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                  <span style={{color:'var(--text-secondary)'}}>{action}</span>
                  <code style={{background:'var(--bg-input)',border:'1px solid var(--border)',
                    borderRadius:4,padding:'2px 8px',fontSize:11,color:'var(--text-primary)',whiteSpace:'nowrap'}}>{key}</code>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )

      default: return null
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={closeModal}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}
        style={{width:680, height:520, display:'flex', flexDirection:'column'}}>

        <div className="modal-header">
          <span>Settings</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>

        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
          {/* Left nav */}
          <div style={{
            width:150, flexShrink:0,
            borderRight:'1px solid var(--border)',
            background:'var(--bg-deep)',
            padding:'8px 0',
          }}>
            {NAV.map(item => (
              <button key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width:'100%', textAlign:'left', padding:'9px 16px',
                  background: activeTab===item.id ? 'var(--accent-dim)' : 'transparent',
                  color: activeTab===item.id ? 'var(--accent)' : 'var(--text-secondary)',
                  border:'none', cursor:'pointer', fontSize:13, fontWeight: activeTab===item.id ? 600 : 400,
                  borderLeft: activeTab===item.id ? '3px solid var(--accent)' : '3px solid transparent',
                }}
              >{item.label}</button>
            ))}
          </div>

          {/* Right content */}
          <div style={{flex:1, overflowY:'auto', padding:'20px 24px'}}>
            {renderContent()}
          </div>
        </div>

        <div className="modal-footer">
          <button className="props-btn accent" onClick={closeModal}>Done</button>
        </div>
      </div>
    </div>
  )
}
