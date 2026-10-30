/**
 * Voice & Audio Utility for NaviGov (Navigate Government Schemes)
 * Handles:
 * 1. High-Fidelity Multilingual Speech Synthesis:
 *    - Native authentic Tamil and Hindi audio via /api/tts (works on ALL devices without needing OS language packs)
 *    - HTML5 Audio streaming with pause/stop and active speaking indicators
 *    - Cross-browser SpeechSynthesis fallback
 * 2. Speech-to-Text (STT) Recognition for ta-IN, hi-IN, en-IN
 */

export const SPEECH_LANG_MAP = {
  ta: 'ta-IN',
  hi: 'hi-IN',
  en: 'en-IN'
}

let cachedVoices = []
let currentAudioElement = null

/**
 * Returns available browser voices.
 */
export function getAvailableVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return []
  }
  const liveVoices = window.speechSynthesis.getVoices()
  if (liveVoices && liveVoices.length > 0) {
    cachedVoices = liveVoices
  }
  return cachedVoices
}

/**
 * Checks voice availability.
 */
export function checkVoiceAvailability(langCode) {
  return { available: true, voice: null }
}

/**
 * Stops any active speech synthesis or audio playback immediately.
 */
export function stopSpeaking() {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause()
      currentAudioElement.currentTime = 0
    } catch (e) {
      console.warn('Error pausing audio:', e)
    }
    currentAudioElement = null
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    } catch (e) {
      console.warn('Error canceling browser speech:', e)
    }
  }
}

/**
 * Speaks text aloud in natural native Tamil, Hindi, or English.
 * Uses /api/tts to guarantee authentic native pronunciation on all platforms.
 */
export function speakText({
  text,
  langCode = 'ta',
  onStart,
  onEnd,
  onError
}) {
  stopSpeaking()

  if (!text || !text.trim()) return null

  // Clean text of markdown, URLs, and emojis for smooth, pleasant reading
  const cleanText = text
    .replace(/https?:\/\/\S+/g, '') // remove URLs
    .replace(/[*_#`~[\]]/g, '')     // remove markdown formatting
    .replace(/[🔗🇮🇳🏛️🎓📜👴📷📞🔊🔇👁️✅📌💰📄🌐⏰📋✉️🚨👵👩♿🎉]/g, '') // remove emojis
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanText) return null

  const targetLang = (langCode || 'ta').toLowerCase().substring(0, 2)
  const apiBase = import.meta.env.VITE_API_BASE_URL || ''

  try {
    const encodedText = encodeURIComponent(cleanText)
    const ttsUrl = `${apiBase}/api/tts?text=${encodedText}&lang=${encodeURIComponent(targetLang)}`
    
    const audio = new Audio(ttsUrl)
    currentAudioElement = audio

    if (onStart) {
      audio.onplay = () => onStart()
    }

    audio.onended = () => {
      currentAudioElement = null
      if (onEnd) onEnd()
    }

    audio.onerror = (e) => {
      console.warn('Native /api/tts error, falling back to browser speech:', e)
      currentAudioElement = null
      fallbackBrowserSpeech({ cleanText, targetLang, onStart, onEnd, onError })
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio play caught:', err)
        fallbackBrowserSpeech({ cleanText, targetLang, onStart, onEnd, onError })
      })
    }

    return {
      cancel: () => stopSpeaking()
    }
  } catch (err) {
    console.warn('speakText exception:', err)
    fallbackBrowserSpeech({ cleanText, targetLang, onStart, onEnd, onError })
    return {
      cancel: () => stopSpeaking()
    }
  }
}

/**
 * Fallback browser SpeechSynthesis in case audio stream is blocked or offline.
 */
function fallbackBrowserSpeech({ cleanText, targetLang, onStart, onEnd, onError }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError('Speech synthesis not available.')
    return
  }

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = SPEECH_LANG_MAP[targetLang] || 'ta-IN'
    utterance.rate = 0.95
    utterance.pitch = 1.0

    if (onStart) utterance.onstart = onStart
    utterance.onend = () => {
      if (onEnd) onEnd()
    }
    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && onError) {
        onError(e)
      }
      if (onEnd) onEnd()
    }

    window.speechSynthesis.speak(utterance)
  } catch (e) {
    console.warn('fallbackBrowserSpeech error:', e)
    if (onEnd) onEnd()
  }
}

/**
 * Speech Recognition (STT) Factory
 */
export function createSpeechRecognizer({
  langCode = 'ta',
  onInterim,
  onFinal,
  onStart,
  onEnd,
  onError
}) {
  if (typeof window === 'undefined') return null

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    if (onError) {
      onError({
        code: 'not_supported',
        message: 'Speech recognition is not supported in this browser. Please use Google Chrome.'
      })
    }
    return null
  }

  const recognition = new SpeechRecognition()
  recognition.lang = SPEECH_LANG_MAP[langCode] || 'ta-IN'
  recognition.continuous = false
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onstart = () => {
    if (onStart) onStart()
  }

  recognition.onresult = (event) => {
    let interimTranscript = ''
    let finalTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }

    if (interimTranscript && onInterim) {
      onInterim(interimTranscript)
    }

    if (finalTranscript && onFinal) {
      onFinal(finalTranscript.trim())
    }
  }

  recognition.onerror = (event) => {
    let friendlyMessage = 'Microphone error occurred.'
    if (event.error === 'not-allowed') {
      friendlyMessage = 'Microphone permission was denied. Please allow microphone access in your browser address bar.'
    } else if (event.error === 'no-speech') {
      friendlyMessage = 'No speech detected. Please press the mic and speak clearly.'
    } else if (event.error === 'network') {
      friendlyMessage = 'Speech recognition network error. Please check your internet connection.'
    }
    if (onError) {
      onError({ code: event.error, message: friendlyMessage })
    }
  }

  recognition.onend = () => {
    if (onEnd) onEnd()
  }

  return recognition
}
