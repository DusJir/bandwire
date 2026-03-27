import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.js'
import cs from './locales/cs.js'
import fr from './locales/fr.js'
import de from './locales/de.js'
import es from './locales/es.js'
import it from './locales/it.js'
import ru from './locales/ru.js'

export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'cs', label: 'Čeština',    flag: '🇨🇿' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
]

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { t: en }, cs: { t: cs }, fr: { t: fr }, de: { t: de }, es: { t: es }, it: { t: it }, ru: { t: ru } },
    lng: localStorage.getItem('bw_lang') || 'en',
    fallbackLng: 'en',
    ns: ['t'],
    defaultNS: 't',
    interpolation: { escapeValue: false },
  })

export default i18n
