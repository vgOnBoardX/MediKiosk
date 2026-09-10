import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Heart, Thermometer, Wind, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import KioskHeader from '../../components/ui/KioskHeader';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';

export default function VitalsCapture() {
  const navigate = useNavigate();
  const location = useLocation();
  const { abhaId = '' } = location.state || {};
  const { language } = useLanguage();

  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual'
  const [vitals, setVitals] = useState({
    spO2: '',
    heartRate: '',
    temperature: '',
    bp: ''
  });

  const startScan = () => {
    setIsScanning(true);
    // Simulate a 4-second scan
    setTimeout(() => {
      setVitals({
        spO2: Math.floor(Math.random() * (100 - 92) + 92), // 92-99%
        heartRate: Math.floor(Math.random() * (110 - 70) + 70), // 70-110 bpm
        temperature: (Math.random() * (102.5 - 97.5) + 97.5).toFixed(1), // 97.5 - 102.5 F
        bp: `${Math.floor(Math.random() * (140 - 110) + 110)}/${Math.floor(Math.random() * (90 - 70) + 70)}`
      });
      setIsScanning(false);
      setScanComplete(true);
    }, 4000);
  };

  const handleContinue = () => {
    // Pass vitals along to the visual triage
    navigate('/kiosk/visual', { state: { language, abhaId, initialVitals: vitals } });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden items-center justify-center p-6 pt-20 transition-colors">
      <KioskHeader />
      
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/10 dark:bg-sky-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-10 rounded-3xl shadow-2xl text-center transition-colors">
        
        <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
          {language === 'Hindi' ? "रोगी के वाइटल्स (Vitals) स्कैन करें" : "Patient Vitals Scan"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {language === 'Hindi' 
            ? "मैनुअल रूप से दर्ज करें या अपनी स्मार्टवॉच से सिंक करें।" 
            : "Enter manually or sync with your Smart Watch."}
        </p>

        {/* Mode Toggle */}
        {!scanComplete && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max mx-auto mb-8">
            <button
              onClick={() => setMode('auto')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'auto' ? 'bg-white dark:bg-slate-700 shadow text-sky-600 dark:text-sky-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Smart Watch Auto-Sync
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Manual Entry
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <VitalCard 
            icon={<Wind className="w-8 h-8 text-sky-400" />} 
            label="SpO2 (%)" 
            value={vitals.spO2} 
            onChange={(val) => setVitals({...vitals, spO2: val})}
            isScanning={isScanning} 
            delay={0.1}
            mode={mode}
            placeholder="e.g. 98"
          />
          <VitalCard 
            icon={<Heart className="w-8 h-8 text-rose-400" />} 
            label="Heart Rate (bpm)" 
            value={vitals.heartRate} 
            onChange={(val) => setVitals({...vitals, heartRate: val})}
            isScanning={isScanning} 
            delay={0.3}
            mode={mode}
            placeholder="e.g. 78"
          />
          <VitalCard 
            icon={<Thermometer className="w-8 h-8 text-amber-400" />} 
            label="Temp (°F)" 
            value={vitals.temperature} 
            onChange={(val) => setVitals({...vitals, temperature: val})}
            isScanning={isScanning} 
            delay={0.5}
            mode={mode}
            placeholder="e.g. 98.6"
          />
          <VitalCard 
            icon={<Activity className="w-8 h-8 text-emerald-400" />} 
            label="BP (mmHg)" 
            value={vitals.bp} 
            onChange={(val) => setVitals({...vitals, bp: val})}
            isScanning={isScanning} 
            delay={0.7}
            mode={mode}
            placeholder="e.g. 120/80"
          />
        </div>

        {!isScanning && !scanComplete && mode === 'auto' && (
          <Button 
            onClick={startScan}
            size="lg" 
            className="w-full sm:w-auto px-12 py-6 rounded-full text-lg font-bold bg-gradient-to-r from-sky-500 to-indigo-500 hover:scale-105 transition-transform shadow-[0_0_30px_-5px_rgba(14,165,233,0.5)]"
          >
            {language === 'Hindi' ? "स्मार्टवॉच सिंक करें" : "Sync Smart Watch"}
          </Button>
        )}

        {!isScanning && !scanComplete && mode === 'manual' && (
          <Button 
            onClick={() => setScanComplete(true)}
            size="lg" 
            disabled={!vitals.spO2 || !vitals.heartRate || !vitals.temperature || !vitals.bp}
            className="w-full sm:w-auto px-12 py-6 rounded-full text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 transition-transform disabled:opacity-50"
          >
            {language === 'Hindi' ? "वाइटल्स सहेजें" : "Save Vitals"}
          </Button>
        )}

        {isScanning && mode === 'auto' && (
          <div className="flex flex-col items-center text-sky-400">
            <Activity className="w-12 h-12 animate-pulse mb-4" />
            <p className="text-lg font-medium animate-pulse">Syncing with Smart Watch...</p>
          </div>
        )}

        {scanComplete && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
            <div className="flex items-center text-emerald-400 mb-6">
              <CheckCircle2 className="w-8 h-8 mr-2" />
              <span className="text-xl font-bold">Vitals Captured</span>
            </div>
            <Button 
              onClick={handleContinue}
              size="lg" 
              className="w-full sm:w-auto px-12 py-6 rounded-full text-lg font-bold bg-emerald-600 hover:bg-emerald-700 hover:scale-105 transition-transform"
            >
              {language === 'Hindi' ? "आगे बढ़ें" : "Continue to Triage"} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

      </div>
    </div>
  );
}

function VitalCard({ icon, label, value, onChange, isScanning, delay, mode, placeholder }) {
  return (
    <motion.div 
      animate={isScanning ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
      transition={{ repeat: isScanning ? Infinity : 0, duration: 1.5, delay }}
      className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden transition-colors shadow-sm"
    >
      {isScanning && <div className="absolute inset-0 bg-sky-500/10 animate-pulse"></div>}
      <div className="mb-3 relative z-10">{icon}</div>
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 relative z-10">{label}</p>
      
      {mode === 'manual' ? (
        <input 
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-center bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-2 text-lg font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 relative z-10"
        />
      ) : (
        <p className="text-2xl font-bold text-slate-800 dark:text-white relative z-10">{value ? value : '--'}</p>
      )}
    </motion.div>
  );
}
