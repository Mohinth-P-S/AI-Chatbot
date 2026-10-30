import React, { useState, useRef, useEffect } from 'react'
import { TRANSLATIONS } from '../i18n'

export default function ChatScreen({
  currentLang,
  messages,
  onSendMessage,
  onQuickAction,
  onReadAloud,
  onStopSpeaking,
  currentlySpeakingIndex,
  isListening,
  interimTranscript,
  onToggleMic,
  isLoading
}) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ta
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, interimTranscript])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!inputText.trim() || isLoading) return
    onSendMessage(inputText.trim())
    setInputText('')
  }

  return (
    <div className="chat-container">
      {/* Quick Action Pills */}
      <nav className="quick-actions" aria-label="Quick Actions">
        <button
          type="button"
          className="action-pill"
          onClick={() => onQuickAction('scholarships')}
        >
          {t.findScholarships}
        </button>
        <button
          type="button"
          className="action-pill"
          onClick={() => onQuickAction('certificates')}
        >
          {t.certificates}
        </button>
        <button
          type="button"
          className="action-pill"
          onClick={() => onQuickAction('pensions')}
        >
          {t.pensions}
        </button>
        <button
          type="button"
          className="action-pill"
          onClick={() => onQuickAction('scan')}
        >
          {t.scanDocument}
        </button>
        <button
          type="button"
          className="action-pill"
          onClick={() => onQuickAction('helpline')}
        >
          {t.talkToHuman}
        </button>
      </nav>

      {/* Messages Scroll Area */}
      <main id="main-content" className="messages-area" role="log" aria-live="polite">
        {messages.map((msg, idx) => {
          const isSpeakingThis = currentlySpeakingIndex === idx

          return (
            <article
              key={idx}
              className={`msg-row ${msg.sender === 'user' ? 'user' : 'assistant'}`}
              aria-label={`${msg.sender === 'user' ? 'You' : 'NaviGov'}`}
            >
              <div className={`bubble ${isSpeakingThis ? 'is-speaking' : ''}`}>
                <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>

                {/* Citations / Sources if provided */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="sources-box">
                    <strong>{t.sourcesHeading}</strong>
                    {msg.sources.map((src, sIdx) => (
                      <div key={sIdx}>
                        <a href={src.url} target="_blank" rel="noopener noreferrer">
                          🔗 {src.name}
                        </a>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {t.verifiedDate} {src.last_verified}
                        </small>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assistant Message Controls */}
                {msg.sender === 'assistant' && (
                  <div className="bubble-footer">
                    {isSpeakingThis ? (
                      <button
                        type="button"
                        className="read-btn speaking"
                        onClick={onStopSpeaking}
                        aria-label={t.stopAudio}
                      >
                        <span>⏹</span>
                        <span>{t.stopAudio}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="read-btn"
                        onClick={() => onReadAloud(msg.text, idx)}
                        aria-label={`${t.readAloud}: ${msg.text.substring(0, 40)}`}
                      >
                        <span>🔊</span>
                        <span>{t.readAloud}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          )
        })}

        {/* Suggested Quick Question Chips (rendered if conversation has started) */}
        {t.doubtChips && t.doubtChips.length > 0 && (
          <div className="doubt-chips-container" aria-label="Suggested common questions">
            <p className="doubt-chips-title">{t.doubtChipsHeading}</p>
            <div className="doubt-chips-grid">
              {t.doubtChips.map((chip, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  className="doubt-chip-btn"
                  onClick={() => onSendMessage(chip)}
                  disabled={isLoading}
                >
                  💬 {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Interim Speech Bubble */}
        {isListening && interimTranscript && (
          <div className="interim-bubble" aria-live="polite">
            <span aria-hidden="true">🎙️</span>
            <span>"{interimTranscript}..."</span>
          </div>
        )}

        {isLoading && (
          <div className="msg-row assistant">
            <div className="bubble" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
              <span>⌛ {currentLang === 'ta' ? 'நேவிகோவ் பதிலளிக்கிறது...' : (currentLang === 'hi' ? 'नेविगोव उत्तर दे रहा है...' : 'NaviGov is thinking...')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Chat Input Bar */}
      <form className="chat-input-bar" onSubmit={handleSubmit} role="search">
        {/* Large Microphone Button */}
        <button
          type="button"
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          onClick={onToggleMic}
          aria-label={isListening ? t.micListening : t.micIdle}
          title={isListening ? t.micListening : t.micIdle}
        >
          <span aria-hidden="true">{isListening ? '🔴' : '🎙️'}</span>
        </button>

        <input
          type="text"
          className="chat-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? t.micListening : t.inputPlaceholder}
          aria-label="Message input"
          disabled={isLoading}
        />

        <button
          type="submit"
          className="send-btn"
          disabled={isLoading || !inputText.trim()}
          aria-label={t.sendBtn}
        >
          {t.sendBtn}
        </button>
      </form>
    </div>
  )
}
