/**
 * Web Speech API Utility for NaviGov (Navigate Government Schemes)
 * Handles:
 * 1. Speech Recognition (STT) for ta-IN, hi-IN, en-IN
 * 2. Speech Synthesis (TTS) with sentence chunking, cross-browser voice matching & fallback
 */

export const SPEECH_LANG_MAP = {
  ta: 'ta-IN',
  hi: 'hi-IN',
  en: 'en-IN'
}

let cachedVoices = []

/**
 * Returns available voices, updating when browser loads remote/system voices.
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
 * Finds the most suitable voice for the requested language.
 */
export function findVoiceForLanguage(langCode, voices = []) {
  if (!voices || voices.length === 0) return null

  const target = (langCode || 'ta').toLowerCase()
  const targetTag = SPEECH_LANG_MAP[target] ? SPEECH_LANG_MAP[target].toLowerCase() : target

  // 1. Direct language tag match (e.g. ta-in or hi-in)
  let found = voices.find((v) => {
    const vLang = (v.lang || '').toLowerCase().replace('_', '-')
    return vLang === targetTag || vLang === `${target}-in`
  })
  if (found) return found

  // 2. Language prefix match (e.g. ta, hi)
  found = voices.find((v) => {
    const vLang = (v.lang || '').toLowerCase().replace('_', '-')
    return vLang.startsWith(`${target}-`) || vLang.startsWith(target)
  })
  if (found) return found

  // 3. Name keyword matching for common OS and Cloud voices
  const voiceKeywords = {
    ta: ['tamil', 'தமிழ்', 'valluvar', 'pallavi', 'vani', 'ta-in'],
    hi: ['hindi', 'हिन्दी', 'swara', 'madhur', 'kalpana', 'lekha', 'hi-in', 'ananya'],
    en: ['india', 'indian', 'heera', 'ravi', 'neerja', 'english', 'en-in', 'natural']
  }
  const keywords = voiceKeywords[target] || [target]

  found = voices.find((v) => {
    const name = (v.name || '').toLowerCase()
    return keywords.some((kw) => name.includes(kw))
  })
  if (found) return found

  // 4. Secondary fallback: For Tamil/Hindi, look for any Indian English voice
  if (target === 'ta' || target === 'hi') {
    found = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase()
      const name = (v.name || '').toLowerCase()
      return vLang.includes('en-in') || name.includes('india')
    })
    if (found) return found
  }

  // 5. Default device voice
  return voices.find((v) => v.default) || voices[0] || null
}

/**
 * Checks if the browser/OS has a voice for the requested language
 */
export function checkVoiceAvailability(langCode) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { available: false, voice: null, reason: 'unsupported_browser' }
  }

  const voices = getAvailableVoices()
  if (voices.length === 0) {
    return { available: true, voice: null, pending: true }
  }

  const voice = findVoiceForLanguage(langCode, voices)
  const isTargetLanguageVoice = voice && (
    voice.lang.toLowerCase().startsWith(langCode.toLowerCase()) ||
    voice.name.toLowerCase().includes(langCode === 'ta' ? 'tamil' : (langCode === 'hi' ? 'hindi' : 'english'))
  )

  if (voice && isTargetLanguageVoice) {
    return { available: true, voice }
  }

  // Voice exists but might be generic device fallback
  return {
    available: !!voice,
    voice,
    isFallback: true,
    reason: 'missing_native_language_pack'
  }
}

/**
 * Reads text aloud using Web Speech API SpeechSynthesis.
 * Automatically handles text cleaning, sentence chunking, and Chromium pause workarounds.
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

  // Reset and resume any stuck speech engine
  window.speechSynthesis.cancel()
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }

  if (!text || !text.trim()) return null

  // Clean markdown formatting, URLs, and noisy characters for pleasant reading
  const cleanText = text
    .replace(/https?:\/\/\S+/g, '') // remove URLs
    .replace(/[*_#`~[\]]/g, '')     // remove markdown formatting
    .replace(/[🔗🇮🇳🏛️🎓📜👴📷📞🔊🔇👁️✅📌💰📄🌐⏰📋✉️🚨👵👩♿🎉]/g, '') // remove emojis
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanText) return null

  // Split long text into natural sentence chunks (max ~150 chars) to prevent Chrome timeout
  const sentenceDelimiters = /([.!?।\n]+)/
  const rawParts = cleanText.split(sentenceDelimiters)
  const chunks = []
  let currentChunk = ''

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i]
    if (!part) continue
    if (currentChunk.length + part.length < 160) {
      currentChunk += part
    } else {
      if (currentChunk.trim()) chunks.push(currentChunk.trim())
      currentChunk = part
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim())

  if (chunks.length === 0) chunks.push(cleanText)

  const voices = getAvailableVoices()
  const matchedVoice = findVoiceForLanguage(langCode, voices)

  let chunkIndex = 0
  let isCancelled = false

  const speakNextChunk = () => {
    if (isCancelled || chunkIndex >= chunks.length) {
      if (onEnd) onEnd()
      return
    }

    const chunkText = chunks[chunkIndex]
    const utterance = new SpeechSynthesisUtterance(chunkText)

    // Set voice and language
    if (matchedVoice) {
      utterance.voice = matchedVoice
      utterance.lang = matchedVoice.lang || SPEECH_LANG_MAP[langCode] || 'ta-IN'
    } else {
      utterance.lang = SPEECH_LANG_MAP[langCode] || 'ta-IN'
    }

    // Slightly adjusted rate and pitch for clear, dignified Indian tone
    utterance.rate = 0.95
    utterance.pitch = 1.0

    if (chunkIndex === 0 && onStart) {
      utterance.onstart = onStart
    }

    utterance.onend = () => {
      chunkIndex++
      speakNextChunk()
    }

    utterance.onerror = (e) => {
      // If error is canceled, it was user requested stop
      if (e.error === 'canceled' || e.error === 'interrupted') {
        isCancelled = true
        if (onEnd) onEnd()
        return
      }
      console.warn('Speech chunk error:', e)
      chunkIndex++
      speakNextChunk()
    }

    window.speechSynthesis.speak(utterance)
  }

  // Start speaking chunked audio
  speakNextChunk()

  return {
    cancel: () => {
      isCancelled = true
      window.speechSynthesis.cancel()
      if (onEnd) onEnd()
    }
  }
}

/**
 * Stops any active speech synthesis immediately
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
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
