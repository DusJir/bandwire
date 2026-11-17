import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { buildSections, casesOf, totals } from '../../utils/load'
import { exportLoadList } from './loadExport'

// Numeric input with local text state — commits on blur / Enter so typing is never fought
function NumInput({ value, onCommit, min = 1, width, disabled, title }) {
  const [text, setText] = useState(value == null ? '' : String(value))
  useEffect(() => { setText(value == null ? '' : String(value)) }, [value])
  const commit = () => {
    const n = parseFloat(text.replace(',', '.'))
    if (text.trim() === '') onCommit(null)
    else if (Number.isFinite(n)) onCommit(Math.max(min, n))
    else setText(value == null ? '' : String(value))
  }
  return (
    <input className="ld-input" style={{ width }} value={text} disabled={disabled} title={title}
           inputMode="decimal"
           onChange={e => setText(e.target.value)} onBlur={commit}
           onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} />
  )
}

function ItemRow({ item, depth, cases, categories }) {
  const { t } = useTranslation('t')
  const update = useStore(s => s.updateLoadItem)
  const remove = useStore(s => s.removeLoadItem)
  const set = (patch) => update(item.id, patch)
  const circle = item.shape === 'circle'

  return (
    <div className={'ld-row' + (item.isCase ? ' is-case' : '')}>
      <input type="checkbox" checked={item.isCase} title={t('ldIsCase')} onChange={e => set({ isCase: e.target.checked })} />
      <div className="ld-name" style={{ display: 'flex', alignItems: 'center' }}>
        {depth > 0 && <span style={{ flex: '0 0 18px', color: 'var(--text-secondary)' }}>└</span>}
        <input className="ld-input" style={{ flex: 1 }} value={item.name} placeholder={t('ldNamePlaceholder')}
               onChange={e => set({ name: e.target.value })} />
      </div>
      <NumInput value={item.qty} width={44} onCommit={v => set({ qty: v ?? 1 })} />
      <input className="ld-input" list="ld-categories" value={item.category} style={{ width: 110 }}
             onChange={e => set({ category: e.target.value })} />
      <select className="ld-input" style={{ width: 120 }} value={item.parentId || ''} disabled={item.isCase}
              onChange={e => set({ parentId: e.target.value || null })}>
        <option value="">{t('ldLoose')}</option>
        {cases.filter(c => c.id !== item.id).map(c => <option key={c.id} value={c.id}>{c.name || '—'}</option>)}
      </select>
      <select className="ld-input" style={{ width: 62 }} value={item.shape} onChange={e => set({ shape: e.target.value })}>
        <option value="rect">▭</option>
        <option value="circle">○</option>
      </select>
      <NumInput value={item.l} width={46} title={circle ? 'Ø' : 'L'} onCommit={v => set({ l: v ?? 1 })} />
      <NumInput value={item.w} width={46} disabled={circle} onCommit={v => set({ w: v ?? 1 })} />
      <NumInput value={item.h} width={46} onCommit={v => set({ h: v ?? 1 })} />
      <NumInput value={item.loadOrder} width={44} onCommit={v => set({ loadOrder: v })} />
      <input className="ld-input ld-note" value={item.note} placeholder={t('ldNote')}
             onChange={e => set({ note: e.target.value })} />
      <button className="ld-x" title={t('delete')} onClick={() => remove(item.id)}>✕</button>
    </div>
  )
}

export default function LoadListPanel() {
  const { t } = useTranslation('t')
  const items = useStore(s => s.loadData.items)
  const projectName = useStore(s => s.projectName)
  const add = useStore(s => s.addLoadItem)

  const sections = buildSections(items)
  const cases = casesOf(items)
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]
  const sum = totals(items)

  return (
    <div className="ld-panel">
      <div className="ld-head">
        <div>
          <div className="ld-title">{t('ldTitle')} — {projectName}</div>
          <div className="ld-sub">{t('ldSummary', { lines: sum.lines, pieces: sum.pieces, cases: sum.cases })}</div>
        </div>
        <div className="ld-actions">
          <button className="props-btn" onClick={() => add({ name: '' })}>+ {t('ldAddItem')}</button>
          <button className="props-btn" onClick={() => add({ name: '', isCase: true, l: 80, w: 40, h: 30 })}>+ {t('ldAddCase')}</button>
          <button className="props-btn accent" onClick={exportLoadList}>↓ {t('ldExport')}</button>
        </div>
      </div>

      <div className="ld-colhead">
        <span style={{ width: 16 }} title={t('ldIsCase')}>▣</span>
        <span className="ld-name">{t('ldColName')}</span>
        <span style={{ width: 44 }}>{t('ldColQty')}</span>
        <span style={{ width: 110 }}>{t('ldColCategory')}</span>
        <span style={{ width: 120 }}>{t('ldColInCase')}</span>
        <span style={{ width: 62 }}>{t('ldColShape')}</span>
        <span style={{ width: 46 }}>{t('ldColL')}</span>
        <span style={{ width: 46 }}>{t('ldColW')}</span>
        <span style={{ width: 46 }}>{t('ldColH')}</span>
        <span style={{ width: 44 }} title={t('ldColOrderHint')}>#</span>
        <span className="ld-note">{t('ldNote')}</span>
        <span style={{ width: 22 }} />
      </div>

      <datalist id="ld-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>

      <div className="ld-body">
        {items.length === 0 && <div className="ld-empty">{t('ldEmpty')}</div>}
        {sections.map(sec => (
          <div key={sec.name || '__none'} className="ld-section">
            <div className="ld-sec-title">{sec.name || t('ldNoCategory')}</div>
            {sec.rows.map(({ item, depth }) => (
              <ItemRow key={item.id} item={item} depth={depth} cases={cases} categories={categories} />
            ))}
          </div>
        ))}
      </div>
      <div className="ld-hint">{t('ldHint')}</div>
    </div>
  )
}
