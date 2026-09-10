import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown, ShieldCheck, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * KioskHeader — Persistent floating header for authenticated kiosk pages.
 * Shows patient name, ABHA number, profile dropdown, and logout.
 */
export default function KioskHeader() {
  const { user, patientProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const displayName = patientProfile?.fullName || user?.name || 'Patient';
  const abhaDisplay = patientProfile?.abhaNumber
    ? patientProfile.abhaNumber.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')
    : null;

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/kiosk');
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <div className="flex items-center justify-between px-5 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-xl shadow-blue-900/5">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Sanjeevani <span className="text-blue-600">AI</span>
              </h1>
            </div>
          </div>

          {/* Center: ABHA Badge */}
          {abhaDisplay && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-full">
              <Fingerprint className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-mono font-semibold text-orange-700 dark:text-orange-300 tracking-wide">{abhaDisplay}</span>
            </div>
          )}

          {/* Right: Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate hidden sm:block">
                {displayName}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />

                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50"
                  >
                    {/* Profile Info */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-1">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                      {abhaDisplay && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-mono mt-0.5">ABHA: {abhaDisplay}</p>
                      )}
                      {patientProfile?.pmjayEligible && (
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
                          ✅ PM-JAY Eligible
                        </span>
                      )}
                    </div>

                    {/* Profile Link */}
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mt-0.5"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
