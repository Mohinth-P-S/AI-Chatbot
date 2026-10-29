import React, { useState, useEffect } from 'react'
import DocumentChecklist from './DocumentChecklist'

export default function ServicesGuide({
  defaultTab = 'certificates',
  currentLang = 'ta',
  onBackToChat,
  onReadAloud
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [servicesData, setServicesData] = useState({ certificates: [], pensions: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [activeChecklistService, setActiveChecklistService] = useState(null)

  const uiText = {
    ta: {
      title: '📜 அரசு சான்றிதழ்கள் & ஓய்வூதிய வழிகாட்டி',
      subtitle: 'தேவையான ஆவணங்கள், விண்ணப்பிக்கும் முறை மற்றும் அரசு இணையதளங்கள்',
      tabCertificates: '📜 அரசு சான்றிதழ்கள் (5)',
      tabPensions: '👴 முதியோர் & நல ஓய்வூதியங்கள் (4)',
      backToChat: '💬 அரட்டைக்குத் திரும்பு',
      howToApply: 'விண்ணப்பிக்கும் முறை:',
      benefits: 'பயன்கள்:',
      deadline: 'கால அவகாசம்:',
      applyOnline: 'அதிகாரப்பூர்வ தளம்',
      checklistBtn: 'ஆவண சரிபார்ப்பு பட்டியல்',
      readCard: 'வாசிக்க',
    },
    hi: {
      title: '📜 सरकारी प्रमाण पत्र एवं पेंशन मार्गदर्शक',
      subtitle: 'आवश्यक दस्तावेज़, आवेदन प्रक्रिया और आधिकारिक लिंक',
      tabCertificates: '📜 प्रमाण पत्र (5)',
      tabPensions: '👴 सामाजिक सुरक्षा पेंशन (4)',
      backToChat: '💬 चैट पर वापस जाएं',
      howToApply: 'आवेदन प्रक्रिया:',
      benefits: 'लाभ:',
      deadline: 'समय सीमा:',
      applyOnline: 'आधिकारिक पोर्टल',
      checklistBtn: 'दस्तावेज़ चेकलिस्ट',
      readCard: 'सुनें',
    },
    en: {
      title: '📜 Citizen Certificates & Welfare Pensions',
      subtitle: 'Step-by-step guidance, required documents, and official portal links',
      tabCertificates: '📜 Certificates (5)',
      tabPensions: '👴 Welfare Pensions (4)',
      backToChat: '💬 Back to Chat',
      howToApply: 'How to Apply:',
      benefits: 'Benefits:',
      deadline: 'Timeline / Validity:',
      applyOnline: 'Official Portal',
      checklistBtn: 'Document Checklist',
      readCard: 'Read Aloud',
    }
  }

  const t = uiText[currentLang] || uiText.ta

  useEffect(() => {
    async function fetchServices() {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || ''
        const res = await fetch(`${apiBase}/api/services`)
        if (res.ok) {
          const data = await res.json()
          setServicesData({
            certificates: data.certificates || [],
            pensions: data.pensions || []
          })
        }
      } catch (e) {
        console.error('Failed to load services data:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchServices()
  }, [])

  const currentList = activeTab === 'certificates' ? servicesData.certificates : servicesData.pensions

  return (
    <div className="services-guide-container" role="region" aria-label="Services Guide">
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

      {/* Tabs */}
      <div className="services-tabs" role="tablist">
        <button
          type="button"
          className={`services-tab ${activeTab === 'certificates' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'certificates'}
          onClick={() => setActiveTab('certificates')}
        >
          {t.tabCertificates}
        </button>
        <button
          type="button"
          className={`services-tab ${activeTab === 'pensions' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'pensions'}
          onClick={() => setActiveTab('pensions')}
        >
          {t.tabPensions}
        </button>
      </div>

      {/* List Grid */}
      <div className="schemes-grid" style={{ marginTop: '20px' }}>
        {currentList.map((service, idx) => (
          <article key={idx} className="scheme-card eligible-card">
            <div className="card-badge">{service.level === 'state' ? 'Tamil Nadu Revenue / e-Sevai' : 'National Portal'}</div>
            <h3 className="scheme-name">{service.name}</h3>
            <p className="scheme-desc">{service.short_description}</p>

            <div className="card-detail">
              <strong>🎁 {t.benefits}</strong>
              <span>{service.benefits}</span>
            </div>

            <div className="card-detail">
              <strong>📝 {t.howToApply}</strong>
              <span>{service.how_to_apply}</span>
            </div>

            <div className="card-detail">
              <strong>⏳ {t.deadline}</strong>
              <span>{service.deadline}</span>
            </div>

            <div className="card-actions">
              <button
                type="button"
                className="action-pill"
                onClick={() => setActiveChecklistService(service)}
              >
                📋 {t.checklistBtn}
              </button>
              <button
                type="button"
                className="read-btn"
                onClick={() => onReadAloud?.(`${service.name}. ${service.short_description}. ${t.howToApply} ${service.how_to_apply}.`)}
                aria-label={t.readCard}
              >
                🔊 {t.readCard}
              </button>
              <a
                href={service.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="primary-action-btn card-apply-btn"
              >
                🔗 {t.applyOnline}
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Checklist modal */}
      {activeChecklistService && (
        <DocumentChecklist
          serviceName={activeChecklistService.name}
          requiredDocuments={activeChecklistService.required_documents}
          sourceUrl={activeChecklistService.source_url}
          currentLang={currentLang}
          onClose={() => setActiveChecklistService(null)}
          onReadAloud={onReadAloud}
        />
      )}
    </div>
  )
}
