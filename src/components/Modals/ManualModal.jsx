import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { APP_NAME, APP_VERSION } from '../../version'

export default function ManualModal() {
  const { t }       = useTranslation('t')
  const closeModal  = useStore(s => s.closeModal)

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>{title}</h2>
      {children}
    </div>
  )

  const Sub = ({ title }) => (
    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', margin: '12px 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
  )

  const P = ({ k }) => (
    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: '4px 0' }}>{t(k)}</p>
  )

  return (
    <div className="modal-backdrop" onMouseDown={closeModal}>
      <div className="modal" onMouseDown={e => e.stopPropagation()} style={{ width: 700, maxHeight: '88vh' }}>
        <div className="modal-header">
          <span>📖 {t('manual')} — {APP_NAME} {APP_VERSION}</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto' }}>

          <Section title={t('mGettingStarted')}>
            <P k="mGettingStartedText" />
          </Section>

          <Section title={t('mNodes')}>
            <P k="mNodesText" />
            <Sub title={t('mAddingNodes')} />
            <P k="mAddingNodesText" />
            <Sub title={t('mRacks')} />
            <P k="mRacksText" />
          </Section>

          <Section title={t('mConnections')}>
            <P k="mConnectionsText" />
            <Sub title={t('mCableTypes')} />
            <P k="mCableTypesText" />
          </Section>

          <Section title={t('mProperties')}>
            <P k="mPropertiesText" />
            <Sub title={t('mPorts')} />
            <P k="mPortsText" />
          </Section>

          <Section title={t('mExport')}>
            <P k="mExportText" />
          </Section>

          <Section title={t('mIconLibrary')}>
            <P k="mIconLibraryText" />
          </Section>

          <Section title={t('mStage')}>
            <P k="mStageTagline" />
            <P k="mStageIntro" />
            <Sub title={t('mStageDevices')} />
            <P k="mStageDevicesText" />
            <Sub title={t('mStageRoles')} />
            <P k="mStageRolesText" />
            <Sub title={t('mStageOutline')} />
            <P k="mStageOutlineText" />
            <Sub title={t('mStageExport')} />
            <P k="mStageExportText" />
            <Sub title={t('mStageRider')} />
            <P k="mStageRiderText" />
          </Section>

          <Section title={t('mProjects')}>
            <P k="mProjectsText" />
          </Section>

          <Section title={t('mKeyboard')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              {[
                ['Ctrl+S', t('save')],
                ['Ctrl+O', t('open')],
                ['Ctrl+N', t('newProject')],
                ['Ctrl+E', t('export')],
                ['Del / Backspace', t('mDeleteSelected')],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '3px 0' }}>
                  <code style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{key}</code>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
        <div className="modal-footer">
          <button className="props-btn accent" onClick={closeModal}>{t('close')}</button>
        </div>
      </div>
    </div>
  )
}
