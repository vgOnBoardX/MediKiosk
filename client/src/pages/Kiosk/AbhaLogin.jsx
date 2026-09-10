import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, QrCode, ScanFace, FileText, CheckCircle2, Mic, Volume2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function AbhaLogin() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { abhaLogin } = useAuth();

  const [abhaId, setAbhaId] = useState('');
  const [step, setStep] = useState(1); // 1: ABHA Entry, 2: Consent
  const [isCheckingPMJAY, setIsCheckingPMJAY] = useState(false);
  const [pmjayStatus, setPmjayStatus] = useState(null); // 'ELIGIBLE' or 'NOT_ELIGIBLE'
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  const [consentGiven, setConsentGiven] = useState({
    dataSharing: false,
    aiAnalysis: false
  });

  const texts = {
    English: {
      title: "Ayushman Bharat Health Account",
      subtitle: "Enter your 14-digit ABHA number or scan QR to link your medical records.",
      abhaPlaceholder: "e.g., 91-0000-0000-0000",
      scanText: "Scan ABHA QR",
      faceAuthText: "Face Auth",
      next: "Continue",
      consentTitle: "Data Protection Consent",
      consentSub: "As per the Digital Personal Data Protection Act 2023, we need your permission.",
      consent1: "I consent to sharing my medical history with Sanjeevani Hospital for this consultation.",
      consent2: "I consent to AI processing of my voice and documents for triage purposes.",
      startTriage: "Start Triage",
      readAloud: "Read Aloud",
      checkingPmjay: "Verifying PM-JAY Status...",
      pmjayEligible: "Eligible for PM-JAY (₹5L Cover)"
    },
    Hindi: {
      title: "आयुष्मान भारत स्वास्थ्य खाता (ABHA)",
      subtitle: "अपने मेडिकल रिकॉर्ड लिंक करने के लिए अपना 14-अंकीय आभा नंबर दर्ज करें या क्यूआर स्कैन करें।",
      abhaPlaceholder: "उदा., 91-0000-0000-0000",
      scanText: "क्यूआर स्कैन करें",
      faceAuthText: "फेस ऑथ",
      next: "जारी रखें",
      consentTitle: "डेटा सुरक्षा सहमति (DPDP Act)",
      consentSub: "डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के अनुसार, हमें आपकी अनुमति की आवश्यकता है।",
      consent1: "मैं इस परामर्श के लिए संजीवनी अस्पताल के साथ अपना मेडिकल इतिहास साझा करने की सहमति देता हूं।",
      consent2: "मैं एआई द्वारा अपनी आवाज और दस्तावेजों को प्रोसेस करने की सहमति देता हूं।",
      startTriage: "शुरू करें",
      readAloud: "पढ़कर सुनाएं",
      checkingPmjay: "PM-JAY स्थिति सत्यापित की जा रही है...",
      pmjayEligible: "PM-JAY के लिए योग्य (₹5L कवर)"
    }
  };

  const t = texts[language] || texts['English'];

  const handleNext = () => {
    if (abhaId.trim().length > 5) {
      setIsCheckingPMJAY(true);
      // Simulate NHA API Call
      setTimeout(() => {
        setIsCheckingPMJAY(false);
        setPmjayStatus('ELIGIBLE'); // Mocking as always eligible for SIH demo
        
        setTimeout(() => {
          setStep(2);
          speakText(t.consentSub);
        }, 2000);
      }, 1500);
    }
  };

  const handleStart = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await abhaLogin(abhaId);
      if (result.success) {
        navigate('/kiosk/vitals', { state: { language, abhaId } });
      } else {
        setAuthError(result.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'Hindi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const readConsent = () => {
    speakText(`${t.consentTitle}. ${t.consentSub}. 1: ${t.consent1}. 2: ${t.consent2}.`);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-200/40 dark:bg-blue-900/20 blur-[100px]"></div>
      </div>

      <header className="relative z-10 flex items-center justify-between p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-white/40 dark:border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sanjeevani AI-OS</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Patient Intake Terminal</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {language}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-10 max-w-2xl w-full border border-slate-100 dark:border-slate-800"
            >
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">{t.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg">{t.subtitle}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                    placeholder={t.abhaPlaceholder}
                    className="w-full text-center text-3xl font-mono tracking-widest p-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 transition-all outline-none"
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-16 text-lg rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                    <QrCode className="w-6 h-6 mr-3" /> {t.scanText}
                  </Button>
                  <Button variant="outline" className="flex-1 h-16 text-lg rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                    <ScanFace className="w-6 h-6 mr-3" /> {t.faceAuthText}
                  </Button>
                </div>

                {isCheckingPMJAY ? (
                  <div className="w-full h-16 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl border-2 border-blue-200 dark:border-blue-800 animate-pulse mt-4">
                    <ShieldCheck className="w-6 h-6 mr-3 animate-spin" /> {t.checkingPmjay}
                  </div>
                ) : pmjayStatus === 'ELIGIBLE' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-16 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-lg rounded-2xl border-2 border-emerald-500 mt-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <CheckCircle2 className="w-6 h-6 mr-3" /> {t.pmjayEligible}
                  </motion.div>
                ) : (
                  <Button 
                    onClick={handleNext} 
                    disabled={abhaId.trim().length < 6}
                    className="w-full h-16 text-xl bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg mt-4 disabled:opacity-50"
                  >
                    {t.next} <ArrowRight className="w-6 h-6 ml-2" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-10 max-w-2xl w-full border border-slate-100 dark:border-slate-800"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">{t.consentTitle}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg">{t.consentSub}</p>
                <button onClick={readConsent} className="mt-4 flex items-center justify-center mx-auto gap-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full">
                  <Volume2 className="w-4 h-4" /> {t.readAloud}
                </button>
              </div>

              <div className="space-y-4 mb-10">
                <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${consentGiven.dataSharing ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                    checked={consentGiven.dataSharing}
                    onChange={(e) => setConsentGiven(prev => ({ ...prev, dataSharing: e.target.checked }))}
                  />
                  <span className="text-lg text-slate-700 dark:text-slate-300 leading-snug">{t.consent1}</span>
                </label>

                <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${consentGiven.aiAnalysis ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                    checked={consentGiven.aiAnalysis}
                    onChange={(e) => setConsentGiven(prev => ({ ...prev, aiAnalysis: e.target.checked }))}
                  />
                  <span className="text-lg text-slate-700 dark:text-slate-300 leading-snug">{t.consent2}</span>
                </label>
              </div>

              {authError && (
                <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium text-center mb-2">
                  {authError}
                </div>
              )}

              <Button 
                onClick={handleStart} 
                disabled={!consentGiven.dataSharing || !consentGiven.aiAnalysis || isAuthenticating}
                className="w-full h-16 text-xl bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
              >
                {isAuthenticating ? (
                  <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Authenticating...</>
                ) : (
                  <><CheckCircle2 className="w-6 h-6 mr-3" /> {t.startTriage}</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
