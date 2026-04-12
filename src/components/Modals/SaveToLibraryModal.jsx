import { useState } from 'react'
import useStore from '../../store/useStore'

export default function SaveToLibraryModal() {
  const { closeModal, saveToLibrary, projectName, modalPayload } = useStore(s => ({ closeModal: s.closeModal, saveToLibrary: s.saveToLibrary, projectName: s.projectName, modalPayload: s.modalPayload }))

  const existing = modalPayload?.existing || null
  const isSaveAs = !!modalPayload?.saveAs

  const [name,        setName]        = useState(existing?.name        || projectName || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [category,    setCategory]    = useState(existing?.category    || '')
  const [notes,       setNotes]       = useState(existing?.notes       || '')
  const [error,       setError]       = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return }
    if (description.length > 200) { setError('Description max 200 characters.'); return }
    await saveToLibrary({
      name: name.trim(),
      description: description.trim(),
      filename: existing?.filename || null,
      category: category.trim(),
      notes: notes.trim(),
      createdAt: existing?.createdAt || null,
      saveAs: isSaveAs || undefined,
      data: existing?.data || undefined,  // pass through imported data if present
    })
    closeModal()
  }

  return (
    <div className="modal-backdrop" onMouseDown={closeModal}>
      <div className="modal" onMouseDown={e => e.stopPropagation()} style={{width: 480}}>
        <div className="modal-header">
          <span>{isSaveAs ? 'Save As…' : existing ? 'Update in Library' : 'Save to Library'}</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>

        <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="field">
            <label>Project name *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              placeholder="e.g. Festival Main Stage" />
            {error && <span className="field-error">{error}</span>}
          </div>

          <div className="field">
            <label>
              Description
              <span style={{fontSize:10,color:'var(--text-dim)',marginLeft:8}}>
                {description.length}/200
              </span>
            </label>
            <textarea value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this project..."
              style={{minHeight:60,resize:'vertical'}}
              maxLength={200}
            />
          </div>

          <div className="field">
            <label>Category / Tag</label>
            <input value={category} onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Festival, Club, Tour 2025..." />
          </div>

          <div className="field">
            <label>
              Internal notes
              <span style={{fontSize:10,color:'var(--text-dim)',marginLeft:8}}>
                (not included in exports by default)
              </span>
            </label>
            <textarea value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Private notes, reminders, context..."
              style={{minHeight:60,resize:'vertical'}}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="props-btn" onClick={closeModal}>Cancel</button>
          <button className="props-btn accent" onClick={handleSave}>
            {isSaveAs ? 'Save As' : existing ? 'Update' : 'Save to Library'}
          </button>
        </div>
      </div>
    </div>
  )
}
