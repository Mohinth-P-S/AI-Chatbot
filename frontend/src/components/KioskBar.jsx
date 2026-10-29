import React from 'react'

export default function KioskBar({
  countdown,
  onManualReset,
  currentLang = 'ta'
}) {
  const labels = {
    ta: {
      kioskActive: '🖥️ கியோஸ்க் டெமோ முறை (Kiosk Mode)',
      idleNotice: `செயலற்ற தன்மை தானியங்கு மீட்டமைப்பு: ${countdown} வினாடிகள்`,
      resetBtn: '🔄 அமர்வை உடனே முடிக்க (Clear Session)',
    },
    hi: {
      kioskActive: '🖥️ कियोस्क डेमो मोड (Kiosk Mode)',
      idleNotice: `निष्क्रियता ऑटो-रीसेट: ${countdown} सेकंड`,
      resetBtn: '🔄 सत्र समाप्त करें (Clear Session)',
    },
    en: {
      kioskActive: '🖥️ Kiosk Demo Mode Active',
      idleNotice: `Auto-reset in: ${countdown}s of inactivity`,
      resetBtn: '🔄 End Session Now (Clear Data)',
    }
  }

  const t = labels[currentLang] || labels.ta

  return (
    <div className="kiosk-top-bar" role="status" aria-live="polite">
      <div className="kiosk-bar-left">
        <span className="kiosk-badge">{t.kioskActive}</span>
        <span className={`kiosk-timer ${countdown <= 10 ? 'urgent' : ''}`}>
          ⏱️ {t.idleNotice}
        </span>
      </div>
      <button
        type="button"
        className="kiosk-reset-btn"
        onClick={onManualReset}
        title="Clear all session data and return to welcome screen"
      >
        {t.resetBtn}
      </button>
    </div>
  )
}
