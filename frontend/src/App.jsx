import React, { useState, useEffect, useRef } from 'react'
import { LANGUAGES, TRANSLATIONS } from './i18n'
import Header from './components/Header'
import WelcomeScreen from './components/WelcomeScreen'
import ChatScreen from './components/ChatScreen'
import VoiceNotice from './components/VoiceNotice'
import Footer from './components/Footer'
import {
  speakText,
  stopSpeaking,
  checkVoiceAvailability,
  createSpeechRecognizer,
  getAvailableVoices
} from './utils/speech'

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

  // Voice States
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState(null)
  const [voiceNotice, setVoiceNotice] = useState(null)

  const activeRecognizerRef = useRef(null)

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
    checkLanguageVoice(currentLang)
  }, [currentLang])

  // Detect Kiosk mode (?kiosk=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('kiosk') === '1') {
      document.body.classList.add('kiosk-mode')
    }
  }, [])

  // Listen for voice loading in browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        getAvailableVoices()
        checkLanguageVoice(currentLang)
      }
    }
  }, [currentLang])

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

  // Check if device supports speech synthesis voice for this language
  const checkLanguageVoice = (langCode) => {
    const res = checkVoiceAvailability(langCode)
    if (!res.available && !res.pending) {
      const langNames = { ta: 'Tamil', hi: 'Hindi', en: 'English' }
      setVoiceNotice({
        type: 'info',
        title: `${langNames[langCode] || langCode} voice not found on device`,
        message: `Your browser has no installed ${langNames[langCode]} speech voice. Text is displayed normally, and you can add voices in Windows Speech Settings.`
      })
    } else if (res.available) {
      // Clear missing voice notice if now available
      setVoiceNotice((prev) => (prev?.title?.includes('voice not found') ? null : prev))
    }
  }

  // Speak helper
  const handleSpeak = (text, index = null) => {
    if (!audioEnabled && !accessibilityMode) return
    stopSpeaking()

    setCurrentlySpeakingIndex(index)
    speakText({
      text,
      langCode: currentLang,
      onStart: () => setCurrentlySpeakingIndex(index),
      onEnd: () => setCurrentlySpeakingIndex(null),
      onError: (err) => {
        console.warn('Speech error:', err)
        setCurrentlySpeakingIndex(null)
      }
    })
  }

  const handleStopSpeaking = () => {
    stopSpeaking()
    setCurrentlySpeakingIndex(null)
  }

  const handleToggleAccessibility = () => {
    setAccessibilityMode((prev) => !prev)
  }

  const handleToggleAudio = () => {
    setAudioEnabled((prev) => {
      const next = !prev
      localStorage.setItem('js_audio', next)
      if (!next) {
        handleStopSpeaking()
      }
      return next
    })
  }

  const handleLanguageChange = (newLang) => {
    setCurrentLang(newLang)
    handleStopSpeaking()
    const langObj = LANGUAGES.find((l) => l.code === newLang)
    if (langObj && (audioEnabled || accessibilityMode)) {
      handleSpeak(langObj.greeting)
    }
  }

  const handleContinueFromWelcome = () => {
    setScreen('chat')
    localStorage.setItem('js_screen', 'chat')
    const langObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0]
    if (audioEnabled || accessibilityMode) {
      handleSpeak(langObj.greeting, 0)
    }
  }

  const handleResetWelcome = () => {
    handleStopSpeaking()
    setScreen('welcome')
    localStorage.setItem('js_screen', 'welcome')
  }

  const handleSendMessage = async (text) => {
    if (!text.trim()) return
    handleStopSpeaking()

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

      setMessages((prev) => {
        const updated = [...prev, assistantMsg]
        // Auto read aloud for new assistant message
        if (audioEnabled || accessibilityMode) {
          handleSpeak(data.reply, updated.length - 1)
        }
        return updated
      })

      if (data.updated_profile) {
        setSessionProfile((prev) => ({ ...prev, ...data.updated_profile }))
      }

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

  // Toggle Microphone with Speech-to-Text
  const handleToggleMic = () => {
    if (isListening) {
      activeRecognizerRef.current?.stop()
      setIsListening(false)
      setInterimTranscript('')
      return
    }

    handleStopSpeaking()

    const recognizer = createSpeechRecognizer({
      langCode: currentLang,
      onStart: () => {
        setIsListening(true)
        setInterimTranscript('')
      },
      onInterim: (text) => {
        setInterimTranscript(text)
      },
      onFinal: (text) => {
        setIsListening(false)
        setInterimTranscript('')
        if (text) {
          handleSendMessage(text)
        }
      },
      onError: (err) => {
        setIsListening(false)
        setInterimTranscript('')
        setVoiceNotice({
          type: 'error',
          title: 'Microphone Notice',
          message: err.message
        })
      },
      onEnd: () => {
        setIsListening(false)
        setInterimTranscript('')
      }
    })

    if (recognizer) {
      activeRecognizerRef.current = recognizer
      try {
        recognizer.start()
      } catch (e) {
        console.warn('Recognition start error:', e)
        setIsListening(false)
      }
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

      {/* Voice Warning or Diagnostic Notice */}
      <VoiceNotice
        notice={voiceNotice}
        onDismiss={() => setVoiceNotice(null)}
      />

      {screen === 'welcome' ? (
        <WelcomeScreen
          selectedLang={currentLang}
          onSelectLanguage={setCurrentLang}
          onContinue={handleContinueFromWelcome}
          onSpeakGreeting={(txt, code) => handleSpeak(txt)}
        />
      ) : (
        <ChatScreen
          currentLang={currentLang}
          messages={messages}
          onSendMessage={handleSendMessage}
          onQuickAction={handleQuickAction}
          onReadAloud={(txt, idx) => handleSpeak(txt, idx)}
          onStopSpeaking={handleStopSpeaking}
          currentlySpeakingIndex={currentlySpeakingIndex}
          isListening={isListening}
          interimTranscript={interimTranscript}
          onToggleMic={handleToggleMic}
          isLoading={isLoading}
        />
      )}

      <Footer currentLang={currentLang} />
    </div>
  )
}
