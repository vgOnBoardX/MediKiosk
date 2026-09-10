import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Home, LogOut, Settings, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

export default function PatientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Kiosk', path: '/kiosk', icon: <Home className="w-5 h-5" /> },
    { name: 'Appointments', path: '/appointments', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Profile', path: '/profile', icon: <User className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-teal-50 opacity-60 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-300/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-300/20 blur-[100px] animate-pulse delay-1000"></div>
      </div>

      {/* Floating Island Navigation */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <motion.nav 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="glass-panel flex items-center justify-between px-6 py-3 rounded-full w-full max-w-4xl shadow-2xl shadow-blue-900/5 border border-white/60"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/kiosk')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
              S
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight hidden sm:block">
              Sanjeevani <span className="text-blue-600">AI</span>
            </span>
          </div>

          {/* Center Links */}
          <div className="flex items-center gap-2 sm:gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                      : 'text-slate-600 hover:bg-white/60 hover:text-blue-600'
                  }`}
                >
                  {item.icon}
                  <span className={`font-medium text-sm ${!isActive && 'hidden sm:block'}`}>{item.name}</span>
                </button>
              )
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 relative">
            <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pr-3 bg-white/50 hover:bg-white border border-white/60 rounded-full shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border border-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/60 p-2"
                  >
                    <div className="px-3 py-3 border-b border-slate-200/50 mb-2">
                      <p className="font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    
                    <button onClick={() => { setProfileOpen(false); navigate('/profile'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                      <Settings className="w-4 h-4" /> Account Settings
                    </button>
                    
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
