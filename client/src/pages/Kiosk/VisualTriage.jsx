import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Scan, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import KioskHeader from '../../components/ui/KioskHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function VisualTriage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { abhaId = '', initialVitals = {} } = location.state || {};
  const { language } = useLanguage();

  const [step, setStep] = useState('idle'); // idle, scanning, analyzing, complete
  const [analysis, setAnalysis] = useState(null);

  const startScan = () => {
    setStep('scanning');
    
    // Simulate camera capture
    setTimeout(() => {
      setStep('analyzing');
      
      // Simulate AI VLM processing
      setTimeout(() => {
        setAnalysis({
          finding: 'Erythematous macular rash on lower extremity',
          confidence: '94%',
          severity: 'Moderate',
          aiNote: 'Visual pattern matches presentation of cellulitis or severe allergic reaction. Recommended immediate examination.'
        });
        setStep('complete');
      }, 3000);
    }, 2000);
  };

  const handleSkip = () => {
    navigate('/triage', { state: { language, abhaId, initialVitals } });
  };

  const handleContinue = () => {
    // Merge visual findings into initialVitals as visualTriage
    navigate('/triage', { 
      state: { 
        language, 
        abhaId, 
        initialVitals: { ...initialVitals, visualFindings: analysis?.finding } 
      } 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden items-center justify-center p-6 pt-20 transition-colors">
      <KioskHeader />
      
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 p-10 rounded-3xl shadow-2xl transition-colors">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-500 dark:text-indigo-400" /> 
            {language === 'Hindi' ? "AI दृश्य विश्लेषण" : "AI Visual Triage"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {language === 'Hindi' 
              ? "यदि आपको कोई दिखाई देने वाली चोट, दाने या सूजन है, तो कृपया इसे कैमरे को दिखाएं।" 
              : "If you have a visible wound, rash, or swelling, please show it to the camera."}
          </p>
        </div>

        <div className="flex flex-col items-center">
          
          <AnimatePresence mode="wait">
            {step === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <div className="w-64 h-64 border-4 border-dashed border-indigo-500/50 rounded-2xl flex items-center justify-center bg-indigo-500/5 mb-8">
                  <Camera className="w-16 h-16 text-indigo-500/50 dark:text-indigo-400/50" />
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleSkip} className="px-8 py-6 rounded-full text-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {language === 'Hindi' ? "छोड़ें" : "Skip"}
                  </Button>
                  <Button onClick={startScan} className="px-8 py-6 rounded-full text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]">
                    <Scan className="w-5 h-5 mr-2" />
                    {language === 'Hindi' ? "स्कैन शुरू करें" : "Start Scan"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'scanning' && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <div className="w-64 h-64 border-4 border-indigo-500 rounded-2xl relative overflow-hidden mb-8">
                  <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20"></div>
                  <motion.div 
                    animate={{ y: ['0%', '100%', '0%'] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute top-0 left-0 w-full h-1 bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] dark:shadow-[0_0_15px_rgba(129,140,248,1)]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Scan className="w-16 h-16 text-indigo-400 dark:text-indigo-300" />
                  </div>
                </div>
                <p className="text-xl text-indigo-600 dark:text-indigo-300 font-medium animate-pulse">Capturing Image...</p>
              </motion.div>
            )}

            {step === 'analyzing' && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <div className="w-64 h-64 border-4 border-indigo-500/30 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/20 mb-8 relative">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 border-t-4 border-indigo-500 rounded-full" />
                  <Sparkles className="w-16 h-16 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                </div>
                <p className="text-xl text-indigo-600 dark:text-indigo-300 font-medium">Vision-Language Model Processing...</p>
              </motion.div>
            )}

            {step === 'complete' && analysis && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-6 mb-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">AI Visual Analysis Complete</h3>
                  </div>
                  
                  <div className="grid gap-4 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Detected Finding</p>
                      <p className="text-lg text-slate-800 dark:text-white">{analysis.finding}</p>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Confidence</p>
                        <p className="text-lg text-emerald-600 dark:text-emerald-400 font-bold">{analysis.confidence}</p>
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Severity</p>
                        <p className="text-lg text-amber-600 dark:text-amber-400 font-bold">{analysis.severity}</p>
                      </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl flex gap-3 items-start">
                      <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-indigo-600 dark:text-indigo-300 uppercase tracking-wider font-bold mb-1">Clinical Note</p>
                        <p className="text-indigo-900 dark:text-indigo-100">{analysis.aiNote}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button onClick={handleContinue} className="px-10 py-6 rounded-full text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                    {language === 'Hindi' ? "आगे बढ़ें" : "Continue to Voice Triage"} <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
