import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { platform } from '../../platform'

/*const RACK_ENTRY = {
  name: 'rack', src: null, isRack: true,
  tags: ['utility'], source: 'factory', label: 'Rack',
}*/

export default function Sidebar() {
  const { t } = useTranslation('t')
  const iconsLibrary  = useStore(s => s.iconsLibrary)
  const deviceLibrary = useStore(s => s.deviceLibrary)
  const openModal          = useStore(s => s.openModal)
  const deleteCustomDevice = useStore(s => s.deleteCustomDevice)
  const scenes             = useStore(s => s.scenes)
  const sceneStack    = useStore(s => s.sceneStack)
  const isInRack      = sceneStack.length > 1

  // Build rack entry with live icon src, excluding it from regular device list
  const rackIconSrc = iconsLibrary['rack']?.find(ic => ic.name === 'rack')?.src || null
  const RACK_ENTRY = { name: 'rack', src: rackIconSrc, isRack: true, tags: ['utility'], source: 'factory', label: 'Rack' }

  const [search,      setSearch]      = useState('')
  const [activeTag,   setActiveTag]   = useState(null)
  const [showCustom,  setShowCustom]  = useState(true)
  const [showFactory, setShowFactory] = useState(true)

  // Build flat list from icon library + custom devices
  const allItems = useMemo(() => {
    const items = isInRack ? [] : [RACK_ENTRY]  // no nested racks

    for (const icons of Object.values(iconsLibrary)) {
      for (const icon of icons) {
        // Skip rack.svg — it is used only for the Rack container entry above
        if (icon.name === 'rack') continue
        items.push({
          ...icon,
          label: icon.name.replace(/_/g, ' '),
        })
      }
    }

    for (const dev of deviceLibrary) {
      items.push({ ...dev, label: dev.name })
    }

    return items
  }, [iconsLibrary, deviceLibrary, isInRack])

  // When inside a rack scene: only show items tagged 'rack'
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allItems.filter(item => {
      if (isInRack && !item.tags?.includes('rack')) return false
      if (activeTag && !item.tags?.includes(activeTag)) return false
      return !(q && !item.label?.toLowerCase().includes(q) &&
          !item.tags?.join(' ').toLowerCase().includes(q));

    })
  }, [allItems, search, activeTag, isInRack])

  const factoryItems = filtered.filter(i => i.source === 'factory')
  const customItems  = filtered.filter(i => i.source === 'custom')

  const onDragStart = (e, item) => {
    e.dataTransfer.setData('application/bandwire', JSON.stringify({
      name:           item.name || item.id,
      src:            item.src  || item.iconSrc,
      model:          item.model || '',
      isRack:         !!item.isRack,
      defaultInputs:  item.defaultInputs  || [],
      defaultOutputs: item.defaultOutputs || [],
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  // Tags available in current filtered context
  const availableTags = useMemo(() => {
    const set = new Set()
    allItems.forEach(i => i.tags?.forEach(t => set.add(t)))
    return [...set].sort()
  }, [allItems])

  const handleDeleteDevice = (item) => {
    let usages = 0
    for (const scene of Object.values(scenes || {})) {
      usages += (scene?.nodes || []).filter(n => n.data?.label === item.name).length
    }
    const msg = usages > 0
      ? `"${item.name}" is used in ${usages} place${usages>1?'s':''} on the canvas. Existing nodes will keep their current state but lose the device definition. Delete anyway?`
      : `Delete "${item.name}"?`
    openModal('confirm', {
      title: 'Delete Custom Device',
      message: msg,
      confirmLabel: 'Delete',
      onConfirm: () => deleteCustomDevice(item.id),
    })
  }

  return (
    <aside className="sidebar">
      {isInRack && (
        <div className="sidebar-rack-banner">
          🗄 Rack scene — showing rack gear only
        </div>
      )}

      <div className="sidebar-search">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchDevices')}
        />
      </div>

      <div className="sidebar-tags">
        <button
          className={'tag-chip' + (!activeTag ? ' active' : '')}
          onClick={() => setActiveTag(null)}
        >{t('tagAll')}</button>
        {availableTags.map(t => (
          <button
            key={t}
            className={'tag-chip' + (activeTag === t ? ' active' : '')}
            onClick={() => setActiveTag(activeTag === t ? null : t)}
          >{t}</button>
        ))}
      </div>

      <div className="sidebar-body">
        {factoryItems.length > 0 && (
          <div className="sidebar-category">
            <div className="sidebar-cat-header" onClick={() => setShowFactory(v => !v)}>
              Factory
              <span className="sidebar-cat-arrow" style={{ transform: showFactory ? 'rotate(90deg)' : '' }}>▶</span>
            </div>
            {showFactory && (
              <div className="sidebar-icons">
                {factoryItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={'sidebar-icon-item' + (item.isRack ? ' sidebar-icon-rack' : '')}
                    draggable
                    onDragStart={e => onDragStart(e, item)}
                    title={item.label + ' [factory]'}
                  >
                    {item.src || item.iconSrc
                      ? <img className="sidebar-icon-img" src={item.src || item.iconSrc} alt={item.label} />
                      : <span className="sidebar-icon-emoji">🗄</span>
                    }
                    <span className="sidebar-icon-name">{item.label}</span>
                    <span className="sidebar-icon-factory-badge" title="Factory device — read only">F</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {customItems.length > 0 && (
          <div className="sidebar-category">
            <div className="sidebar-cat-header" onClick={() => setShowCustom(v => !v)}>
              My Devices
              <span className="sidebar-cat-arrow" style={{ transform: showCustom ? 'rotate(90deg)' : '' }}>▶</span>
            </div>
            {showCustom && (
              <div className="sidebar-icons">
                {customItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="sidebar-icon-item sidebar-icon-custom"
                    draggable
                    onDragStart={e => onDragStart(e, item)}
                    title={item.label + ' [custom]'}
                  >
                    {item.iconSrc
                      ? <img className="sidebar-icon-img" src={item.iconSrc} alt={item.label} />
                      : <span className="sidebar-icon-emoji">📦</span>
                    }
                    <span className="sidebar-icon-name">{item.label}</span>
                    <button
                      className="sidebar-icon-delete-badge"
                      title="Delete custom device"
                      onClick={e => { e.stopPropagation(); handleDeleteDevice(item) }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="sidebar-empty">
            {isInRack
              ? t('noRackDevices').split('\n').map((l,i) => <span key={i}>{l}<br/></span>)
              : t('noDevicesMatch')
            }
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button onClick={() => openModal('addDevice')}>{t('addCustomDevice')}</button>
        <button onClick={() => platform.openIconsFolder()}>{t('openIconsFolder')}</button>
      </div>
    </aside>
  )
}
