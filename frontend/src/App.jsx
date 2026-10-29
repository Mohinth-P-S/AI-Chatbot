import React, { useState, useEffect } from 'react'
import { LANGUAGES, TRANSLATIONS } from './i18n'
import Header from './components/Header'
import WelcomeScreen from './components/WelcomeScreen'
import ChatScreen from './components/ChatScreen'
import Footer from './components/Footer'

export default function App() {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('js_lang') || 'ta'
  })

  const [screen, setScreen] = useState(() => {
    return localStorage.getItem('js_screen') || 'welcome'
  })

  const [accessibilityMode, setAccessibilityMode] = useState(() => {
    return localStorage.getItem('js_a11y') === 'true'
  })

  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('js_audio') !== 'false'
  })

  const [messages, setMessages] = useState([])
  const [sessionProfile, setSessionProfile] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ta

  // Synchronize accessibility mode with HTML body class
  useEffect(() => {
    if (accessibilityMode) {
      document.body.classList.add('a11y-mode')
    } else {
      document.body.classList.remove('a11y-mode')
    }
    localStorage.setItem('js_a11y', accessibilityMode)
  }, [accessibilityMode])

  // Synchronize language code with HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = currentLang
    localStorage.setItem('js_lang', currentLang)
  }, [currentLang])

  // Detect Kiosk mode (?kiosk=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('kiosk') === '1') {
      document.body.classList.add('kiosk-mode')
    }
  }, [])

  // Initialize welcome message when entering chat
  useEffect(() => {
    if (messages.length === 0) {
      const langObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0]
      setMessages([
        {
          sender: 'assistant',
          text: langObj.greeting,
          timestamp: new Date().toISOString(),
          sources: []
        }
      ])
    }
  }, [currentLang])

  // Simple Speech Synthesis helper
  const speakText = (text, langCode = null) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const targetLang = langCode || (LANGUAGES.find((l) => l.code === currentLang)?.speechCode || 'ta-IN')
    utterance.lang = targetLang
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  }

  const handleToggleAccessibility = () => {
    setAccessibilityMode((prev) => !prev)
  }

  const handleToggleAudio = () => {
    setAudioEnabled((prev) => {
      const next = !prev
      localStorage.setItem('js_audio', next)
      if (!next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      return next
    })
  }

  const handleLanguageChange = (newLang) => {
    setCurrentLang(newLang)
    const langObj = LANGUAGES.find((l) => l.code === newLang)
    if (langObj) {
      speakText(langObj.greeting, langObj.speechCode)
    }
  }

  const handleContinueFromWelcome = () => {
    setScreen('chat')
    localStorage.setItem('js_screen', 'chat')
    const langObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0]
    speakText(langObj.greeting, langObj.speechCode)
  }

  const handleResetWelcome = () => {
    setScreen('welcome')
    localStorage.setItem('js_screen', 'welcome')
  }

  const handleSendMessage = async (text) => {
    if (!text.trim()) return

    const userMsg = {
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          language: currentLang,
          profile: sessionProfile
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMsg = {
        sender: 'assistant',
        text: data.reply,
        sources: data.sources || [],
        timestamp: new Date().toISOString()
      }

      setMessages((prev) => [...prev, assistantMsg])
      if (data.updated_profile) {
        setSessionProfile((prev) => ({ ...prev, ...data.updated_profile }))
      }

      // Auto read aloud if voice is enabled
      speakText(data.reply)

    } catch (err) {
      console.error('Chat API Error:', err)
      const errorMsg = {
        sender: 'assistant',
        text: t.errorNotice,
        timestamp: new Date().toISOString()
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (action) => {
    const quickQueries = {
      scholarships: {
        ta: 'எனக்கு என்னென்ன அரசு உதவித்தொகைகள் கிடைக்க வாய்ப்புள்ளது?',
        hi: 'मुझे कौन-सी सरकारी छात्रवृत्तियां मिल सकती हैं?',
        en: 'What government scholarships am I eligible for?'
      },
      certificates: {
        ta: 'வருமானம் மற்றும் சாதிச் சான்றிதழ் பெற என்னென்ன ஆவணங்கள் தேவை?',
        hi: 'आय और जाति प्रमाण पत्र के लिए कौन से दस्तावेज चाहिए?',
        en: 'What documents are required for income and community certificates?'
      },
      pensions: {
        ta: 'முதியோர் மற்றும் மாற்றுத்திறனாளி ஓய்வூதியம் பெறுவது எப்படி?',
        hi: 'वृद्धावस्था और दिव्यांग पेंशन के क्या नियम हैं?',
        en: 'How to apply for old age and disability pensions?'
      },
      scan: {
        ta: 'எனது ஆவணத்தை ஸ்கேன் செய்து விவரங்களை சரிபார்க்க விரும்புகிறேன்.',
        hi: 'मैं अपने दस्तावेज़ को स्कैन करके विवरण जांचना चाहता हूँ।',
        en: 'I want to scan my document to extract details.'
      },
      helpline: {
        ta: 'அரசு உதவி எண் மற்றும் இ-சேவை மைய விவரங்கள் தேவை.',
        hi: 'सरकारी हेल्पलाइन और सीएससी केंद्र की जानकारी चाहिए।',
        en: 'I need official helpline numbers and Common Service Centre locator.'
      }
    }

    const query = quickQueries[action]?.[currentLang] || quickQueries[action]?.en
    if (query) {
      handleSendMessage(query)
    }
  }

  const handleToggleMic = () => {
    // Basic Web Speech Recognition stub (extended fully in Phase 5)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Your browser does not support voice input. Please use Google Chrome or type your message.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      const langObj = LANGUAGES.find((l) => l.code === currentLang)
      recognition.lang = langObj ? langObj.speechCode : 'ta-IN'
      recognition.interimResults = false

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          handleSendMessage(transcript)
        }
      }

      recognition.start()
    } catch (e) {
      console.warn('SpeechRecognition error:', e)
      setIsListening(false)
    }
  }

  return (
    <div className="app-container">
      <Header
        currentLang={currentLang}
        onChangeLanguage={handleLanguageChange}
        accessibilityMode={accessibilityMode}
        onToggleAccessibility={handleToggleAccessibility}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onResetWelcome={handleResetWelcome}
      />

      {screen === 'welcome' ? (
        <WelcomeScreen
          selectedLang={currentLang}
          onSelectLanguage={setCurrentLang}
          onContinue={handleContinueFromWelcome}
          onSpeakGreeting={speakText}
        />
      ) : (
        <ChatScreen
          currentLang={currentLang}
          messages={messages}
          onSendMessage={handleSendMessage}
          onQuickAction={handleQuickAction}
          onReadAloud={(txt) => speakText(txt)}
          isListening={isListening}
          onToggleMic={handleToggleMic}
          isLoading={isLoading}
        />
      )}

      <Footer currentLang={currentLang} />
    </div>
  )
}
