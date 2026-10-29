import React, { useState } from 'react'

export default function DocumentChecklist({
  title,
  serviceName,
  requiredDocuments = [],
  sourceUrl,
  currentLang = 'ta',
  onClose,
  onReadAloud
}) {
  const [checkedDocs, setCheckedDocs] = useState({})

  const toggleDoc = (doc) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [doc]: !prev[doc]
    }))
  }

  const total = requiredDocuments.length
  const completed = requiredDocuments.filter((d) => checkedDocs[d]).length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const labels = {
    ta: {
      heading: 'தேவையான ஆவணங்கள் சரிபார்ப்பு பட்டியல்',
      progress: `${completed} / ${total} ஆவணங்கள் தயாராக உள்ளன (${percentage}%)`,
      ready: 'உங்களிடம் உள்ள ஆவணங்களை டிக் செய்யவும்:',
      stillNeeded: 'இன்னும் தேவைப்படும் ஆவணங்கள்:',
      allDone: '🎉 உங்களிடம் தேவையான அனைத்து ஆவணங்களும் தயாராக உள்ளன! நீங்கள் இப்போது விண்ணப்பிக்கலாம்.',
      applyNow: 'அதிகாரப்பூர்வ போர்ட்டலில் விண்ணப்பிக்கவும்',
      close: 'மூடு',
      readList: 'பட்டியலை வாசிக்க'
    },
    hi: {
      heading: 'आवश्यक दस्तावेज़ चेकलिस्ट',
      progress: `${completed} / ${total} दस्तावेज़ तैयार हैं (${percentage}%)`,
      ready: 'जो दस्तावेज़ आपके पास हैं उन्हें चुनें:',
      stillNeeded: 'शेष आवश्यक दस्तावेज़:',
      allDone: '🎉 आपके पास सभी आवश्यक दस्तावेज़ तैयार हैं! अब आप आवेदन कर सकते हैं।',
      applyNow: 'आधिकारिक पोर्टल पर आवेदन करें',
      close: 'बंद करें',
      readList: 'सूची सुनकर समझें'
    },
    en: {
      heading: 'Document Checklist',
      progress: `${completed} of ${total} documents ready (${percentage}%)`,
      ready: 'Tick the documents you already have:',
      stillNeeded: 'Documents still needed:',
      allDone: '🎉 You have all required documents! You are ready to apply.',
      applyNow: 'Apply on Official Portal',
      close: 'Close',
      readList: 'Read Checklist'
    }
  }

  const t = labels[currentLang] || labels.ta

  const handleReadSummary = () => {
    if (!onReadAloud) return
    const missing = requiredDocuments.filter((d) => !checkedDocs[d])
    let speech = `${serviceName}. ${t.progress}. `
    if (missing.length > 0) {
      speech += `${t.stillNeeded}: ${missing.join(', ')}.`
    } else {
      speech += t.allDone
    }
    onReadAloud(speech)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="checklist-title">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon" aria-hidden="true">📋</span>
            <div>
              <h3 id="checklist-title">{t.heading}</h3>
              <p className="modal-subtitle">{serviceName}</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t.close}
          >
            ✕
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="checklist-progress-box">
          <div className="progress-labels">
            <span>{t.progress}</span>
            <button
              type="button"
              className="read-btn"
              onClick={handleReadSummary}
              aria-label={t.readList}
            >
              <span>🔊</span>
              <span>{t.readList}</span>
            </button>
          </div>
          <div className="progress-bar-bg" role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
            <div
              className="progress-bar-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="checklist-items" role="group" aria-label="Required documents list">
          <p className="checklist-instruction">{t.ready}</p>
          {requiredDocuments.map((doc, idx) => {
            const isChecked = !!checkedDocs[doc]
            return (
              <label
                key={idx}
                className={`checklist-item ${isChecked ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleDoc(doc)}
                  aria-label={doc}
                />
                <span className="checkbox-custom" aria-hidden="true">
                  {isChecked ? '✓' : ''}
                </span>
                <span className="doc-name">{doc}</span>
              </label>
            )
          })}
        </div>

        {percentage === 100 && (
          <div className="success-banner" role="status">
            {t.allDone}
          </div>
        )}

        <div className="modal-footer">
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-action-btn"
              style={{ textDecoration: 'none' }}
            >
              <span>🔗 {t.applyNow}</span>
            </a>
          )}
          <button
            type="button"
            className="ctrl-btn"
            onClick={onClose}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
}
