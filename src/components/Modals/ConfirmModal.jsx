import useStore from '../../store/useStore'

export default function ConfirmModal() {
  const { closeModal, modalPayload } = useStore()
  const { title, message, confirmLabel = 'Delete', onConfirm } = modalPayload || {}

  const handleConfirm = () => {
    onConfirm?.()
    closeModal()
  }

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()} style={{maxWidth:380}}>
        <div className="modal-header">
          <span>{title || 'Confirm'}</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>
        <div className="modal-body" style={{padding:'20px 24px'}}>
          <p style={{color:'var(--text-secondary)',fontSize:14,lineHeight:1.6}}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="props-btn" onClick={closeModal}>Cancel</button>
          <button className="props-btn danger" onClick={handleConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
