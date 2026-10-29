import React, { useState } from 'react'

export default function ScanScreen({
  currentLang = 'ta',
  onBackToChat,
  onProfileUpdated,
  onReadAloud
}) {
  const [hasConsented, setHasConsented] = useState(false)
  const [docTypeHint, setDocTypeHint] = useState('income_certificate')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [editableFields, setEditableFields] = useState({})
  const [errorMessage, setErrorMessage] = useState(null)

  const uiText = {
    ta: {
      title: '📷 ஆவணம் ஸ்கேன் & விவரங்கள் எடுத்தல்',
      subtitle: 'மதிப்பெண் பட்டியல் அல்லது வருமானச் சான்றிதழை ஸ்கேன் செய்து விவரங்களை எளிதாகப் பெறுங்கள்',
      backToChat: '💬 அரட்டைக்குத் திரும்பு',
      consentTitle: '🔐 தனியுரிமை மற்றும் தரவுப் பாதுகாப்பு சம்மதம்',
      consentP1: 'உங்கள் ஆவணப் படம் எங்கள் சேவையகத்தில் சேமிக்கப்படாது. அது நினைவகத்தில் (in-memory) மட்டுமே செயலாக்கப்பட்டு உடனே அழிக்கப்படும்.',
      consentP2: 'ஆதார் அல்லது சான்றிதழ் எண்கள் அனைத்தும் கடைசி 4 இலக்கங்களைத் தவிர மற்றவை மறைக்கப்படும் (எ.கா: XXXX-XXXX-4589).',
      consentP3: 'சோதனைக்காக மாதிரி அல்லது போலி ஆவணங்களை மட்டுமே பயன்படுத்தவும்.',
      consentCheckbox: 'நான் இந்த தனியுரிமை விதிமுறைகளைப் படித்து ஒப்புக்கொள்கிறேன்.',
      proceedBtn: 'தொடரவும் ➔',
      selectDocType: 'ஆவண வகையைத் தேர்ந்தெடுக்கவும்:',
      docTypeIncome: 'வருமானச் சான்றிதழ் (Income Certificate)',
      docTypeMarksheet: 'மதிப்பெண் பட்டியல் (Marksheet)',
      docTypeCommunity: 'சாதிச் சான்றிதழ் (Community Certificate)',
      docTypeGeneral: 'பிற அரசு ஆவணம் (General)',
      uploadArea: 'இங்கே கிளிக் செய்து படத்தை பதிவேற்றவும் (JPEG / PNG, அதிகபட்சம் 5 MB)',
      scanBtn: 'ஆவணத்தை ஸ்கேன் செய் 🔍',
      scanning: 'ஆவணம் ஸ்கேன் செய்யப்படுகிறது... தயவுசெய்து காத்திருக்கவும்',
      quickSampleTitle: 'அல்லது மாதிரி ஆவணத்தை உடனடியாகச் சோதிக்கவும்:',
      sampleIncomeBtn: 'மாதிரி வருமானச் சான்றிதழ் டெமோ',
      sampleMarksheetBtn: 'மாதிரி மதிப்பெண் பட்டியல் டெமோ',
      extractedHeading: '✅ எடுக்கப்பட்ட விவரங்களைச் சரிபார்க்கவும்',
      extractedSubtitle: 'விவரங்கள் சரியாக உள்ளதா எனப் பார்த்து தேவையான மாற்றங்களைச் செய்யலாம்',
      maskedIdLabel: 'பாதுகாக்கப்பட்ட அடையாள எண் (Masked ID):',
      confidenceLabel: 'நம்பகத்தன்மை குறிப்பு:',
      nameLabel: 'விண்ணப்பதாரர் பெயர்:',
      incomeLabel: 'ஆண்டு வருமானம் (ரூபாயில்):',
      categoryLabel: 'சமூகப் பிரிவு (Category):',
      marksLabel: 'மதிப்பெண் சதவீதம் (%):',
      authorityLabel: 'வழங்கிய அதிகாரி / துறை:',
      confirmProfileBtn: 'விவரங்களை உறுதிசெய்து சுயவிவரத்தில் சேர்க்கவும்',
      scanAnotherBtn: 'வேறொரு ஆவணம் ஸ்கேன் செய்ய',
      confirmedSuccess: '🎉 விவரங்கள் உங்கள் சுயவிவரத்தில் வெற்றிகரமாகச் சேர்க்கப்பட்டன!'
    },
    hi: {
      title: '📷 दस्तावेज़ स्कैन एवं विवरण निष्कर्षण',
      subtitle: 'अंकसूची या आय प्रमाण पत्र को स्कैन करें और विवरण स्वतः भरें',
      backToChat: '💬 चैट पर वापस जाएं',
      consentTitle: '🔐 गोपनीयता और सुरक्षा सहमति',
      consentP1: 'आपके दस्तावेज़ की छवि सर्वर पर सहेजी नहीं जाएगी। यह केवल मेमोरी में प्रोसेस होकर तुरंत नष्ट कर दी जाएगी।',
      consentP2: 'पहचान संख्या (जैसे आधार) के अंतिम 4 अंकों को छोड़कर बाकी सभी को मास्क (XXXX-XXXX-1234) किया जाएगा।',
      consentP3: 'परीक्षण के लिए केवल नमूना दस्तावेज़ों का उपयोग करें।',
      consentCheckbox: 'मैंने गोपनीयता शर्तों को पढ़ लिया है और सहमति देता/देती हूँ।',
      proceedBtn: 'आगे बढ़ें ➔',
      selectDocType: 'दस्तावेज़ का प्रकार चुनें:',
      docTypeIncome: 'आय प्रमाण पत्र (Income Certificate)',
      docTypeMarksheet: 'अंकसूची (Marksheet)',
      docTypeCommunity: 'जाति प्रमाण पत्र (Community Certificate)',
      docTypeGeneral: 'अन्य सरकारी दस्तावेज़ (General)',
      uploadArea: 'यहाँ क्लिक करके छवि अपलोड करें (JPEG / PNG, अधिकतम 5 MB)',
      scanBtn: 'दस्तावेज़ स्कैन करें 🔍',
      scanning: 'दस्तावेज़ स्कैन हो रहा है... कृपया प्रतीक्षा करें',
      quickSampleTitle: 'या नमूना दस्तावेज़ से तुरंत जांचें:',
      sampleIncomeBtn: 'नमूना आय प्रमाण पत्र डेमो',
      sampleMarksheetBtn: 'नमूना अंकसूची डेमो',
      extractedHeading: '✅ निकाले गए विवरण की पुष्टि करें',
      extractedSubtitle: 'कृपया विवरणों की जांच करें और आवश्यकतानुसार बदलाव करें',
      maskedIdLabel: 'सुरक्षित पहचान संख्या (Masked ID):',
      confidenceLabel: 'सत्यापन नोट:',
      nameLabel: 'आवेदक का नाम:',
      incomeLabel: 'वार्षिक आय (रुपये में):',
      categoryLabel: 'सामाजिक श्रेणी:',
      marksLabel: 'अंक प्रतिशत (%):',
      authorityLabel: 'जारीकर्ता प्राधिकरण:',
      confirmProfileBtn: 'विवरण की पुष्टि करें और प्रोफाइल अपडेट करें',
      scanAnotherBtn: 'दूसरा दस्तावेज़ स्कैन करें',
      confirmedSuccess: '🎉 विवरण आपके प्रोफाइल में सफलतापूर्वक सहेजे गए!'
    },
    en: {
      title: '📷 Document Scanner & Privacy Guard',
      subtitle: 'Scan a marksheet or income certificate to extract details with automated ID masking',
      backToChat: '💬 Back to Chat',
      consentTitle: '🔐 Privacy & Security Consent',
      consentP1: 'Your document is processed strictly in-memory and is never stored on disk or server.',
      consentP2: 'All ID numbers (Aadhaar, certificate numbers) are masked showing only the last 4 digits (e.g. XXXX-XXXX-4589).',
      consentP3: 'For testing purposes, please only use sample or dummy documents.',
      consentCheckbox: 'I have read and consent to scanning this document for scheme assistance.',
      proceedBtn: 'Proceed to Upload ➔',
      selectDocType: 'Select document type hint:',
      docTypeIncome: 'Income Certificate',
      docTypeMarksheet: 'Marksheet',
      docTypeCommunity: 'Community Certificate',
      docTypeGeneral: 'General Government Document',
      uploadArea: 'Click or drop an image file here (JPEG, PNG, WebP up to 5 MB)',
      scanBtn: 'Scan Document 🔍',
      scanning: 'Scanning and extracting details... Please wait',
      quickSampleTitle: 'Or test instantly with a simulated sample document:',
      sampleIncomeBtn: 'Test Sample Income Certificate',
      sampleMarksheetBtn: 'Test Sample Marksheet',
      extractedHeading: '✅ Review & Confirm Extracted Details',
      extractedSubtitle: 'Review the details extracted by AI and make any necessary corrections',
      maskedIdLabel: 'Protected ID Number (Masked):',
      confidenceLabel: 'Confidence Note:',
      nameLabel: 'Applicant Name:',
      incomeLabel: 'Annual Family Income (INR):',
      categoryLabel: 'Caste / Category:',
      marksLabel: 'Marks Percentage (%):',
      authorityLabel: 'Issuing Authority:',
      confirmProfileBtn: 'Confirm & Update My Profile',
      scanAnotherBtn: 'Scan Another Document',
      confirmedSuccess: '🎉 Details successfully confirmed and added to your citizen profile!'
    }
  }

  const t = uiText[currentLang] || uiText.ta

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds 5 MB. Please select a smaller image.')
      return
    }

    setErrorMessage(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleScanUpload = async () => {
    if (!selectedFile) return
    setIsScanning(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('document_type', docTypeHint)

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Scan failed')
      }

      const data = await res.json()
      setScanResult(data)
      setEditableFields({
        applicant_name: data.extracted_fields?.applicant_name || '',
        annual_income: data.extracted_fields?.annual_income || '',
        caste_category: data.extracted_fields?.caste_category || '',
        marks_percentage: data.extracted_fields?.marks_percentage || '',
        issuing_authority: data.extracted_fields?.issuing_authority || ''
      })

      onReadAloud?.(`ஆவணம் ஸ்கேன் செய்யப்பட்டது. ${data.confidence_note}`)

    } catch (err) {
      console.error(err)
      setErrorMessage(err.message || 'Error scanning document.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSimulateSample = async (type) => {
    setIsScanning(true)
    setErrorMessage(null)

    // Create a 1x1 dummy PNG in memory for the demo
    const dummyPng = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 99, 52, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])], { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', dummyPng, 'sample.png')
    formData.append('document_type', type)

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setScanResult(data)
      setEditableFields({
        applicant_name: data.extracted_fields?.applicant_name || '',
        annual_income: data.extracted_fields?.annual_income || '',
        caste_category: data.extracted_fields?.caste_category || '',
        marks_percentage: data.extracted_fields?.marks_percentage || '',
        issuing_authority: data.extracted_fields?.issuing_authority || ''
      })
      onReadAloud?.(`மாதிரி ஆவண விவரங்கள் எடுக்கப்பட்டன. ${data.confidence_note}`)
    } catch (e) {
      console.error(e)
    } finally {
      setIsScanning(false)
    }
  }

  const handleConfirmAndSave = () => {
    const profileUpdates = {}
    if (editableFields.annual_income) {
      profileUpdates.family_income = Number(editableFields.annual_income)
    }
    if (editableFields.caste_category) {
      profileUpdates.category = editableFields.caste_category
    }
    if (editableFields.marks_percentage) {
      profileUpdates.marks_percentage = Number(editableFields.marks_percentage)
    }

    if (onProfileUpdated) {
      onProfileUpdated(profileUpdates)
    }

    alert(t.confirmedSuccess)
    onBackToChat()
  }

  return (
    <div className="scan-screen-container" role="region" aria-label="Document Scanner">
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

      {/* Step 1: Explicit Consent Guard */}
      {!hasConsented ? (
        <div className="consent-card" role="dialog" aria-labelledby="consent-title">
          <div className="consent-icon" aria-hidden="true">🛡️</div>
          <h3 id="consent-title">{t.consentTitle}</h3>
          <ul className="consent-list">
            <li>🔒 {t.consentP1}</li>
            <li>🆔 {t.consentP2}</li>
            <li>🧪 {t.consentP3}</li>
          </ul>

          <label className="consent-checkbox-label">
            <input
              type="checkbox"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
            />
            <span>{t.consentCheckbox}</span>
          </label>

          <button
            type="button"
            className="primary-action-btn"
            disabled={!hasConsented}
            onClick={() => setHasConsented(true)}
          >
            {t.proceedBtn}
          </button>
        </div>
      ) : !scanResult ? (
        /* Step 2: Upload / Scanner UI */
        <div className="scanner-upload-card">
          <div className="doc-type-selector">
            <label htmlFor="doc-type-select"><strong>{t.selectDocType}</strong></label>
            <select
              id="doc-type-select"
              className="ctrl-btn"
              value={docTypeHint}
              onChange={(e) => setDocTypeHint(e.target.value)}
              style={{ width: '100%', marginTop: '6px' }}
            >
              <option value="income_certificate">{t.docTypeIncome}</option>
              <option value="marksheet">{t.docTypeMarksheet}</option>
              <option value="community_certificate">{t.docTypeCommunity}</option>
              <option value="general">{t.docTypeGeneral}</option>
            </select>
          </div>

          {/* File Picker / Dropzone */}
          <div className="file-drop-area">
            <input
              type="file"
              id="file-upload"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="file-input-hidden"
            />
            <label htmlFor="file-upload" className="file-drop-label">
              <span className="upload-icon" aria-hidden="true">📤</span>
              <span>{selectedFile ? selectedFile.name : t.uploadArea}</span>
              {selectedFile && (
                <small style={{ color: 'var(--text-secondary)' }}>
                  ({Math.round(selectedFile.size / 1024)} KB)
                </small>
              )}
            </label>
          </div>

          {previewUrl && (
            <div className="image-preview-box">
              <img src={previewUrl} alt="Preview of document to be scanned" className="preview-img" />
            </div>
          )}

          {errorMessage && (
            <div className="error-banner" role="alert">
              ⚠️ {errorMessage}
            </div>
          )}

          <button
            type="button"
            className="primary-action-btn"
            disabled={!selectedFile || isScanning}
            onClick={handleScanUpload}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isScanning ? t.scanning : t.scanBtn}
          </button>

          {/* Instant Sample Test Buttons for Demo */}
          <div className="sample-quick-tests">
            <p className="sample-label"><strong>{t.quickSampleTitle}</strong></p>
            <div className="sample-btn-row">
              <button
                type="button"
                className="ctrl-btn"
                disabled={isScanning}
                onClick={() => handleSimulateSample('income_certificate')}
              >
                📄 {t.sampleIncomeBtn}
              </button>
              <button
                type="button"
                className="ctrl-btn"
                disabled={isScanning}
                onClick={() => handleSimulateSample('marksheet')}
              >
                🎓 {t.sampleMarksheetBtn}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Step 3: Confirmation and Edit Form */
        <div className="extracted-confirm-card" role="region" aria-label="Extracted Details">
          <div className="extracted-header">
            <h3>{t.extractedHeading}</h3>
            <p>{t.extractedSubtitle}</p>
          </div>

          {/* Masked ID Banner */}
          {scanResult.masked_id && (
            <div className="masked-id-banner">
              <span aria-hidden="true">🛡️</span>
              <div>
                <strong>{t.maskedIdLabel}</strong>
                <span className="masked-number"> {scanResult.masked_id}</span>
              </div>
            </div>
          )}

          <div className="confidence-notice">
            <span aria-hidden="true">ℹ️</span>
            <span><strong>{t.confidenceLabel}</strong> {scanResult.confidence_note}</span>
          </div>

          <form className="edit-fields-form" onSubmit={(e) => { e.preventDefault(); handleConfirmAndSave(); }}>
            <div className="form-group">
              <label>{t.nameLabel}</label>
              <input
                type="text"
                className="chat-input"
                value={editableFields.applicant_name}
                onChange={(e) => setEditableFields({ ...editableFields, applicant_name: e.target.value })}
              />
            </div>

            {editableFields.annual_income !== undefined && editableFields.annual_income !== '' && (
              <div className="form-group">
                <label>{t.incomeLabel}</label>
                <input
                  type="number"
                  className="chat-input"
                  value={editableFields.annual_income}
                  onChange={(e) => setEditableFields({ ...editableFields, annual_income: e.target.value })}
                />
              </div>
            )}

            {editableFields.caste_category && (
              <div className="form-group">
                <label>{t.categoryLabel}</label>
                <input
                  type="text"
                  className="chat-input"
                  value={editableFields.caste_category}
                  onChange={(e) => setEditableFields({ ...editableFields, caste_category: e.target.value })}
                />
              </div>
            )}

            {editableFields.marks_percentage && (
              <div className="form-group">
                <label>{t.marksLabel}</label>
                <input
                  type="number"
                  step="0.1"
                  className="chat-input"
                  value={editableFields.marks_percentage}
                  onChange={(e) => setEditableFields({ ...editableFields, marks_percentage: e.target.value })}
                />
              </div>
            )}

            <div className="form-group">
              <label>{t.authorityLabel}</label>
              <input
                type="text"
                className="chat-input"
                value={editableFields.issuing_authority}
                onChange={(e) => setEditableFields({ ...editableFields, issuing_authority: e.target.value })}
              />
            </div>

            <div className="confirm-actions-row">
              <button
                type="button"
                className="ctrl-btn"
                onClick={() => setScanResult(null)}
              >
                🔄 {t.scanAnotherBtn}
              </button>

              <button
                type="submit"
                className="primary-action-btn"
              >
                ✓ {t.confirmProfileBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
