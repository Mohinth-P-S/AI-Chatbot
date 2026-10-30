import React, { useState, useEffect } from 'react'

const DEFAULT_HELPLINE_DATA = {
  general_helpline: {
    title: "National & State Citizen Support",
    cm_helpline_tn: "1100 (Toll Free 24/7 - Tamil Nadu CM Helpline)",
    national_emergency: "112 (National Emergency Support)",
    elderline: "14567 (National Helpline for Senior Citizens)",
    women_helpline: "181 (Women in Distress & Welfare Assistance)",
    disability_helpline: "1800-11-2001 (DEPwD Toll Free Support)"
  },
  scheme_helplines: [
    {
      name: "Tamil Nadu e-Sevai / TNeGA Helpdesk",
      phone: "1800-425-1333",
      alt_phone: "1100",
      email: "tnesevaihelpdesk@tn.gov.in",
      hours: "24/7 (via CM Helpline 1100)",
      services_covered: "Income, Community, Nativity, First Graduate Certificates & Social Security Pensions",
      description: "Toll-free 24/7 citizen support for all revenue certificates, online portal applications, and e-Sevai centers."
    },
    {
      name: "National Scholarship Portal (NSP) Helpdesk",
      phone: "0120-6619540",
      email: "helpdesk@nsp.gov.in",
      hours: "9:00 AM to 5:30 PM (Monday to Friday)",
      services_covered: "All Central Sector & Centrally Sponsored Post-Matric and Pre-Matric Scholarships",
      description: "Government of India scholarship application tracking, biometric verification, and technical assistance."
    },
    {
      name: "Tamil Nadu Social Security Schemes (Pension Wing)",
      phone: "044-28518880",
      email: "crahq@tn.nic.in",
      hours: "10:00 AM to 5:45 PM (Working Days)",
      services_covered: "Old Age Pension (OAP), Destitute Widow Pension (DWP), Differently Abled Pension",
      description: "State pension commissionerate assistance for application status, appeals, and pension disbursement doubts."
    },
    {
      name: "Common Service Centre (CSC) Locator",
      url: "https://locator.csccloud.in/",
      toll_free: "14599",
      services_covered: "Biometric Aadhaar authentication, certificate application submission, and document scanning",
      description: "Find your nearest Arasu e-Sevai Centre or CSC Village Level Entrepreneur (VLE) in your village or ward for physical assistance."
    }
  ]
}

