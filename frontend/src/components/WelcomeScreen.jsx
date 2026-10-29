import React from 'react'
import { LANGUAGES, TRANSLATIONS } from '../i18n'

export default function WelcomeScreen({
  selectedLang,
  onSelectLanguage,
  onContinue,
  onSpeakGreeting,
}) {
  const t = TRANSLATIONS[selectedLang] || TRANSLATIONS.ta

  const handleCardClick = (langCode) => {
    onSelectLanguage(langCode)
    const langObj = LANGUAGES.find((l) => l.code === langCode)
    if (langObj && onSpeakGreeting) {
      onSpeakGreeting(langObj.greeting, langObj.speechCode)
    }
  }

  return (
    <main id="main-content" className="welcome-screen" role="main">
      <div className="welcome-hero-icon" aria-hidden="true">🏛️</div>
      <h2 className="welcome-title">{t.welcomeHeading}</h2>
      <p className="welcome-desc">{t.welcomeSubheading}</p>

      <div className="lang-grid" role="radiogroup" aria-label="Language selection">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.code
          return (
            <button
              key={lang.code}
              type="button"
              className={`lang-card ${isSelected ? 'selected' : ''}`}
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleCardClick(lang.code)}
            >
              <span className="lang-native">{lang.label}</span>
              <span className="lang-english">{lang.name}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="primary-action-btn"
        onClick={onContinue}
        aria-label={`${t.continueBtn} in ${selectedLang}`}
      >
        <span>{t.continueBtn}</span>
        <span aria-hidden="true">➔</span>
      </button>
    </main>
  )
}
