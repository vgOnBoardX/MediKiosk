import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, ArrowLeft, Bot, User, Mic, MicOff, CheckCircle2, 
  LogOut, Fingerprint, WifiOff, Volume2, VolumeX, AlertTriangle, 
  HeartPulse, Stethoscope, Sparkles 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useCompleteTriageMutation } from '../../store/apiSlice';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Globe } from 'lucide-react';

const VOICE_LANG_OPTIONS = [
  { label: 'English', value: 'English', bcp47: 'en-US' },
  { label: 'हिंदी (Hindi)', value: 'Hindi', bcp47: 'hi-IN' },
  { label: 'বাংলা (Bengali)', value: 'Bengali', bcp47: 'bn-IN' },
  { label: 'தமிழ் (Tamil)', value: 'Tamil', bcp47: 'ta-IN' },
  { label: 'मराठी (Marathi)', value: 'Marathi', bcp47: 'mr-IN' },
];

export default function TriageChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage(); // global app lang — used only as initial default
  const { user, patientProfile, logout } = useAuth();
  const { abhaId = '', initialVitals = {} } = location.state || {};

  // voiceLang is LOCKED to the session — does NOT change when the global language context changes.
  // The user must explicitly switch it via the in-chat dropdown.
  const [voiceLang, setVoiceLang] = useState(() => language || 'English');

  const getInitialGreeting = (lang) => {
    if (lang === 'Hindi') {
      return "नमस्ते! मैं सिस्टर प्रिया हूँ, संजीवनी अस्पताल में आपकी एआई ट्राइएज नर्स। आज आपको क्या परेशानी या लक्षण महसूस हो रहे हैं? कृपया मुझे बताइए, मैं आपकी पूरी सहायता करूँगी।";
    }
    if (lang === 'Bengali') {
      return "নমস্কার! আমি সিস্টার প্রিয়া, সঞ্জীবনী হাসপাতালের আপনার এআই ট্রায়াজ নার্স। আজ আপনার কী ধরনের শারীরিক অস্বস্তি বা উপসর্গ হচ্ছে? দয়া করে বলুন, আমি সাহায্য করছি।";
    }
    return "Namaste! I am Nurse Priya, your AI Clinical Triage Nurse at Sanjeevani Hospital. I am here to understand your symptoms and ensure you get the right medical care. What health concerns or symptoms are you feeling today?";
  };

  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'ai', 
      // Use the locked voiceLang for the initial greeting, not the reactive context
      text: getInitialGreeting(language || 'English')
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [quickReplies, setQuickReplies] = useState(() => {
    const lang = language || 'English';
    if (lang === 'Hindi') return ["बुखार और बदन दर्द", "खांसी और जुकाम", "पेट में दर्द या एसिडिटी", "सिरदर्द या चक्कर"];
    return ["Fever & body ache", "Cough & cold", "Stomach ache / Acidity", "Headache or dizziness"];
  });
  const [isFinishing, setIsFinishing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const messagesEndRef = useRef(null);

  // Accumulated AI-extracted data across turns
  const [socratesData, setSocratesData] = useState({});
  const [ayushData, setAyushData] = useState({ ...initialVitals });
  const [suggestedDepartment, setSuggestedDepartment] = useState('GENERAL_MEDICINE');
  const [detectedSeverity, setDetectedSeverity] = useState('ROUTINE');

  // RTK Query mutation
  const [completeTriage] = useCompleteTriageMutation();

  // Web Speech API
  const recognitionRef = useRef(null);

  // Rebuild speech recognition whenever voiceLang changes (user explicitly changed it in-chat)
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      // Use the LOCAL voiceLang — not the global context
      const bcp47 = VOICE_LANG_OPTIONS.find(o => o.value === voiceLang)?.bcp47 || 'en-US';
      rec.lang = bcp47;

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, [voiceLang]); // ← only re-initialises when USER changes voiceLang in-chat

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, quickReplies]);

  const speakText = (text) => {
    if (isMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      // Use LOCAL voiceLang — stays locked until user explicitly changes it
      utterance.lang = VOICE_LANG_OPTIONS.find(o => o.value === voiceLang)?.bcp47 || 'en-US';

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // When user explicitly changes voice language in-chat:
  const handleVoiceLangChange = (newLang) => {
    // Cancel any in-progress speech immediately
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceLang(newLang);
  };

  const toggleMute = () => {
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(prev => !prev);
  };

  const handleSend = async (overrideText) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;

    const newMsg = { id: Date.now(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setQuickReplies([]);
    setIsLoading(true);

    if (isOffline) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          role: 'ai', 
          text: "You are currently offline. Your assessment has been noted, but AI analysis is paused. You can finish to save your triage locally."
        }]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
      const response = await fetch(`${aiServiceUrl}/triage-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_input: newMsg.text,
          language: voiceLang,   // Use locked session language, not global context
          empathy_mode: true,
          conversation_history: messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }))
        })
      });
      const data = await response.json();
      
      const aiText = data.data?.ai_response || "I understand. Let me connect you to triage.";
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: aiText
      }]);
      
      if (data.data?.quick_replies && Array.isArray(data.data.quick_replies)) {
        setQuickReplies(data.data.quick_replies);
      }

      // Accumulate SOCRATES data — merge new fields with existing
      if (data.data?.socrates_extracted) {
        setSocratesData(prev => {
          const updated = { ...prev };
          for (const [key, val] of Object.entries(data.data.socrates_extracted)) {
            if (val && typeof val === 'string' && val.trim() !== '') {
              updated[key] = val;
            }
          }
          return updated;
        });
      }

      // Accumulate AYUSH data
      if (data.data?.ayush_extracted && Object.keys(data.data.ayush_extracted).length > 0) {
        setAyushData(prev => ({ ...prev, ...data.data.ayush_extracted }));
      }

      // Track suggested department
      if (data.data?.suggested_department) {
        setSuggestedDepartment(data.data.suggested_department);
      }

      // If emergency detected, escalate severity
      if (data.data?.is_emergency) {
        setDetectedSeverity('EMERGENCY');
        setQuickReplies([
          voiceLang === 'Hindi' ? "तुरंत नर्स को बुलाएं" : "Call Emergency Nurse Immediately",
          voiceLang === 'Hindi' ? "मैं इमरजेंसी वार्ड जा रहा हूँ" : "Go to Emergency Bay"
        ]);
      }

      // Read AI response aloud if not muted
      speakText(aiText);
    } catch (error) {
      console.error('Triage API error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: "I am having a brief moment reconnecting. Please feel free to repeat or click 'Finish & Send' to proceed directly to the triage desk." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      setIsFinishing(true);

      // Determine severity: if at least 3 SOCRATES fields are filled, consider properly triaged
      const filledFields = Object.values(socratesData).filter(v => v && typeof v === 'string' && v.trim() !== '').length;
      let finalSeverity = detectedSeverity;
      if (finalSeverity === 'ROUTINE' && filledFields >= 5) {
        const sev = socratesData.severity;
        if (sev && typeof sev === 'string') {
          const sevLower = sev.toLowerCase();
          if (sevLower.includes('sever') || sevLower.includes('10') || sevLower.includes('9') || sevLower.includes('8')) {
            finalSeverity = 'URGENT';
          }
        }
      }

      const payload = {
        patientName: patientProfile?.fullName || user?.name || 'Kiosk Patient',
        abhaId: abhaId || patientProfile?.abhaNumber || '',
        department: suggestedDepartment,
        suggestedDepartment: suggestedDepartment,
        severity: finalSeverity,
        socratesData: socratesData,
        ayushData: ayushData,
        chatHistory: messages.map(m => ({ role: m.role, text: m.text }))
      };

      if (isOffline) {
        // RURAL MODE: Save to local storage for background sync
        const pending = JSON.parse(localStorage.getItem('pendingTriages') || '[]');
        pending.push({ id: Date.now(), ...payload });
        localStorage.setItem('pendingTriages', JSON.stringify(pending));
        alert('Saved locally. Will sync when internet is restored. (Rural Mode)');
        navigate('/kiosk');
        return;
      }

      await completeTriage(payload).unwrap();
      navigate('/kiosk');
    } catch (err) {
      console.error('Finish triage error:', err);
      if (err.status === 'FETCH_ERROR') {
        const pending = JSON.parse(localStorage.getItem('pendingTriages') || '[]');
        pending.push({ id: Date.now(), ...payload });
        localStorage.setItem('pendingTriages', JSON.stringify(pending));
        alert('Network error. Saved locally for sync. (Rural Mode)');
        navigate('/kiosk');
      }
    } finally {
      setIsFinishing(false);
    }
  };

  // Count how many SOCRATES fields are filled
  const socratesProgress = Object.values(socratesData).filter(v => v && typeof v === 'string' && v.trim() !== '').length;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors z-50">
      {/* Subtle Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 via-teal-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-200/30 dark:bg-blue-900/15 blur-[120px]"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-200/30 dark:bg-teal-900/15 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/kiosk')} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Back to Kiosk"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          
          {/* Nurse Identity Badge */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center shadow-md text-white font-bold">
                <HeartPulse className="w-6 h-6" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Nurse Priya
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    AI Clinical Nurse
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Sanjeevani Smart Triage</span>
                {patientProfile?.fullName && <span>• Patient: {patientProfile.fullName}</span>}
                {patientProfile?.abhaNumber && (
                  <span className="hidden sm:inline-flex items-center gap-1 font-mono text-orange-600 dark:text-orange-400">
                    <Fingerprint className="w-3 h-3" />
                    {patientProfile.abhaNumber.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* ── In-Chat Voice Language Switcher ── */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <select
              value={voiceLang}
              onChange={e => handleVoiceLangChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none pr-1"
              title="Chat & Voice Language (stays locked until you change it)"
            >
              {VOICE_LANG_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2.5 rounded-full border transition-all ${
              isMuted 
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400' 
                : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-sm'
            }`}
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Offline Banner */}
          <AnimatePresence>
            {isOffline && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-full flex items-center gap-1.5 text-xs font-bold text-amber-800"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Offline Mode</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SOCRATES Progress */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Clinical Data</span>
            <div className="flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all ${
                    i < socratesProgress ? 'bg-blue-500 dark:bg-blue-400 scale-110' : 'bg-slate-200 dark:bg-slate-700'
                  }`} 
                />
              ))}
            </div>
            <span className="font-mono text-slate-400">{socratesProgress}/8</span>
          </div>

          {/* Suggested Department Pill */}
          {suggestedDepartment && suggestedDepartment !== 'GENERAL_MEDICINE' && (
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 hidden md:inline-flex shadow-sm">
              → {suggestedDepartment.replace(/_/g, ' ')}
            </span>
          )}

          {/* Finish & Send */}
          <button 
            onClick={handleFinish} 
            disabled={isFinishing || messages.length < 2}
            className="flex items-center px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-md hover:shadow-emerald-500/25 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFinishing ? (
              <>Submitting...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Finish & Send</>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              logout();
              navigate('/kiosk');
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-all"
            title="Exit Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 flex flex-col">
        
        {/* Emergency Alert Banner */}
        <AnimatePresence>
          {detectedSeverity === 'EMERGENCY' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto w-full p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-red-400"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <AlertTriangle className="w-7 h-7 text-white animate-bounce" />
                </div>
                <div>
                  <div className="font-extrabold text-base sm:text-lg">CRITICAL RED FLAG DETECTED</div>
                  <div className="text-xs sm:text-sm text-red-100">
                    Emergency response activated. Hospital staff has been alerted for immediate triage.
                  </div>
                </div>
              </div>
              <button 
                onClick={handleFinish} 
                className="px-5 py-2.5 bg-white text-red-700 font-bold rounded-xl hover:bg-red-50 transition-colors shadow text-sm shrink-0"
              >
                Proceed to Emergency Desk →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empathy Voice Orb Indicator */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className="relative flex items-center justify-center">
            <AnimatePresence>
              {isSpeaking && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="absolute w-24 h-24 bg-teal-400/40 dark:bg-teal-500/30 rounded-full blur-xl"
                />
              )}
            </AnimatePresence>
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
              isSpeaking 
                ? 'bg-gradient-to-br from-teal-500 to-blue-600 scale-110 shadow-teal-500/40 text-white' 
                : 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-700'
            }`}>
              <Stethoscope className="w-8 h-8" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            {isSpeaking ? "Nurse Priya is speaking..." : isListening ? "Listening to you..." : "Nurse Priya • Attending You"}
          </span>
        </div>

        {/* Chat Messages */}
        <div className="max-w-3xl mx-auto w-full flex flex-col space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 max-w-[85%] sm:max-w-[78%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white' 
                    : 'bg-gradient-to-br from-teal-500 to-blue-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`p-4 sm:p-5 rounded-2xl shadow-sm text-base sm:text-lg leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-blue-500/10' 
                    : 'bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 max-w-[80%] mr-auto items-center"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm flex items-center gap-2 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Nurse Priya is assessing</span>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </motion.div>
            )}

            {/* Quick Replies */}
            {!isLoading && quickReplies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 mt-3 ml-12"
              >
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-50 dark:hover:bg-slate-700 shadow-sm text-sm font-medium transition-all active:scale-95"
                    onClick={() => handleSend(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Footer */}
      <footer className="relative z-10 p-4 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] transition-colors">
        <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3 items-center">
          <input 
            type="text"
            className="flex-1 h-12 sm:h-14 rounded-full border border-slate-300 dark:border-slate-700 px-5 sm:px-6 text-base sm:text-lg bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 dark:text-white shadow-inner transition-all"
            placeholder={language === 'Hindi' ? "यहाँ अपने लक्षण लिखें या बोलें..." : "Type or speak your symptoms..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />

          {/* Microphone Button */}
          <button 
            className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full shrink-0 shadow-md transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            onClick={toggleListening}
            title="Speak symptoms (Voice-to-Text)"
          >
            {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Send Button */}
          <button 
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full shrink-0 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-md shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            title="Send Message"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