export default function HelplineScreen({
  currentLang = 'ta',
  onBackToChat,
  onReadAloud
}) {
  const [helplineData, setHelplineData] = useState(DEFAULT_HELPLINE_DATA)
  const [isLoading, setIsLoading] = useState(false)

  const uiText = {
    ta: {
      title: '📞 அதிகாரியுடன் பேச & அரசு உதவி மையங்கள்',
      subtitle: 'அரசு அதிகாரிகள், உதவி எண்கள் மற்றும் அருகிலுள்ள இ-சேவை மையங்களைத் தொடர்புகொள்ளுங்கள்',
      backToChat: '💬 அரட்டைக்குத் திரும்பு',
      callNow: 'அழைக்க:',
      cscHeading: 'அருகிலுள்ள இ-சேவை / சி.எஸ்.சி மையம்',
      cscDesc: 'நேரில் சென்று விண்ணப்பிக்க அல்லது கைரேகை/ஆவண சரிபார்ப்பு செய்ய உங்கள் ஊரிலுள்ள அரசு இ-சேவை மையத்தை அறியலாம்.',
      findCscBtn: 'இ-சேவை மையத்தைக் கண்டறி 📍',
      hoursLabel: 'நேரம்:',
      servicesLabel: 'திட்டங்கள்:',
      readDetails: 'விவரங்களை வாசிக்க',
      directEmergency: 'முக்கிய அவசர & அரசு உதவி எண்கள் (கிளிக் செய்து நேரடியாக அழைக்கலாம்):'
    },
    hi: {
      title: '📞 अधिकारी से बात करें एवं सरकारी हेल्पलाइन',
      subtitle: 'सरकारी सहायता नंबर और नजदीकी कॉमन सर्विस सेंटर (CSC) की जानकारी',
      backToChat: '💬 चैट पर वापस जाएं',
      callNow: 'कॉल करें:',
      cscHeading: 'नजदीकी सीएससी / ई-सेवा केंद्र',
      cscDesc: 'भौतिक सहायता या बायोमेट्रिक सत्यापन के लिए अपने गांव या वार्ड में नजदीकी सीएससी केंद्र खोजें।',
      findCscBtn: 'नजदीकी सीएससी खोजें 📍',
      hoursLabel: 'समय:',
      servicesLabel: 'सेवाएं:',
      readDetails: 'विवरण सुनें',
      directEmergency: 'महत्वपूर्ण हेल्पलाइन (कॉल करने के लिए टैप करें):'
    },
    en: {
      title: '📞 Talk to a Human & Official Helplines',
      subtitle: 'Official government phone helplines, support desks, and local Common Service Centres (CSC)',
      backToChat: '💬 Back to Chat',
      callNow: 'Call:',
      cscHeading: 'Find Local Common Service Centre (Arasu e-Sevai)',
      cscDesc: 'For in-person physical assistance, biometric authentication, or document submission, visit your nearest local Arasu e-Sevai or CSC centre.',
      findCscBtn: 'Find Nearest CSC Centre 📍',
      hoursLabel: 'Operating Hours:',
      servicesLabel: 'Services Covered:',
      readDetails: 'Read Details Aloud',
      directEmergency: 'Important Government Helplines (Tap to call directly):'
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
          if (data && data.scheme_helplines && data.scheme_helplines.length > 0) {
            setHelplineData(data)
          }
        }
      } catch (err) {
        console.warn('Using bundled default helpline info:', err)
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
      <section className="helpline-box" aria-label="Key Government Numbers">
        <h3>🚨 {t.directEmergency}</h3>
        <div className="quick-numbers-grid">
          <div className="quick-num-card primary-num">
            <span className="num-icon">🏛️</span>
            <div>
              <strong>TN CM Helpline (முதல்வர் உதவி எண்)</strong>
              <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>24/7 அனைத்து அரசு துறைகளுக்கான இலவச உதவி மையம்</p>
              <a href="tel:1100" className="num-dial" aria-label="Call Tamil Nadu CM Helpline 1100">
                📞 1100 (Toll Free 24/7)
              </a>
            </div>
          </div>

          <div className="quick-num-card">
            <span className="num-icon">👵</span>
            <div>
              <strong>Elderline (முதியோர் உதவி எண்)</strong>
              <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>முதியோர் ஓய்வூதியம் & நல உதவிகள்</p>
              <a href="tel:14567" className="num-dial" aria-label="Call Elderline 14567">
                📞 14567 (Toll Free)
              </a>
            </div>
          </div>

          <div className="quick-num-card">
            <span className="num-icon">👩</span>
            <div>
              <strong>Women Helpline (மகளிர் உதவி எண்)</strong>
              <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>பெண்கள் பாதுகாப்பு & நலத்திட்டங்கள்</p>
              <a href="tel:181" className="num-dial" aria-label="Call Women Helpline 181">
                📞 181 (Toll Free 24/7)
              </a>
            </div>
          </div>

          <div className="quick-num-card">
            <span className="num-icon">♿</span>
            <div>
              <strong>Disability Support (மாற்றுத்திறனாளிகள்)</strong>
              <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>மாற்றுத்திறனாளி உதவித்தொகை & உபகரணங்கள்</p>
              <a href="tel:1800112001" className="num-dial" aria-label="Call Disability Helpline 1800-11-2001">
                📞 1800-11-2001
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Scheme Specific Helpdesks */}
      <section className="scheme-helplines-list">
        <h3>🏢 அரசு திட்ட உதவி மையங்கள் (Official Department Helpdesks)</h3>
        <div className="schemes-grid">
          {helplineData?.scheme_helplines?.map((hl, idx) => (
            <article key={idx} className="scheme-card eligible-card">
              <h4 className="scheme-name">{hl.name}</h4>
              {hl.description && <p className="scheme-desc">{hl.description}</p>}

              {hl.phone && (
                <div className="card-detail">
                  <strong>📞 {t.callNow}</strong>
                  <a href={`tel:${hl.phone.replace(/[^0-9]/g, '')}`} className="phone-link" style={{ fontWeight: 'bold' }}>
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
