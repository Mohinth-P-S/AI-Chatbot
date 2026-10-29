import React, { useState, useRef, useEffect } from 'react'
import { TRANSLATIONS } from '../i18n'

export default function ChatScreen({
  currentLang,
  messages,
  onSendMessage,
  onQuickAction,
  onReadAloud,
  isListening,
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
  }, [messages, isLoading])

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
        {messages.map((msg, idx) => (
          <article
            key={idx}
            className={`msg-row ${msg.sender === 'user' ? 'user' : 'assistant'}`}
            aria-label={`${msg.sender === 'user' ? 'You' : 'Jan Sahayak'}`}
          >
            <div className="bubble">
              <p>{msg.text}</p>

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
                  <button
                    type="button"
                    className="read-btn"
                    onClick={() => onReadAloud(msg.text)}
                    aria-label={`${t.readAloud}: ${msg.text.substring(0, 40)}`}
                  >
                    <span>🔊</span>
                    <span>{t.readAloud}</span>
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}

        {isLoading && (
          <div className="msg-row assistant">
            <div className="bubble" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
              <span>⌛ ஜன சஹாயக் பதிலளிக்கிறது... (Processing...)</span>
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
