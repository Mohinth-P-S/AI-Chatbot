import React from 'react'

export default function VoiceNotice({ notice, onDismiss }) {
  if (!notice) return null

  return (
    <div
      className="voice-notice-banner"
      role="alert"
      aria-live="assertive"
    >
      <div className="voice-notice-content">
        <span className="voice-notice-icon" aria-hidden="true">
          {notice.type === 'error' ? '⚠️' : 'ℹ️'}
        </span>
        <div className="voice-notice-text">
          <strong>{notice.title}</strong>
          <p>{notice.message}</p>
        </div>
      </div>
      <button
        type="button"
        className="voice-notice-close"
        onClick={onDismiss}
        aria-label="Dismiss notice"
      >
        ✕
      </button>
    </div>
  )
}
