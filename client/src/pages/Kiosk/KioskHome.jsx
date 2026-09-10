import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, Stethoscope, Clock, ShieldAlert, FileText, Moon, Sun, Globe, MessageSquareHeart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function KioskHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage, locationEnabled } = useLanguage();

  const handleCheckIn = () => {
    navigate('/kiosk/abha');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 mt-4 min-h-screen">

      {/* ── Staff Login button (top-left) ── */}
      <div className="absolute top-5 left-5 z-50">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            bg-white/70 dark:bg-slate-800/70 backdrop-blur-md
            border border-slate-200 dark:border-slate-600
            text-slate-600 dark:text-slate-300
            hover:bg-blue-600 hover:text-white hover:border-blue-600
            shadow-sm transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Staff Dashboard Login
        </button>
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
        
        {/* Language Switcher */}
        <div className="flex items-center gap-2 px-3 border-r border-slate-300 dark:border-slate-600">
          <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <select 
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="English">English {locationEnabled && language === 'English' ? '(Auto)' : ''}</option>
            <option value="Hindi">हिंदी (Hindi) {locationEnabled && language === 'Hindi' ? '(Auto)' : ''}</option>
            <option value="Tamil">தமிழ் (Tamil) {locationEnabled && language === 'Tamil' ? '(Auto)' : ''}</option>
            <option value="Marathi">मराठी (Marathi) {locationEnabled && language === 'Marathi' ? '(Auto)' : ''}</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      <motion.div 
        className="relative z-10 w-full max-w-5xl pt-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center mb-16">
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div className="p-4 bg-white/50 rounded-3xl shadow-xl backdrop-blur-xl border border-white/40">
              <HeartPulse className="w-16 h-16 text-blue-600" />
            </div>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Sanjeevani <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">AI-OS</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-2xl text-slate-600 dark:text-slate-300 font-medium">
            {language === 'Hindi' ? 'स्मार्ट ट्राइएज कियोस्क में आपका स्वागत है। हम आपकी कैसे मदद कर सकते हैं?' : 'Welcome to the Smart Triage Kiosk. How can we help you today?'}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="glass-panel dark:bg-slate-800/80 cursor-pointer h-full border border-blue-500/20 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300" onClick={handleCheckIn}>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="p-5 bg-gradient-to-br from-blue-100 to-teal-100 dark:from-blue-900/50 dark:to-teal-900/50 rounded-full mb-6 shadow-inner border border-white dark:border-slate-700">
                  <Stethoscope className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
                  {language === 'Hindi' ? 'AI ट्राइएज शुरू करें' : 'Start AI Triage'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg font-medium">
                  {language === 'Hindi' ? 'तुरंत सही डॉक्टर के पास जाने के लिए हमारे AI को अपने लक्षण बताएं।' : 'Tell our AI your symptoms to get directed to the right doctor immediately.'}
                </p>
                <Button size="lg" className="w-full text-xl py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white shadow-xl shadow-blue-500/30 border-none transition-all" onClick={(e) => { e.stopPropagation(); handleCheckIn(); }}>
                  {language === 'Hindi' ? 'चेक-इन शुरू करें' : 'Begin Check-in'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-6">

            {/* AI Triage Chat */}
            <Card
              className="flex-1 glass-panel dark:bg-slate-800/80 hover:bg-white/60 dark:hover:bg-slate-700/80 transition-all cursor-pointer group hover:shadow-xl hover:-translate-y-1 duration-300 border-violet-200/50 dark:border-violet-800/40"
              onClick={() => navigate('/triage')}
            >
              <CardContent className="flex items-center p-8 gap-6 h-full">
                <div className="p-4 bg-violet-100 dark:bg-violet-900/40 rounded-full group-hover:scale-110 transition-transform">
                  <MessageSquareHeart className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {language === 'Hindi' ? 'AI ट्राइएज चैट' : 'AI Triage Chat'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Describe your symptoms — AI will guide you to the right department.</p>
                </div>
              </CardContent>
            </Card>

            {/* Appointments */}
            <Card
              className="flex-1 glass-panel dark:bg-slate-800/80 hover:bg-white/60 dark:hover:bg-slate-700/80 transition-all cursor-pointer group hover:shadow-xl hover:-translate-y-1 duration-300"
              onClick={() => navigate('/appointments')}
            >
              <CardContent className="flex items-center p-8 gap-6 h-full">
                <div className="p-4 bg-orange-100 dark:bg-orange-900/40 rounded-full group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {language === 'Hindi' ? 'मेरा अपॉइंटमेंट है' : 'I have an Appointment'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Scan your QR code or view upcoming visits.</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="flex-1 glass-panel dark:bg-slate-800/80 hover:bg-white/60 dark:hover:bg-slate-700/80 transition-all cursor-pointer group hover:shadow-xl hover:-translate-y-1 duration-300"
              onClick={() => navigate('/scan')}
            >
              <CardContent className="flex items-center p-8 gap-6 h-full">
                <div className="p-4 bg-teal-100 dark:bg-teal-900/40 rounded-full group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Scan Old Records</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Upload old prescriptions or lab reports for AI analysis.</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="flex-1 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/40 dark:hover:to-rose-900/40 transition-all border border-red-200 dark:border-red-900/50 cursor-pointer group hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1 duration-300"
              onClick={() => navigate('/kiosk/abha')}
            >
              <CardContent className="flex items-center p-8 gap-6 h-full">
                <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-full animate-pulse group-hover:animate-none">
                  <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-700 dark:text-red-400">
                    {language === 'Hindi' ? 'आपातकाल (Emergency)' : 'Emergency'}
                  </h3>
                  <p className="text-red-500 dark:text-red-300 font-medium">Click here for immediate life-saving assistance.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
