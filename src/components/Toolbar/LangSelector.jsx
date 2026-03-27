import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../../i18n/index.js'

export default function LangSelector() {
  const { i18n } = useTranslation('t')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  const select = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('bw_lang', code)
    setOpen(false)
  }

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="lang-selector" ref={ref}>
      <button className="lang-flag-btn" onClick={() => setOpen(v => !v)} title={current.label}>
        {current.flag}
      </button>
      {open && (
        <div className="lang-dropdown">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={'lang-option' + (lang.code === i18n.language ? ' active' : '')}
              onClick={() => select(lang.code)}
            >
              <span className="lang-option-flag">{lang.flag}</span>
              <span className="lang-option-label">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
