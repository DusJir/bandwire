import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { platform } from '../../platform'
import { FACTORY_TAGS } from '../../constants/factoryTags'
import { CONNECTOR_TYPES } from '../../constants/connectorTypes'

export default function AddDeviceModal() {
  const { t } = useTranslation('t')
  const { closeModal, addCustomDevice, iconsLibrary } = useStore()

  const [name,     setName]     = useState('')
  const [model,    setModel]    = useState('')
  const [tags,     setTags]     = useState([])
  const [tagInput, setTagInput] = useState('')
  const [iconSrc,  setIconSrc]  = useState(null)
  const [iconTab,  setIconTab]  = useState('upload')
  const [inputs,   setInputs]   = useState([{ id: 'in-0',  label: '', connector: 'XLR' }])
  const [outputs,  setOutputs]  = useState([{ id: 'out-0', label: '', connector: 'XLR' }])
  const [notes,    setNotes]    = useState('')
  const [error,    setError]    = useState('')

  const toggleTag = (tag) => setTags(p => p.includes(tag) ? p.filter(x => x !== tag) : [...p, tag])

  const addCustomTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !tags.includes(tag)) setTags(p => [...p, tag])
    setTagInput('')
  }

  const handleUpload = async () => {
    const svg = await platform.readSvgFile()
    if (!svg) return
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    setIconSrc(URL.createObjectURL(blob))
  }

  const addPort = (side) => {
    const p = { id: side + '-' + crypto.randomUUID().slice(0,8), label: '', connector: 'XLR' }
    if (side === 'in') setInputs(v => [...v, p])
    else               setOutputs(v => [...v, p])
  }
  const updatePort = (side, idx, field, val) => {
    if (side === 'in') setInputs(v  => v.map((p, i) => i === idx ? { ...p, [field]: val } : p))
    else               setOutputs(v => v.map((p, i) => i === idx ? { ...p, [field]: val } : p))
  }
  const removePort = (side, idx) => {
    if (side === 'in') setInputs(v  => v.filter((_, i) => i !== idx))
    else               setOutputs(v => v.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    if (!name.trim()) { setError(t('nameRequired')); return }
    addCustomDevice({ name: name.trim(), model, tags, iconSrc, defaultInputs: inputs, defaultOutputs: outputs, notes })
    closeModal()
  }

  const libraryIcons = Object.entries(iconsLibrary).flatMap(([cat, icons]) =>
    icons.map(ic => ({ ...ic, cat }))
  )

  return (
    <div className="modal-backdrop" onMouseDown={closeModal}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t('addCustomDeviceTitle')}</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-cols">
            {/* Left col */}
            <div className="modal-col">
              <div className="field">
                <label>{t('name')} *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder={t('deviceNamePlaceholder')} autoFocus />
                {error && <span className="field-error">{error}</span>}
              </div>
              <div className="field">
                <label>{t('modelMake')}</label>
                <input value={model} onChange={e => setModel(e.target.value)}
                  placeholder={t('modelDevicePlaceholder')} />
              </div>
              <div className="field">
                <label>{t('notes')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder={t('optionalNotesPlaceholder')} rows={3} />
              </div>
              <div className="field">
                <label>{t('tags')}</label>
                <div className="tag-picker">
                  {FACTORY_TAGS.map(tag => (
                    <button key={tag}
                      className={'tag-chip small' + (tags.includes(tag) ? ' active' : '')}
                      onClick={() => toggleTag(tag)}>{tag}</button>
                  ))}
                </div>
                <div className="tag-custom-input">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                    placeholder={t('customTagPlaceholder')} />
                  <button onClick={addCustomTag}>{t('addTag')}</button>
                </div>
                {tags.length > 0 && (
                  <div className="tag-active-list">
                    {tags.map(tag => (
                      <span key={tag} className="tag-active">
                        {tag} <button onClick={() => toggleTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right col */}
            <div className="modal-col">
              <div className="field">
                <label>{t('icon')}</label>
                <div className="icon-tab-bar">
                  <button className={'icon-tab' + (iconTab === 'upload'  ? ' active' : '')} onClick={() => setIconTab('upload')}>{t('uploadSvg')}</button>
                  <button className={'icon-tab' + (iconTab === 'library' ? ' active' : '')} onClick={() => setIconTab('library')}>{t('fromLibrary')}</button>
                </div>
                {iconTab === 'upload' && (
                  <div className="icon-upload-area">
                    {iconSrc
                      ? <img src={iconSrc} className="icon-preview" alt="icon" />
                      : <span className="icon-upload-placeholder">{t('noIconSelected')}</span>
                    }
                    <button className="add-port-btn" onClick={handleUpload}>{t('browseSvg')}</button>
                  </div>
                )}
                {iconTab === 'library' && (
                  <div className="icon-library-grid">
                    {libraryIcons.map((ic, i) => (
                      <div key={i} className={'icon-lib-item' + (iconSrc === ic.src ? ' active' : '')}
                        onClick={() => setIconSrc(ic.src)} title={ic.name}>
                        <img src={ic.src} alt={ic.name} />
                      </div>
                    ))}
                    {libraryIcons.length === 0 && <span className="sidebar-empty">{t('noFactoryIcons')}</span>}
                  </div>
                )}
              </div>

              <div className="field-section-title">{t('defaultInputs')}</div>
              <div className="port-list">
                {inputs.map((p, i) => (
                  <div key={p.id} className="port-item port-item-full">
                    <input value={p.label} onChange={e => updatePort('in', i, 'label', e.target.value)}
                      placeholder={t('inPort') + ' ' + (i + 1)} />
                    <select value={p.connector} onChange={e => updatePort('in', i, 'connector', e.target.value)} className="port-connector-select">
                      {CONNECTOR_TYPES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button className="port-del-btn" onClick={() => removePort('in', i)}>×</button>
                  </div>
                ))}
                <button className="add-port-btn" onClick={() => addPort('in')}>{t('addInput')}</button>
              </div>

              <div className="field-section-title">{t('defaultOutputs')}</div>
              <div className="port-list">
                {outputs.map((p, i) => (
                  <div key={p.id} className="port-item port-item-full">
                    <input value={p.label} onChange={e => updatePort('out', i, 'label', e.target.value)}
                      placeholder={t('outPort') + ' ' + (i + 1)} />
                    <select value={p.connector} onChange={e => updatePort('out', i, 'connector', e.target.value)} className="port-connector-select">
                      {CONNECTOR_TYPES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button className="port-del-btn" onClick={() => removePort('out', i)}>×</button>
                  </div>
                ))}
                <button className="add-port-btn" onClick={() => addPort('out')}>{t('addOutput')}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="props-btn" onClick={closeModal}>{t('cancel')}</button>
          <button className="props-btn accent" onClick={handleSave}>{t('saveDevice')}</button>
        </div>
      </div>
    </div>
  )
}
