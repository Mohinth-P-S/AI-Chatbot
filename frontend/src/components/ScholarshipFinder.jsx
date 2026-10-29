import React, { useState, useEffect } from 'react'
import DocumentChecklist from './DocumentChecklist'

export default function ScholarshipFinder({
  currentLang = 'ta',
  onBackToChat,
  onReadAloud,
  onStopSpeaking,
  audioEnabled = true
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({
    state: 'Tamil Nadu',
    gender: null,
    age: 18,
    education_level: 'Undergraduate',
    category: 'BC',
    family_income: 150000,
    is_disabled: false,
    studied_in_govt_school: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [activeChecklistScheme, setActiveChecklistScheme] = useState(null)

  const uiText = {
    ta: {
      title: '🎓 அரசு உதவித்தொகை வழிகாட்டி',
      subtitle: 'உங்களுக்கான உதவித்தொகைகளைக் கண்டறிய சில எளிய கேள்விகளுக்குப் பதிலளிக்கவும்',
      stepCount: (step, total) => `படி ${step} / ${total}`,
      nextBtn: 'அடுத்த கேள்வி ➔',
      backBtn: '⬅ முந்தைய படி',
      findBtn: 'உதவித்தொகைகளைக் கண்டறி 🔍',
      restartBtn: 'மீண்டும் தொடங்க',
      backToChat: '💬 அரட்டைக்குத் திரும்பு',
      eligibleTitle: '🎉 நீங்கள் பெறக்கூடிய உதவித்தொகைகள்',
      maybeTitle: 'ℹ️ கூடுதல் தகவல் தேவைப்படும் திட்டங்கள்',
      noEligible: 'மன்னிக்கவும், உங்கள் தற்போதைய விவரங்களின்படி நேரடி உதவித்தொகை பொருந்தவில்லை.',
      benefitsLabel: 'பயன்கள்:',
      deadlineLabel: 'கடைசி தேதி:',
      documentsLabel: 'தேவையான ஆவணங்கள்:',
      applyOnline: 'அதிகாரப்பூர்வ போர்ட்டல்',
      checklistBtn: 'ஆவண சரிபார்ப்பு பட்டியல்',
      readCard: 'விவரங்களை வாசிக்க',
      q_state: 'உங்கள் வசிப்பிடம் / மாநிலம் எது?',
      q_gender: 'உங்கள் பாலினம் என்ன?',
      q_age: 'உங்கள் வயது என்ன?',
      q_education: 'நீங்கள் இப்போது படிக்கும் வகுப்பு அல்லது படிப்பு எது?',
      q_category: 'உங்கள் சமூகப் பிரிவு / சாதிப் பிரிவு எது?',
      q_income: 'உங்கள் குடும்பத்தின் ஆண்டு மொத்த வருமானம் எவ்வளவு?',
      q_disability: 'உங்களுக்கு 40% அல்லது அதற்கு மேற்பட்ட மாற்றுத்திறன் (Disability) உள்ளதா?',
      q_govt_school: 'தமிழ்நாட்டில் 6 முதல் 12-ம் வகுப்பு வரை அரசு அல்லது அரசு உதவிபெறும் பள்ளியில் படித்தீர்களா?',
    },
    hi: {
      title: '🎓 छात्रवृत्ति मार्गदर्शक',
      subtitle: 'पात्र छात्रवृत्तियां खोजने के लिए कुछ सरल प्रश्नों के उत्तर दें',
      stepCount: (step, total) => `चरण ${step} / ${total}`,
      nextBtn: 'अगला प्रश्न ➔',
      backBtn: '⬅ पिछला चरण',
      findBtn: 'छात्रवृत्तियां खोजें 🔍',
      restartBtn: 'पुनः प्रारंभ करें',
      backToChat: '💬 चैट पर वापस जाएं',
      eligibleTitle: '🎉 आपके लिए पात्र छात्रवृत्तियां',
      maybeTitle: 'ℹ️ अतिरिक्त जानकारी की आवश्यकता वाली योजनाएं',
      noEligible: 'क्षमा करें, इन विवरणों के आधार पर कोई छात्रवृत्ति मेल नहीं खाई।',
      benefitsLabel: 'लाभ:',
      deadlineLabel: 'अंतिम तिथि:',
      documentsLabel: 'आवश्यक दस्तावेज़:',
      applyOnline: 'आधिकारिक पोर्टल',
      checklistBtn: 'दस्तावेज़ चेकलिस्ट',
      readCard: 'विवरण सुनें',
      q_state: 'आपका राज्य कौन सा है?',
      q_gender: 'आपका लिंग क्या है?',
      q_age: 'आपकी आयु क्या है?',
      q_education: 'आपकी वर्तमान कक्षा या पाठ्यक्रम क्या है?',
      q_category: 'आपकी सामाजिक श्रेणी / जाति क्या है?',
      q_income: 'आपकी पारिवारिक वार्षिक आय कितनी है?',
      q_disability: 'क्या आप 40% या अधिक दिव्यांग (Disability) हैं?',
      q_govt_school: 'क्या आपने तमिलनाडु में कक्षा 6 से 12 तक सरकारी स्कूल में पढ़ाई की है?',
    },
    en: {
      title: '🎓 Guided Scholarship Finder',
      subtitle: 'Answer a few simple questions to find every government scholarship you qualify for',
      stepCount: (step, total) => `Step ${step} of ${total}`,
      nextBtn: 'Next Question ➔',
      backBtn: '⬅ Previous Step',
      findBtn: 'Find My Scholarships 🔍',
      restartBtn: 'Start Over',
      backToChat: '💬 Back to Chat',
      eligibleTitle: '🎉 Scholarships You Qualify For',
      maybeTitle: 'ℹ️ Additional Details Needed',
      noEligible: 'No matching scholarships found for these exact criteria.',
      benefitsLabel: 'Benefits:',
      deadlineLabel: 'Deadline:',
      documentsLabel: 'Required Documents:',
      applyOnline: 'Official Portal',
      checklistBtn: 'Document Checklist',
      readCard: 'Read Aloud',
      q_state: 'What is your state of residence?',
      q_gender: 'What is your gender?',
      q_age: 'What is your age in years?',
      q_education: 'What is your current course or class?',
      q_category: 'What is your social category / caste?',
      q_income: 'What is your total annual family income?',
      q_disability: 'Do you have a benchmark disability (40% or more)?',
      q_govt_school: 'Did you study classes 6 to 12 in a Government or Aided school in Tamil Nadu?',
    }
  }

  const t = uiText[currentLang] || uiText.ta

  const questions = [
    {
      id: 'state',
      prompt: t.q_state,
      options: [
        { label: 'தமிழ்நாடு (Tamil Nadu)', value: 'Tamil Nadu' },
        { label: 'Other State (மற்ற மாநிலம்)', value: 'Other' },
      ]
    },
    {
      id: 'gender',
      prompt: t.q_gender,
      options: [
        { label: 'Female (பெண் / महिला)', value: 'female' },
        { label: 'Male (ஆண் / पुरुष)', value: 'male' },
        { label: 'Other (மற்றவை)', value: 'other' },
      ]
    },
    {
      id: 'education_level',
      prompt: t.q_education,
      options: [
        { label: 'Class 9 - 10 (9, 10-ம் வகுப்பு)', value: 'Class 10' },
        { label: 'Class 11 - 12 (மேல்நிலைப்பள்ளி)', value: 'Class 12' },
        { label: 'ITI / Polytechnic Diploma (டிப்ளமோ)', value: 'Diploma' },
        { label: 'Undergraduate / College Degree (கல்லூரி இளங்கலை)', value: 'Undergraduate' },
        { label: 'Postgraduate / Master Degree (முதுகலை)', value: 'Postgraduate' },
      ]
    },
    {
      id: 'category',
      prompt: t.q_category,
      options: [
        { label: 'BC / MBC / DNC (பிற்படுத்தப்பட்டோர்)', value: 'BC' },
        { label: 'SC (ஆதிதிராவிடர் / பட்டியல் இனம்)', value: 'SC' },
        { label: 'ST (பழங்குடியினர்)', value: 'ST' },
        { label: 'Minority (சிறுபான்மையினர் - Muslim / Christian / Sikh / Jain)', value: 'Minority' },
        { label: 'General / Open Category (பொதுப் பிரிவு)', value: 'General' },
      ]
    },
    {
      id: 'family_income',
      prompt: t.q_income,
      options: [
        { label: 'ரூ. 1.5 லட்சத்திற்குள் (Under ₹1.5 Lakhs)', value: 120000 },
        { label: 'ரூ. 1.5 - 2.5 லட்சம் வரை (₹1.5L - ₹2.5 Lakhs)', value: 200000 },
        { label: 'ரூ. 2.5 - 8 லட்சம் வரை (₹2.5L - ₹8.0 Lakhs)', value: 400000 },
        { label: 'ரூ. 8 லட்சத்திற்கு மேல் (Above ₹8.0 Lakhs)', value: 900000 },
      ]
    },
    {
      id: 'is_disabled',
      prompt: t.q_disability,
      options: [
        { label: 'ஆம் (Yes - 40% or more)', value: true },
        { label: 'இல்லை (No)', value: false },
      ]
    },
    {
      id: 'studied_in_govt_school',
      prompt: t.q_govt_school,
      options: [
        { label: 'ஆம், அரசுப் பள்ளியில் படித்தேன் (Yes, Govt/Aided school)', value: true },
        { label: 'இல்லை, தனியார் பள்ளியில் படித்தேன் (No, Private school)', value: false },
      ]
    }
  ]

  // Speak current question aloud when entering step
  useEffect(() => {
    if (!results && questions[currentStep] && audioEnabled) {
      onReadAloud?.(questions[currentStep].prompt)
    }
  }, [currentStep, results])

  const handleSelectOption = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      submitProfile()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const submitProfile = async () => {
    setIsLoading(true)
    onStopSpeaking?.()

    try {
      const payload = {
        age: answers.education_level === 'Class 10' ? 15 : (answers.education_level === 'Class 12' ? 17 : 20),
        family_income: answers.family_income,
        category: answers.category,
        gender: answers.gender,
        education_level: answers.education_level,
        state: answers.state,
        is_disabled: answers.is_disabled,
        studied_in_govt_school: answers.studied_in_govt_school
      }

      const res = await fetch('/api/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Eligibility service error')

      const data = await res.json()
      setResults(data.results)

      // Auto read announcement
      const eligibleCount = data.results?.eligible?.length || 0
      const announce = currentLang === 'ta'
        ? `வாழ்த்துக்கள்! உங்கள் விவரங்களின்படி ${eligibleCount} உதவித்தொகைகள் கண்டறியப்பட்டுள்ளன.`
        : `Congratulations! We found ${eligibleCount} scholarships matching your profile.`
      if (audioEnabled) {
        onReadAloud?.(announce)
      }

    } catch (err) {
      console.error(err)
      alert('Error evaluating scholarships. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResults(null)
    setCurrentStep(0)
  }

  const currentQ = questions[currentStep]

  return (
    <div className="scholarship-finder-container" role="region" aria-label="Scholarship Finder">
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

      {!results ? (
        /* Questionnaire Wizard */
        <div className="wizard-card" role="form">
          <div className="wizard-progress">
            <span>{t.stepCount(currentStep + 1, questions.length)}</span>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="question-box">
            <div className="question-prompt-row">
              <h3 className="question-prompt">{currentQ.prompt}</h3>
              <button
                type="button"
                className="read-btn"
                onClick={() => onReadAloud?.(currentQ.prompt)}
                aria-label="Read question aloud"
              >
                <span>🔊</span>
              </button>
            </div>

            <div className="options-grid" role="radiogroup">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = answers[currentQ.id] === opt.value
                return (
                  <button
                    key={oIdx}
                    type="button"
                    className={`option-btn ${isSelected ? 'selected' : ''}`}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectOption(currentQ.id, opt.value)}
                  >
                    <span>{isSelected ? '🔘' : '⚪'}</span>
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="wizard-nav-bar">
            {currentStep > 0 && (
              <button
                type="button"
                className="ctrl-btn"
                onClick={handleBack}
              >
                {t.backBtn}
              </button>
            )}

            <button
              type="button"
              className="primary-action-btn"
              onClick={handleNext}
              disabled={isLoading}
            >
              {currentStep === questions.length - 1 ? t.findBtn : t.nextBtn}
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="results-view" role="region" aria-label="Results">
          <div className="results-actions-top">
            <button
              type="button"
              className="ctrl-btn"
              onClick={handleReset}
            >
              🔄 {t.restartBtn}
            </button>
          </div>

          {/* Eligible Schemes Section */}
          <section className="results-section">
            <h3 className="section-title eligible">{t.eligibleTitle} ({results.eligible?.length || 0})</h3>

            {results.eligible?.length === 0 ? (
              <p className="no-matches">{t.noEligible}</p>
            ) : (
              <div className="schemes-grid">
                {results.eligible.map((item, idx) => {
                  const s = item.scheme
                  return (
                    <article key={idx} className="scheme-card eligible-card">
                      <div className="card-badge">{s.level === 'state' ? 'Tamil Nadu State' : 'Central Scheme'}</div>
                      <h4 className="scheme-name">{s.name}</h4>
                      <p className="scheme-desc">{s.short_description}</p>

                      <div className="card-detail">
                        <strong>💰 {t.benefitsLabel}</strong>
                        <span>{s.benefits}</span>
                      </div>

                      <div className="card-detail">
                        <strong>📅 {t.deadlineLabel}</strong>
                        <span>{s.deadline}</span>
                      </div>

                      <div className="card-detail">
                        <strong>📄 {t.documentsLabel}</strong>
                        <ul className="doc-preview-list">
                          {s.required_documents?.slice(0, 3).map((d, dIdx) => (
                            <li key={dIdx}>{d}</li>
                          ))}
                          {s.required_documents?.length > 3 && (
                            <li>+{s.required_documents.length - 3} more...</li>
                          )}
                        </ul>
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          className="action-pill"
                          onClick={() => setActiveChecklistScheme(s)}
                        >
                          📋 {t.checklistBtn}
                        </button>
                        <button
                          type="button"
                          className="read-btn"
                          onClick={() => onReadAloud?.(`${s.name}. ${s.short_description}. ${t.benefitsLabel}: ${s.benefits}.`)}
                          aria-label={t.readCard}
                        >
                          🔊 {t.readCard}
                        </button>
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="primary-action-btn card-apply-btn"
                        >
                          🔗 {t.applyOnline}
                        </a>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* Maybe Schemes Section */}
          {results.maybe?.length > 0 && (
            <section className="results-section" style={{ marginTop: '30px' }}>
              <h3 className="section-title maybe">{t.maybeTitle} ({results.maybe.length})</h3>
              <div className="schemes-grid">
                {results.maybe.map((item, idx) => {
                  const s = item.scheme
                  return (
                    <article key={idx} className="scheme-card maybe-card">
                      <div className="card-badge maybe">Check Eligibility</div>
                      <h4 className="scheme-name">{s.name}</h4>
                      <p className="scheme-desc">{s.short_description}</p>
                      <p className="missing-notice">
                        ℹ️ Missing fields: {item.missing_fields.join(', ')}
                      </p>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="action-pill"
                          onClick={() => setActiveChecklistScheme(s)}
                        >
                          📋 {t.checklistBtn}
                        </button>
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ctrl-btn"
                        >
                          🔗 {t.applyOnline}
                        </a>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Active Document Checklist Modal */}
      {activeChecklistScheme && (
        <DocumentChecklist
          serviceName={activeChecklistScheme.name}
          requiredDocuments={activeChecklistScheme.required_documents}
          sourceUrl={activeChecklistScheme.source_url}
          currentLang={currentLang}
          onClose={() => setActiveChecklistScheme(null)}
          onReadAloud={onReadAloud}
        />
      )}
    </div>
  )
}
