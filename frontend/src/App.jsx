import React, { useState, useEffect, useRef } from 'react'
import { LANGUAGES, TRANSLATIONS } from './i18n'
import Header from './components/Header'
import WelcomeScreen from './components/WelcomeScreen'
import ChatScreen from './components/ChatScreen'
import ScholarshipFinder from './components/ScholarshipFinder'
import ServicesGuide from './components/ServicesGuide'
import ScanScreen from './components/ScanScreen'
import HelplineScreen from './components/HelplineScreen'
import KioskBar from './components/KioskBar'
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

  // Screens: 'welcome' | 'chat' | 'scholarship_finder' | 'services_guide'
  const [screen, setScreen] = useState(() => {
    return localStorage.getItem('js_screen') || 'welcome'
  })

  const [servicesDefaultTab, setServicesDefaultTab] = useState('certificates')

  const [accessibilityMode, setAccessibilityMode] = useState(() => {
    return localStorage.getItem('js_a11y') === 'true'
  })

  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('js_audio') !== 'false'
  })

  const [messages, setMessages] = useState([])
  const [sessionProfile, setSessionProfile] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Kiosk Mode States
  const [isKioskMode, setIsKioskMode] = useState(false)
  const [kioskCountdown, setKioskCountdown] = useState(60)

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
      setIsKioskMode(true)
      document.body.classList.add('kiosk-mode')
    }
  }, [])

  // Complete session reset for Kiosk privacy
  const resetKioskSession = (speakNotice = true) => {
    stopSpeaking()
    setSessionProfile({})
    const langObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0]
    setMessages([
      {
        sender: 'assistant',
        text: langObj.greeting,
        timestamp: new Date().toISOString(),
        sources: []
      }
    ])
    setScreen('welcome')
    setKioskCountdown(60)
    if (speakNotice) {
      const notice = currentLang === 'ta'
        ? 'கியோஸ்க் அமர்வு மீட்டமைக்கப்பட்டது. நேவிகோவிற்க்கு (NaviGov) வருக.'
        : (currentLang === 'hi'
          ? 'कियोस्क सत्र रीसेट हो गया है। नेविगोव (NaviGov) में आपका स्वागत है।'
          : 'Kiosk session reset. Welcome to NaviGov.')
      handleSpeak(notice)
    }
  }

  // 60-second inactivity auto-reset in Kiosk Mode
  useEffect(() => {
    if (!isKioskMode) return

    const resetTimer = () => {
      setKioskCountdown(60)
    }

    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll']
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }))

    const interval = setInterval(() => {
      setKioskCountdown((prev) => {
        if (prev <= 1) {
          resetKioskSession(true)
          return 60
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(interval)
      events.forEach((ev) => window.removeEventListener(ev, resetTimer))
    }
  }, [isKioskMode, currentLang])

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

    // Cold start notification timer for free tier hosting (Render sleeps after 15 min idle)
    const coldStartTimer = setTimeout(() => {
      const coldStartNotice = currentLang === 'ta'
        ? 'இலவச மேகக்கணி சேவையகம் (Cloud Server) விழித்தெழுகிறது (சுமார் 30 வினாடிகள் ஆகலாம்). தயவுசெய்து காத்திருக்கவும்...'
        : (currentLang === 'hi'
          ? 'मुफ्त क्लाउड सर्वर चालू हो रहा है (पहली बार में 30-40 सेकंड लग सकते हैं)। कृपया प्रतीक्षा करें...'
          : 'Cloud server is waking up from idle sleep (first request may take 30-40 seconds). Thank you for your patience...')

      setVoiceNotice({
        type: 'info',
        title: 'Cloud Server Waking Up',
        message: coldStartNotice
      })
    }, 3500)

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          language: currentLang,
          profile: sessionProfile
        })
      })

      clearTimeout(coldStartTimer)
      setVoiceNotice((prev) => (prev?.title === 'Cloud Server Waking Up' ? null : prev))

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

  // Quick Action Switcher: Routes to dedicated interactive screens
  const handleQuickAction = (action) => {
    handleStopSpeaking()

    if (action === 'scholarships') {
      setScreen('scholarship_finder')
      return
    }

    if (action === 'certificates') {
      setServicesDefaultTab('certificates')
      setScreen('services_guide')
      return
    }

    if (action === 'pensions') {
      setServicesDefaultTab('pensions')
      setScreen('services_guide')
      return
    }

    if (action === 'scan') {
      setScreen('scan')
      return
    }

    if (action === 'helpline') {
      setScreen('helpline')
      return
    }

    const quickQueries = {
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
      {isKioskMode && (
        <KioskBar
          countdown={kioskCountdown}
          onManualReset={() => resetKioskSession(true)}
          currentLang={currentLang}
        />
      )}

      <Header
        currentLang={currentLang}
        onChangeLanguage={handleLanguageChange}
        accessibilityMode={accessibilityMode}
        onToggleAccessibility={handleToggleAccessibility}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onResetWelcome={handleResetWelcome}
      />

      <VoiceNotice
        notice={voiceNotice}
        onDismiss={() => setVoiceNotice(null)}
      />

      {screen === 'welcome' && (
        <WelcomeScreen
          selectedLang={currentLang}
          onSelectLanguage={setCurrentLang}
          onContinue={handleContinueFromWelcome}
          onSpeakGreeting={(txt) => handleSpeak(txt)}
        />
      )}

      {screen === 'chat' && (
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

      {screen === 'scholarship_finder' && (
        <ScholarshipFinder
          currentLang={currentLang}
          onBackToChat={() => setScreen('chat')}
          onReadAloud={(txt) => handleSpeak(txt)}
          onStopSpeaking={handleStopSpeaking}
          audioEnabled={audioEnabled || accessibilityMode}
        />
      )}

      {screen === 'services_guide' && (
        <ServicesGuide
          defaultTab={servicesDefaultTab}
          currentLang={currentLang}
          onBackToChat={() => setScreen('chat')}
          onReadAloud={(txt) => handleSpeak(txt)}
        />
      )}

      {screen === 'scan' && (
        <ScanScreen
          currentLang={currentLang}
          onBackToChat={() => setScreen('chat')}
          onProfileUpdated={(updates) => {
            setSessionProfile((prev) => ({ ...prev, ...updates }))
          }}
          onReadAloud={(txt) => handleSpeak(txt)}
        />
      )}

      {screen === 'helpline' && (
        <HelplineScreen
          currentLang={currentLang}
          onBackToChat={() => setScreen('chat')}
          onReadAloud={(txt) => handleSpeak(txt)}
        />
      )}

      <Footer currentLang={currentLang} />
    </div>
  )
}
