/**
 * Web Speech API Utility for Jan Sahayak
 * Handles:
 * 1. Speech Recognition (STT) for ta-IN, hi-IN, en-IN with friendly error diagnostics
 * 2. Speech Synthesis (TTS) with asynchronous voice loading & missing voice detection
 */

// Language code mappings for Web Speech API
export const SPEECH_LANG_MAP = {
  ta: 'ta-IN',
  hi: 'hi-IN',
  en: 'en-IN'
}

let cachedVoices = []

/**
 * Ensures voices are loaded asynchronously in Chrome/Edge/Firefox
 */
export function getAvailableVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return []
  }
  if (cachedVoices.length > 0) {
    return cachedVoices
  }
  cachedVoices = window.speechSynthesis.getVoices()
  return cachedVoices
}

/**
 * Checks if the user's browser/system has a voice for the requested language
 */
export function checkVoiceAvailability(langCode) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { available: false, voice: null, reason: 'unsupported_browser' }
  }

  const voices = getAvailableVoices()
  const targetCode = SPEECH_LANG_MAP[langCode] || langCode

  // Look for exact match (e.g. ta-IN) or prefix match (e.g. ta_)
  const matchedVoice = voices.find(
    (v) => v.lang.toLowerCase() === targetCode.toLowerCase() ||
           v.lang.toLowerCase().startsWith(langCode.toLowerCase()) ||
           v.name.toLowerCase().includes(langCode.toLowerCase())
  )

  if (matchedVoice) {
    return { available: true, voice: matchedVoice }
  }

  // If voices list is still empty, voices might load asynchronously
  if (voices.length === 0) {
    return { available: true, voice: null, pending: true }
  }

  return { available: false, voice: null, reason: 'missing_language_pack' }
}

/**
 * Reads text aloud using SpeechSynthesis
 */
export function speakText({
  text,
  langCode = 'ta',
  onStart,
  onEnd,
  onError
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError('Speech synthesis not supported on this browser.')
    return null
  }

  // Stop any active speech before starting new one
  window.speechSynthesis.cancel()

  if (!text || !text.trim()) return null

  // Clean markdown or URLs for better speech clarity
  const cleanText = text
    .replace(/https?:\/\/\S+/g, '') // remove raw URLs
    .replace(/[*_#`~[\]]/g, '')     // remove markdown characters
    .replace(/[🔗🇮🇳🏛️🎓📜👴📷📞🔊🔇👁️]/g, '') // remove emojis
    .trim()

  const utterance = new SpeechSynthesisUtterance(cleanText)
  const targetSpeechCode = SPEECH_LANG_MAP[langCode] || 'ta-IN'
  utterance.lang = targetSpeechCode
  utterance.rate = 0.95 // slightly slower for maximum clarity
  utterance.pitch = 1.0

  const { available, voice } = checkVoiceAvailability(langCode)
  if (available && voice) {
    utterance.voice = voice
  }

  if (onStart) utterance.onstart = onStart
  if (onEnd) utterance.onend = onEnd
  if (onError) utterance.onerror = onError

  window.speechSynthesis.speak(utterance)
  return utterance
}

/**
 * Stops any current speech synthesis
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
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
