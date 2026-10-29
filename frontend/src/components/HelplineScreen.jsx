import React, { useState, useEffect } from 'react'

export default function HelplineScreen({
  currentLang = 'ta',
  onBackToChat,
  onReadAloud
}) {
  const [helplineData, setHelplineData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const uiText = {
    ta: {
      title: '📞 அதிகாரியுடன் பேச & உதவி மையங்கள்',
      subtitle: 'அரசு அதிகாரிகள், உதவி எண்கள் மற்றும் அருகிலுள்ள இ-சேவை மையங்களைத் தொடர்புகொள்ளுங்கள்',
      backToChat: '💬 அரட்டைக்குத் திரும்பு',
      callNow: 'அழைக்க:',
      cscHeading: 'அருகிலுள்ள இ-சேவை / சி.எஸ்.சி மையம்',
      cscDesc: 'நேரில் சென்று விண்ணப்பிக்க அல்லது கைரேகை/ஆவண சரிபார்ப்பு செய்ய உங்கள் ஊரிலுள்ள அரசு இ-சேவை மையத்தை அறியலாம்.',
      findCscBtn: 'இ-சேவை மையத்தைக் கண்டறி 📍',
      hoursLabel: 'நேரம்:',
      servicesLabel: 'திட்டங்கள்:',
      readDetails: 'விவரங்களை வாசிக்க',
      directEmergency: 'அவசர உதவி எண்கள்:'
    },
    hi: {
      title: '📞 अधिकारी से बात करें एवं हेल्पलाइन',
      subtitle: 'सरकारी सहायता नंबर और नजदीकी कॉमन सर्विस सेंटर (CSC) की जानकारी',
      backToChat: '💬 चैट पर वापस जाएं',
      callNow: 'कॉल करें:',
      cscHeading: 'नजदीकी सीएससी / ई-सेवा केंद्र',
      cscDesc: 'भौतिक सहायता या बायोमेट्रिक सत्यापन के लिए अपने गांव या वार्ड में नजदीकी सीएससी केंद्र खोजें।',
      findCscBtn: 'नजदीकी सीएससी खोजें 📍',
      hoursLabel: 'समय:',
      servicesLabel: 'सेवाएं:',
      readDetails: 'विवरण सुनें',
      directEmergency: 'महत्वपूर्ण हेल्पलाइन:'
    },
    en: {
      title: '📞 Talk to a Human & Official Helplines',
      subtitle: 'Official government phone helplines, support desks, and local Common Service Centres (CSC)',
      backToChat: '💬 Back to Chat',
      callNow: 'Call:',
      cscHeading: 'Find Local Common Service Centre (Arasu e-Sevai)',
      cscDesc: 'For in-person assistance, biometric authentication, or document submission, visit your nearest local Arasu e-Sevai or CSC centre.',
      findCscBtn: 'Find Nearest CSC Centre 📍',
      hoursLabel: 'Operating Hours:',
      servicesLabel: 'Services Covered:',
      readDetails: 'Read Details Aloud',
      directEmergency: 'Important Government Helplines:'
    }
  }

  const t = uiText[currentLang] || uiText.ta

  useEffect(() => {
    async function loadHelpline() {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || ''
        const res = await fetch(`${apiBase}/api/helpline`)
        if (res.ok) {
          const data = await res.json()
          setHelplineData(data)
        }
      } catch (err) {
        console.error('Failed to load helpline info:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadHelpline()
  }, [])

  return (
    <div className="helpline-screen-container" role="region" aria-label="Official Helplines">
      <div className="finder-header">
        <button
          type="button"
          className="ctrl-btn"
          onClick={onBackToChat}
        >
          {t.backToChat}
        </button>
        <div className="finder-titles">
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      {/* Emergency & Key Toll-Free Grid */}
      {helplineData?.general_helpline && (
        <section className="helpline-box">
          <h3>🚨 {t.directEmergency}</h3>
          <div className="quick-numbers-grid">
            <div className="quick-num-card primary-num">
              <span className="num-icon">🏛️</span>
              <div>
                <strong>TN CM Helpline (முதல்வர் உதவி எண்)</strong>
                <a href="tel:1100" className="num-dial">📞 1100 (Toll Free 24/7)</a>
              </div>
            </div>

            <div className="quick-num-card">
              <span className="num-icon">👵</span>
              <div>
                <strong>Elderline (முதியோர் உதவி எண்)</strong>
                <a href="tel:14567" className="num-dial">📞 14567</a>
              </div>
            </div>

            <div className="quick-num-card">
              <span className="num-icon">👩</span>
              <div>
                <strong>Women Helpline (மகளிர் உதவி எண்)</strong>
                <a href="tel:181" className="num-dial">📞 181</a>
              </div>
            </div>

            <div className="quick-num-card">
              <span className="num-icon">♿</span>
              <div>
                <strong>Disability Support (மாற்றுத்திறனாளி)</strong>
                <a href="tel:1800112001" className="num-dial">📞 1800-11-2001</a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Scheme Specific Helpdesks */}
      <section className="scheme-helplines-list">
        <h3>🏢 அரசு உதவி மையங்கள் (Official Helpdesks)</h3>
        <div className="schemes-grid">
          {helplineData?.scheme_helplines?.map((hl, idx) => (
            <article key={idx} className="scheme-card eligible-card">
              <h4 className="scheme-name">{hl.name}</h4>
              {hl.description && <p className="scheme-desc">{hl.description}</p>}

              {hl.phone && (
                <div className="card-detail">
                  <strong>📞 {t.callNow}</strong>
                  <a href={`tel:${hl.phone.replace(/[^0-9]/g, '')}`} className="phone-link">
                    {hl.phone} {hl.alt_phone && `/ ${hl.alt_phone}`}
                  </a>
                </div>
              )}

              {hl.email && (
                <div className="card-detail">
                  <strong>✉️ Email:</strong>
                  <a href={`mailto:${hl.email}`}>{hl.email}</a>
                </div>
              )}

              {hl.hours && (
                <div className="card-detail">
                  <strong>⏰ {t.hoursLabel}</strong>
                  <span>{hl.hours}</span>
                </div>
              )}

              {hl.services_covered && (
                <div className="card-detail">
                  <strong>📋 {t.servicesLabel}</strong>
                  <span>{hl.services_covered}</span>
                </div>
              )}

              <div className="card-actions">
                {hl.phone && (
                  <a
                    href={`tel:${hl.phone.replace(/[^0-9]/g, '')}`}
                    className="primary-action-btn card-apply-btn"
                  >
                    📞 {t.callNow} {hl.phone}
                  </a>
                )}
                {hl.url && (
                  <a
                    href={hl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-action-btn card-apply-btn"
                  >
                    📍 {t.findCscBtn}
                  </a>
                )}
                <button
                  type="button"
                  className="read-btn"
                  onClick={() => onReadAloud?.(`${hl.name}. Phone: ${hl.phone || ''}. ${hl.services_covered || ''}.`)}
                  aria-label={t.readDetails}
                >
                  🔊 {t.readDetails}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
