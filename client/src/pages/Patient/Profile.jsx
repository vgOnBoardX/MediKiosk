import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Shield, Activity, Fingerprint, Settings, Moon, Sun, Globe, CheckCircle2, Lock, Unlock, Leaf, Sparkles, Clock, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function Profile() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage, locationEnabled } = useLanguage();
  
  const [dataConsent, setDataConsent] = React.useState(true);
  const [aiConsent, setAiConsent] = React.useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.h1 variants={itemVariants} className="text-4xl font-extrabold text-slate-900 tracking-tight">
            My <span className="text-blue-600">Profile</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-slate-500 mt-2">Manage your personal information and health records.</motion.p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Identity */}
        <motion.div variants={itemVariants} className="md:col-span-1 space-y-6">
          <Card className="glass-panel overflow-hidden border-none shadow-xl">
            <div className="h-32 bg-gradient-to-br from-blue-600 via-indigo-500 to-teal-400"></div>
            <CardContent className="pt-0 relative text-center pb-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-white p-1 absolute -top-12 left-1/2 -translate-x-1/2 shadow-lg">
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-blue-600">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-slate-800">{user?.name || 'User'}</h2>
                <p className="text-slate-500 flex items-center justify-center gap-1 mt-1">
                  <Mail className="w-4 h-4" /> {user?.email}
                </p>
                <div className="mt-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                    <Shield className="w-3.5 h-3.5" /> Verified Patient
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ABHA ID Card (Mock) */}
          <Card className="bg-gradient-to-br from-orange-500 to-rose-500 text-white border-none shadow-lg shadow-orange-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Fingerprint className="w-8 h-8 opacity-80" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">ABHA Linked</span>
              </div>
              <h3 className="text-lg font-semibold opacity-90 mb-1">Health ID</h3>
              <p className="text-2xl font-mono font-bold tracking-widest">14-XXXX-XXXX-XX</p>

              <div className="mt-4 flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span className="text-sm font-semibold text-emerald-50">PM-JAY Eligible (₹5L)</span>
              </div>
              <Button variant="secondary" className="w-full mt-6 bg-white/20 hover:bg-white/30 text-white border-none">
                View ABHA Card
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Details */}
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          <Card className="glass-panel border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Full Name</label>
                  <div className="p-3 bg-white/50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                    {user?.name || 'Not provided'}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Date of Birth</label>
                  <div className="p-3 bg-white/50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                    01 Jan 1990
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Phone Number
                  </label>
                  <div className="p-3 bg-white/50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                    +91 98765 43210
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Address
                  </label>
                  <div className="p-3 bg-white/50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                    Bangalore, Karnataka
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 rounded-xl">
                  Edit Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Smart Queue & OPD Load Balancing */}
          <Card className="glass-panel border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Users className="w-32 h-32" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6" /> OPD Smart Queue
                  </h3>
                  <p className="text-blue-200 text-sm mt-1 font-medium">AI-driven real-time load balancing.</p>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm animate-pulse flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  Live
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 shadow-inner">
                  <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold mb-1">Your Position</p>
                  <p className="text-4xl font-extrabold text-white">#4</p>
                  <p className="text-sm text-emerald-300 mt-2 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Est. Wait: 25 mins
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 shadow-inner">
                  <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold mb-1">Now Serving</p>
                  <p className="text-4xl font-extrabold text-white opacity-75">#2</p>
                  <p className="text-sm text-blue-200 mt-2 font-medium">Room 104 (Gen. Med)</p>
                </div>
              </div>
              
              <div className="mt-5 p-3.5 bg-black/20 rounded-xl text-sm text-blue-50 border border-white/10 backdrop-blur-sm">
                <span className="font-bold text-amber-300 mr-2">⚡ Alert:</span> 
                Queue prioritized due to emergency trauma case in Room 102. Times adjusted.
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-none shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-500" /> Health Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center">
                <Activity className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No recent health records found.</p>
                <p className="text-sm text-slate-500 mt-1">Visit the kiosk or complete triage to start tracking.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-none shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-500" /> AI Localized Dietitian
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-md">
                  <Sparkles className="w-3 h-3" /> Auto-Generated
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Based on your recent triage data and your location (Maharashtra), our AI suggests the following preventative diet plan for managing <span className="font-semibold text-slate-800 dark:text-slate-100">Hypertension</span>:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Switch to Millets:</span> Replace wheat/rice with Jowar (Sorghum) or Bajra roti which are common locally and have a lower glycemic index.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Reduce Sodium:</span> Limit the use of pickles (Achaar) and papad in your daily meals.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Hydration:</span> Drink Kokum Sarbat (without sugar) instead of sugary beverages for natural cooling.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-panel border-none shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Settings className="w-5 h-5 text-indigo-500" /> App Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Language</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Select your preferred language.</p>
                  </div>
                </div>
                <select 
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 dark:text-slate-200 outline-none border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 cursor-pointer"
                >
                  <option value="English">English {locationEnabled && language === 'English' ? '(Auto)' : ''}</option>
                  <option value="Hindi">हिंदी (Hindi) {locationEnabled && language === 'Hindi' ? '(Auto)' : ''}</option>
                  <option value="Tamil">தமிழ் (Tamil) {locationEnabled && language === 'Tamil' ? '(Auto)' : ''}</option>
                  <option value="Marathi">मराठी (Marathi) {locationEnabled && language === 'Marathi' ? '(Auto)' : ''}</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    {theme === 'dark' ? <Moon className="w-5 h-5 text-amber-500" /> : <Sun className="w-5 h-5 text-amber-600" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Theme</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Toggle between light and dark mode.</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-xl border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* DPDP Act Consent Vault */}
          <Card className="glass-panel border-none shadow-lg mt-6 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <Shield className="w-5 h-5 text-blue-500" /> DPDP Consent Vault
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-md">Govt Compliant</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Under the Digital Personal Data Protection (DPDP) Act 2023, you have full control over your health data. Revoke access at any time.
              </p>
              
              <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Hospital Data Sharing</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Allow Sanjeevani Hospital to view ABHA records.</p>
                </div>
                <Button 
                  variant={dataConsent ? "outline" : "destructive"}
                  size="sm"
                  className={dataConsent ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : ""}
                  onClick={() => setDataConsent(!dataConsent)}
                >
                  {dataConsent ? <><Unlock className="w-4 h-4 mr-1" /> Allowed</> : <><Lock className="w-4 h-4 mr-1" /> Revoked</>}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">AI Triage Processing</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Allow AI to analyze your symptoms for triage.</p>
                </div>
                <Button 
                  variant={aiConsent ? "outline" : "destructive"}
                  size="sm"
                  className={aiConsent ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : ""}
                  onClick={() => setAiConsent(!aiConsent)}
                >
                  {aiConsent ? <><Unlock className="w-4 h-4 mr-1" /> Allowed</> : <><Lock className="w-4 h-4 mr-1" /> Revoked</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
