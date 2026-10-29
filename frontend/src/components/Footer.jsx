import React from 'react'
import { TRANSLATIONS } from '../i18n'

export default function Footer({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ta

  return (
    <footer className="app-footer" role="contentinfo">
      <p>{t.footerNotice}</p>
    </footer>
  )
}
