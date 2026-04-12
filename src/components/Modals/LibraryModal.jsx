import { useState, useEffect, useCallback } from 'react'
import useStore from '../../store/useStore'
import { platform } from '../../platform'

import libSchemaSvg    from '../../assets/app-icons/lib-schema.svg'
import libSchemaInvSvg from '../../assets/app-icons/lib-schema-inv.svg'
import libStageSvg     from '../../assets/app-icons/lib-stage.svg'
import libStageInvSvg  from '../../assets/app-icons/lib-stage-inv.svg'
import libBothSvg      from '../../assets/app-icons/lib-both.svg'
import libBothInvSvg   from '../../assets/app-icons/lib-both-inv.svg'

function projectIcon(entry, theme) {
  const inv = theme === 'dark'
  if (entry.hasSchema && entry.hasStage) return inv ? libBothInvSvg  : libBothSvg
  if (entry.hasStage)                    return inv ? libStageInvSvg : libStageSvg
  return                                        inv ? libSchemaInvSvg : libSchemaSvg
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' })
}

function ProjectCard({ entry, onOpen, onDelete, onExport, theme }) {
  const icon = projectIcon(entry, theme)
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 14px 12px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'border-color 0.15s',
      position: 'relative',
    }}
      onClick={() => onOpen(entry)}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Actions */}
      <div style={{position:'absolute',top:8,right:8,display:'flex',gap:4}}
        onClick={e => e.stopPropagation()}>
        {onExport && (
          <button className="props-btn" style={{padding:'2px 7px',fontSize:10}}
            title="Export to file" onClick={() => onExport(entry)}>↓</button>
        )}
        <button className="props-btn danger" style={{padding:'2px 7px',fontSize:10}}
          title="Remove from library" onClick={() => onDelete(entry)}>×</button>
      </div>

      {/* Icon */}
      <img src={icon} width={48} height={48} draggable={false}
        style={{alignSelf:'center',opacity:0.9}} />

      {/* Name */}
      <div style={{fontSize:13,fontWeight:700,color:'var(--text-primary)',
        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:40}}>
        {entry.name}
      </div>

      {/* Meta */}
      <div style={{fontSize:11,color:'var(--text-secondary)',display:'flex',
        flexDirection:'column',gap:2}}>
        {entry.category && (
          <span style={{background:'var(--accent-dim)',color:'var(--accent)',
            borderRadius:4,padding:'1px 6px',fontSize:10,alignSelf:'flex-start'}}>
            {entry.category}
          </span>
        )}
        {entry.description && (
          <span style={{overflow:'hidden',display:'-webkit-box',
            WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
            {entry.description}
          </span>
        )}
        <span style={{color:'var(--text-dim)',marginTop:2}}>
          {formatDate(entry.updatedAt)}
        </span>
      </div>
    </div>
  )
}

export default function LibraryModal() {
  const { closeModal, loadFromLibrary, loadProject, openModal, theme } = useStore()
  const [entries,  setEntries]  = useState([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const all = await platform.library.getAll()
    setEntries(all)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    return !q || e.name.toLowerCase().includes(q)
      || (e.category || '').toLowerCase().includes(q)
      || (e.description || '').toLowerCase().includes(q)
  })

  const handleOpen = (entry) => {
    loadFromLibrary(entry)
    closeModal()
  }

  const handleDelete = async (entry) => {
    if (!confirm(`Remove "${entry.name}" from library? The project data will be lost.`)) return
    await platform.library.delete(entry.id)
    reload()
  }

  const handleExport = async (entry) => {
    await platform.library.exportFile(entry)
  }

  const handleImport = async () => {
    const result = await platform.library.importFile()
    if (!result) return
    // Import = add to library with filename as name
    openModal('saveToLibrary', {
      saveAs: true,   // always create new entry, never replace existing
      existing: {
        name: result.filename.replace(/\.sflow$/i, ''),
        filename: result.filename,
        data: result.content,
      }
    })
  }

  const handleOpenFile = async () => {
    closeModal()
    await loadProject()
  }

  return (
    <div className="modal-backdrop" onMouseDown={closeModal}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}
        style={{width:'72vw', maxWidth:1000, height:'75vh',
          display:'flex', flexDirection:'column'}}>

        <div className="modal-header">
          <span>Project Library</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>

        {/* Toolbar */}
        <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',
          display:'flex',gap:8,alignItems:'center'}}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            style={{flex:1,maxWidth:320}}
          />
          <span style={{fontSize:12,color:'var(--text-dim)',marginLeft:4}}>
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={{flex:1}}/>
          <button className="props-btn accent" onClick={() => {
            closeModal()
            useStore.getState().newProject()
            setTimeout(() => useStore.getState().openModal('saveToLibrary'), 50)
          }}>+ New project</button>
          <button className="props-btn" onClick={handleImport}>Import file</button>
          <button className="props-btn" onClick={handleOpenFile}>Open from file</button>
        </div>

        {/* Grid */}
        <div style={{flex:1,overflowY:'auto',padding:16}}>
          {loading ? (
            <div style={{color:'var(--text-dim)',textAlign:'center',marginTop:40}}>
              Loading library...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{color:'var(--text-dim)',textAlign:'center',marginTop:40}}>
              {search ? 'No projects match your search.' : 'Library is empty. Save a project with Ctrl+S.'}
            </div>
          ) : (
            <div style={{display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
              {filtered.map(entry => (
                <ProjectCard key={entry.id} entry={entry} theme={theme}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                  onExport={platform.isElectron() ? handleExport : null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
