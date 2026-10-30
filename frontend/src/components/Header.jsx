import React from 'react'
import { LANGUAGES, TRANSLATIONS } from '../i18n'

export default function Header({
  currentLang,
  onChangeLanguage,
  accessibilityMode,
  onToggleAccessibility,
  audioEnabled,
  onToggleAudio,
  onResetWelcome
}) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ta

  return (
    <header className="app-header" role="banner">
      <div className="brand" tabIndex="0" onClick={onResetWelcome} style={{ cursor: 'pointer' }} title="Go to Welcome Screen">
        <img src="/navigov-icon.png" alt="NaviGov" className="brand-logo-img" />
        <div className="brand-titles">
          <h1>{t.appName}</h1>
          <p>{t.appSubtitle}</p>
        </div>
      </div>

      <div className="header-controls" role="toolbar" aria-label="Accessibility and Language Settings">
        {/* Accessibility Mode Toggle */}
        <button
          type="button"
          className={`ctrl-btn ${accessibilityMode ? 'active' : ''}`}
          onClick={onToggleAccessibility}
          aria-pressed={accessibilityMode}
          title={accessibilityMode ? t.accessibilityOn : t.accessibilityOff}
          aria-label={accessibilityMode ? t.accessibilityOn : t.accessibilityOff}
        >
          <span aria-hidden="true">👁️</span>
          <span>{accessibilityMode ? 'A11y ON' : 'A11y'}</span>
        </button>

        {/* Audio Output Toggle */}
        <button
          type="button"
          className={`ctrl-btn ${audioEnabled ? 'active' : ''}`}
          onClick={onToggleAudio}
          aria-pressed={audioEnabled}
          title={audioEnabled ? t.audioOn : t.audioMuted}
          aria-label={audioEnabled ? t.audioOn : t.audioMuted}
        >
          <span aria-hidden="true">{audioEnabled ? '🔊' : '🔇'}</span>
          <span>{audioEnabled ? 'Voice ON' : 'Muted'}</span>
        </button>

        {/* Language selector */}
        <select
          value={currentLang}
          onChange={(e) => onChangeLanguage(e.target.value)}
          className="ctrl-btn"
          aria-label="Select display language"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label} ({l.name})
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
