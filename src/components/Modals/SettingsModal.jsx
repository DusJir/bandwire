import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

export default function SettingsModal() {
  const { t, i18n } = useTranslation('t')
  const { closeModal, settings, updateSettings, theme, toggleTheme } = useStore()

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'cs', label: 'Čeština' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'it', label: 'Italiano' },
    { code: 'ru', label: 'Русский' },
  ]

  const Toggle = ({ value, onChange, label, hint }) => (
    <label style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 0',
      borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
      <div style={{position:'relative',width:36,height:20,flexShrink:0,marginTop:2}}>
        <input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}
          style={{opacity:0,width:0,height:0,position:'absolute'}} />
        <div style={{
          position:'absolute',top:0,left:0,right:0,bottom:0,
          borderRadius:10,
          background: value ? 'var(--accent)' : 'var(--bg-input)',
          border:'1px solid var(--border-active)',
          transition:'background 0.15s'
        }}>
          <div style={{
            position:'absolute',top:2,left: value ? 18 : 2,
            width:14,height:14,borderRadius:'50%',
            background:'white',transition:'left 0.15s'
          }}/>
        </div>
      </div>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{label}</div>
        {hint && <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>{hint}</div>}
      </div>
    </label>
  )

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal modal-sm" onClick={e=>e.stopPropagation()} style={{maxWidth:460}}>
        <div className="modal-header">
          <span>⚙ Settings</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>
        <div className="modal-body" style={{padding:'8px 24px 16px'}}>

          {/* Appearance */}
          <div className="field-section-title" style={{marginTop:8}}>Appearance</div>
          <label style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',
            borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
            <div style={{position:'relative',width:36,height:20,flexShrink:0}}>
              <input type="checkbox" checked={theme==='dark'} onChange={toggleTheme}
                style={{opacity:0,width:0,height:0,position:'absolute'}} />
              <div style={{
                position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:10,
                background:theme==='dark'?'var(--accent)':'var(--bg-input)',
                border:'1px solid var(--border-active)',transition:'background 0.15s'
              }}>
                <div style={{
                  position:'absolute',top:2,left:theme==='dark'?18:2,
                  width:14,height:14,borderRadius:'50%',
                  background:'white',transition:'left 0.15s'
                }}/>
              </div>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>Dark mode</div>
            </div>
          </label>

          {/* Language */}
          <div className="field-section-title" style={{marginTop:14}}>Language</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,padding:'8px 0',
            borderBottom:'1px solid var(--border)'}}>
            {LANGUAGES.map(l => (
              <button key={l.code}
                className={'tag-chip' + (i18n.language===l.code?' active':'')}
                onClick={() => i18n.changeLanguage(l.code)}
                style={{fontSize:12}}
              >{l.label}</button>
            ))}
          </div>

          {/* Cable compatibility */}
          <div className="field-section-title" style={{marginTop:14}}>Cable Compatibility</div>
          <Toggle
            value={settings.enforceConnectorTypes}
            onChange={v => updateSettings({ enforceConnectorTypes: v })}
            label="Warn on connector mismatch"
            hint="Show a warning when cable type doesn't match port connector type"
          />

          {/* Keyboard shortcuts */}
          <div className="field-section-title" style={{marginTop:14}}>Keyboard Shortcuts</div>
          <div style={{padding:'8px 0 4px',borderBottom:'1px solid var(--border)'}}>
            {[
              ['Ctrl+S', 'Save project'],
              ['Ctrl+O', 'Open project'],
              ['Ctrl+N', 'New project'],
              ['Ctrl+E', 'Export'],
              ['Delete / Backspace', 'Delete selected node or cable'],
              ['Escape', 'Close modal / deselect'],
            ].map(([key, action]) => (
              <div key={key} style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'4px 0',fontSize:12}}>
                <span style={{color:'var(--text-secondary)'}}>{action}</span>
                <code style={{background:'var(--bg-input)',border:'1px solid var(--border)',
                  borderRadius:4,padding:'1px 7px',fontSize:11,color:'var(--text-primary)'}}>{key}</code>
              </div>
            ))}
          </div>

          {/* Export defaults */}
          <div className="field-section-title" style={{marginTop:14}}>Export Defaults</div>
          <div style={{padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Default format</div>
            <div style={{display:'flex',gap:8}}>
              {['html','png'].map(fmt => (
                <button key={fmt}
                  className={'props-btn' + (settings.defaultExportFormat===fmt?' accent':'')}
                  onClick={() => updateSettings({ defaultExportFormat: fmt })}
                  style={{flex:1,textTransform:'uppercase',fontSize:11,letterSpacing:1}}
                >{fmt}</button>
              ))}
            </div>
          </div>
          <Toggle
            value={settings.defaultExportLegend}
            onChange={v => updateSettings({ defaultExportLegend: v })}
            label="Include signal legend by default"
          />
          <Toggle
            value={settings.defaultExportColor}
            onChange={v => updateSettings({ defaultExportColor: v })}
            label="Color export by default"
            hint="Uncheck for black & white"
          />
        </div>
        <div className="modal-footer">
          <button className="props-btn accent" onClick={closeModal}>Done</button>
        </div>
      </div>
    </div>
  )
}
