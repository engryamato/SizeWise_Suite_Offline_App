import { useState, useCallback } from 'react'
import en from '../app/i18n/en.json' assert { type: 'json' }
import es from '../app/i18n/es.json' assert { type: 'json' }

const resources = { en, es }
let currentLang = 'en'

const translate = (key, lang = currentLang) => {
  return key.split('.').reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : key), resources[lang])
}

export const useTranslation = () => {
  const [, forceUpdate] = useState(0)

  const t = useCallback((key) => translate(key), [])

  const setLanguage = useCallback((lang) => {
    if (resources[lang]) {
      currentLang = lang
      forceUpdate(n => n + 1)
    }
  }, [])

  return { t, language: currentLang, setLanguage }
}
