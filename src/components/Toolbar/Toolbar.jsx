import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { platform } from '../../platform'
import { APP_VERSION } from '../../version'
import LangSelector from './LangSelector'

import logoSvg        from '../../assets/app-icons/bandwire-logo.svg'
import newSvg         from '../../assets/app-icons/app-new.svg'
import newInvSvg      from '../../assets/app-icons/app-new-inv.svg'
import saveSvg        from '../../assets/app-icons/app-save.svg'
import saveInvSvg     from '../../assets/app-icons/app-save-inv.svg'
import openSvg        from '../../assets/app-icons/app-open.svg'
import openInvSvg     from '../../assets/app-icons/app-open-inv.svg'
import exportSvg      from '../../assets/app-icons/app-export.svg'
import exportInvSvg   from '../../assets/app-icons/app-export-inv.svg'
import themeSvg       from '../../assets/app-icons/app-theme.svg'
import themeInvSvg    from '../../assets/app-icons/app-theme-inv.svg'
import settingsSvg    from '../../assets/app-icons/app-settings.svg'
import settingsInvSvg from '../../assets/app-icons/app-settings-inv.svg'
import manualSvg      from '../../assets/app-icons/app-manual.svg'
import schemaSvg      from '../../assets/app-icons/app-schema.svg'
import schemaInvSvg   from '../../assets/app-icons/app-schem-inv.svg'
import stageSvg       from '../../assets/app-icons/app-stage.svg'
import stageInvSvg    from '../../assets/app-icons/app-stage-inv.svg'
import manualInvSvg   from '../../assets/app-icons/app-manual-inv.svg'
import librarySvg     from '../../assets/app-icons/app-library.svg'
import libraryInvSvg  from '../../assets/app-icons/app-library-inv.svg'
import saveAsSvg      from '../../assets/app-icons/app-save-as.svg'
import saveAsInvSvg   from '../../assets/app-icons/app-save-as-inv.svg'
import importSvg      from '../../assets/app-icons/app-import.svg'
import importInvSvg   from '../../assets/app-icons/app-import-inv.svg'

const ICONS = {
  'app-new':      [newSvg,      newInvSvg],
  'app-save':     [saveSvg,     saveInvSvg],
  'app-open':     [openSvg,     openInvSvg],
  'app-export':   [exportSvg,   exportInvSvg],
  'app-theme':    [themeSvg,    themeInvSvg],
  'app-settings': [settingsSvg, settingsInvSvg],
  'app-manual':   [manualSvg,   manualInvSvg],
  'app-schema':   [schemaSvg,   schemaInvSvg],
  'app-stage':    [stageSvg,    stageInvSvg],
  'app-library':  [librarySvg,  libraryInvSvg],
  'app-save-as':  [saveAsSvg,   saveAsInvSvg],
  'app-import':   [importSvg,   importInvSvg],
}

function TbIcon({ name, size = 16 }) {
  const theme = useStore(s => s.theme)
  const [normal, inv] = ICONS[name] || []
  const src = theme === 'dark' ? inv : normal
  return src
    ? <img src={src} width={size} height={size} alt="" draggable={false} style={{flexShrink:0, opacity:0.9}} />
    : null
}

export default function Toolbar() {
  const { t } = useTranslation('t')
  const {
    isDirty, theme, appMode, setAppMode,
    saveProject, newProject, saveToLibrary,
    toggleTheme, openModal, libraryId,
    sceneStack, scenes, navigateToScene, exitScene,
  } = useStore()
  const projectName = useStore(s => s.projectName)

  const crumbs = sceneStack.map((id, i) => ({
    id, label: scenes[id]?.label || (id === 'main' ? 'Main' : id), idx: i
  }))
  const currentScene = scenes[sceneStack[sceneStack.length - 1]]
  const nodeCount = currentScene?.nodes?.length || 0
  const edgeCount = currentScene?.edges?.length || 0

  return (
    <div className="toolbar">
      <img src={logoSvg} alt="BandWire" height={22} style={{flexShrink:0, marginRight:2}} draggable={false} />

      <div className="toolbar-sep" />

      <button className="tb-btn" onClick={newProject} title="New project (Ctrl+N)">
        <TbIcon name="app-new" /> {t('new')}
      </button>
      <button className="tb-btn" onClick={async () => {
          if (libraryId) {
            const entry = await platform.library.get(libraryId)
            if (entry) {
              useStore.getState().saveToLibrary({ name: entry.name, description: entry.description, filename: entry.filename, category: entry.category, notes: entry.notes, createdAt: entry.createdAt })
              return
            }
          }
          openModal('saveToLibrary')
        }} title="Save to Library (Ctrl+S)">
        <TbIcon name="app-save" /> {t('save')} {isDirty && <span className="dirty-dot" />}
      </button>
      <button className="tb-btn" onClick={() => openModal('saveToLibrary', { saveAs: true })}
        title="Save As… (Ctrl+Shift+S)">
        <TbIcon name="app-save-as" /> {t('saveAs')}
      </button>
      <button className="tb-btn" onClick={() => openModal('library')} title="Project Library (Ctrl+O)">
        <TbIcon name="app-library" /> {t('open')}
      </button>

      <div className="toolbar-sep" />

      <button className="tb-btn"
        onClick={() => openModal(appMode === 'stage' ? 'stageExport' : 'export')}
        title="Export (Ctrl+E)"
      >
        <TbIcon name="app-export" /> {t('export')}
      </button>

      <div className="toolbar-sep" />

      {/* Mode switcher */}
      <div className="mode-switcher">
        <button
          className={'mode-btn' + (appMode === 'schema' ? ' active' : '')}
          onClick={() => setAppMode('schema')}
          title="Signal flow diagram"
        ><TbIcon name="app-schema" /> Schema</button>
        <button
          className={'mode-btn' + (appMode === 'stage' ? ' active' : '')}
          onClick={() => setAppMode('stage')}
          title="Stage plot"
        ><TbIcon name="app-stage" /> Stage</button>
      </div>

      <div className="toolbar-sep" />

      {/* Breadcrumb — only in schema mode */}
      {appMode === 'schema' && <div className="breadcrumb">
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
          <button className="tb-btn" onClick={exitScene} style={{marginLeft:4}}>↩ {t('back')}</button>
        )}
      </div>}

      <div className="toolbar-right">
        <span style={{color:'var(--text-dim)',fontSize:13}}>
          {nodeCount} {t('nodes')} · {edgeCount} {t('edges')}
        </span>
        <div className="toolbar-sep" />
        <button className="tb-btn" onClick={toggleTheme} title="Toggle theme">
          <TbIcon name="app-theme" />
        </button>
        <LangSelector />
        <button className="tb-btn" onClick={() => openModal('settings')} title="Settings">
          <TbIcon name="app-settings" />
        </button>
        <button className="tb-btn" onClick={() => openModal('manual')} title="Manual">
          <TbIcon name="app-manual" />
        </button>
        <div className="toolbar-sep" />
        <span style={{color:'var(--text-secondary)',fontSize:13,opacity:0.6}}>{APP_VERSION}</span>
        <div className="toolbar-sep" />
        <span style={{
          color:'var(--text-secondary)',fontSize:14,
          maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'
        }}>{projectName}</span>
      </div>
    </div>
  )
}
