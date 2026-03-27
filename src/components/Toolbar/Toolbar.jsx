import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { CABLE_TYPES, CABLE_GROUPS } from '../../constants/cableTypes'
import { APP_NAME, APP_VERSION } from '../../version'
import LangSelector from './LangSelector'

export default function Toolbar() {
  const { t } = useTranslation('t')
  const {
    projectName, isDirty, theme,
    saveProject, loadProject, newProject,
    selectedCableType, setSelectedCableType,
    toggleTheme, openModal,
    sceneStack, scenes, navigateToScene, exitScene,
  } = useStore()

  const crumbs = sceneStack.map((id, i) => ({
    id, label: scenes[id]?.label || (id === 'main' ? 'Main' : id), idx: i
  }))
  const currentScene = scenes[sceneStack[sceneStack.length - 1]]
  const nodeCount = currentScene?.nodes?.length || 0
  const edgeCount = currentScene?.edges?.length || 0

  return (
    <div className="toolbar">
      <span className="toolbar-brand">⚡ {t('appName')}</span>
      <div className="toolbar-sep" />

      <button className="tb-btn" onClick={newProject}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h7l3 3v9H2V2zm7-1H1v13h12V4.5L9 1z"/><path d="M8 1v4h4v-1H9V1H8z"/></svg>
        {t('new')}
      </button>
      <button className="tb-btn" onClick={saveProject}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2v12h12V4.5L11.5 2H2zm5 10a2 2 0 110-4 2 2 0 010 4zm3-7H3V3h7v2z"/></svg>
        {t('save')} {isDirty && <span className="dirty-dot" />}
      </button>
      <button className="tb-btn" onClick={loadProject}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3h5l2 2h7v9H1V3zm0 3v7h13V6H7.5L5.5 4H1v2z"/></svg>
        {t('open')}
      </button>

      <div className="toolbar-sep" />

      <button className="tb-btn" onClick={() => openModal('export')}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v9m0 0L5 7m3 3l3-3M2 12v2h12v-2H2"/></svg>
        {t('export')}
      </button>

      <div className="toolbar-sep" />

      <div className="breadcrumb">
        {crumbs.map((c, i) => (
          <span key={c.id}>
            {i > 0 && <span className="breadcrumb-sep">›</span>}
            <button
              className={'breadcrumb-item' + (i === crumbs.length - 1 ? ' active' : '')}
              onClick={() => navigateToScene(c.idx)}
            >{c.label}</button>
          </span>
        ))}
        {sceneStack.length > 1 && (
          <button className="tb-btn" onClick={exitScene} style={{marginLeft: 4}}>↩ {t('back')}</button>
        )}
      </div>

      <div className="toolbar-sep" />

      <div className="cable-selector">
        <label>{t('cable')}:</label>
        {Object.values(CABLE_GROUPS).flat().map(key => (
          <button key={key}
            className={'cable-chip' + (selectedCableType === key ? ' active' : '')}
            style={{ color: CABLE_TYPES[key].color }}
            onClick={() => setSelectedCableType(key)}
            title={CABLE_TYPES[key].desc}
          >
            {CABLE_TYPES[key].label.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="toolbar-right">
        <span style={{color:'var(--text-dim)',fontSize:13}}>
          {nodeCount} {t('nodes')} · {edgeCount} {t('edges')}
        </span>
        <div className="toolbar-sep" />
        <button className="tb-btn" onClick={toggleTheme}>{theme === 'dark' ? '☀' : '🌙'}</button>
        <LangSelector />
        <button className="tb-btn" onClick={() => openModal('manual')}>?</button>
        <div className="toolbar-sep" />
        <span style={{color:'var(--text-secondary)',fontSize:13,opacity:0.6}}>{APP_VERSION}</span>
        <div className="toolbar-sep" />
        <span style={{color:'var(--text-secondary)',fontSize:14,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{projectName}</span>
      </div>
    </div>
  )
}
