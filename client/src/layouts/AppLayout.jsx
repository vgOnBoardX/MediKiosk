import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Stethoscope, Activity, CalendarCheck,
  FileSearch, MessageSquareHeart, Tv2, UserCircle, LogOut,
  ChevronLeft, ChevronRight, ShieldCheck, Menu, X,
  Bell, Search, HeartPulse, Sun, Moon,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────── */
/*  Nav config per role                                        */
/* ─────────────────────────────────────────────────────────── */
const NAV = {
  DOCTOR: [
    { label: 'Doctor Dashboard', path: '/doctor',  icon: Stethoscope },
    { label: 'Nurse / Triage',   path: '/nurse',   icon: Activity    },
    { label: 'Scan Documents',   path: '/scan',    icon: FileSearch  },
    { label: 'TV Queue Display', path: '/tv',      icon: Tv2         },
    { label: 'My Profile',       path: '/profile', icon: UserCircle  },
  ],
  NURSE: [
    { label: 'Nurse Dashboard',  path: '/nurse',   icon: Activity    },
    { label: 'Scan Documents',   path: '/scan',    icon: FileSearch  },
    { label: 'TV Queue Display', path: '/tv',      icon: Tv2         },
    { label: 'My Profile',       path: '/profile', icon: UserCircle  },
  ],
  ADMIN: [
    { label: 'Admin Dashboard',  path: '/admin',   icon: LayoutDashboard },
    { label: 'Doctor Dashboard', path: '/doctor',  icon: Stethoscope     },
    { label: 'Nurse / Triage',   path: '/nurse',   icon: Activity        },
    { label: 'Scan Documents',   path: '/scan',    icon: FileSearch      },
    { label: 'TV Queue Display', path: '/tv',      icon: Tv2             },
    { label: 'My Profile',       path: '/profile', icon: UserCircle      },
  ],
};



const ROLE_BADGE = {
  DOCTOR: 'bg-sky-100   text-sky-700   dark:bg-sky-900/40   dark:text-sky-300',
  NURSE:  'bg-teal-100  text-teal-700  dark:bg-teal-900/40  dark:text-teal-300',
  ADMIN:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
const ROLE_LABEL = { DOCTOR: 'Doctor', NURSE: 'Nurse', ADMIN: 'Admin' };

/* ─────────────────────────────────────────────────────────── */
export default function AppLayout() {
  const { user, logout }          = useAuth();
  const { theme, toggleTheme }    = useTheme();
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobile]   = useState(false);

  const navItems   = NAV[user?.role] || NAV.DOCTOR;
  const badgeClass = ROLE_BADGE[user?.role] || ROLE_BADGE.DOCTOR;
  const roleLabel  = ROLE_LABEL[user?.role] || 'Staff';
  const initials   = (user?.name || 'MK').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  const currentPage = navItems.find(n => location.pathname.startsWith(n.path))?.label || 'Dashboard';

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── shared sidebar body ── */
  const SidebarInner = ({ onNav }) => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo row */}
      <div className={`flex items-center gap-3 px-4 py-[18px] border-b
        border-slate-200 dark:border-white/8
        ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600
          flex items-center justify-center shadow-lg shadow-sky-500/25 shrink-0">
          <ShieldCheck className="w-[18px] h-[18px] text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
              MediKiosk
            </p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-0.5">
              Sanjeevani AI-OS
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2 pb-1.5">
            Navigation
          </p>
        )}
        {navItems.map(item => {
          const Icon     = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink key={item.path} to={item.path} onClick={onNav}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 group relative
                ${collapsed ? 'justify-center px-2' : ''}
                ${isActive
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8'
                }`}>
              <Icon className="shrink-0" style={{ width: '1.05rem', height: '1.05rem' }} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {/* tooltip in collapsed mode */}
              {collapsed && (
                <span className="absolute left-full ml-3 px-3 py-1.5
                  bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg
                  opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap
                  shadow-xl border border-white/10 z-50 transition-opacity duration-150">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer: user + logout */}
      <div className="px-2 pb-3 pt-2 border-t border-slate-200 dark:border-white/8 space-y-1">
        {/* User card */}
        <div className={`flex items-center gap-2.5 px-2 py-2 rounded-xl
          bg-slate-100 dark:bg-white/5
          ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500
            flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                {user?.name}
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl transition-all
            text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400
            hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-medium
            ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="shrink-0" style={{ width: '1rem', height: '1rem' }} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 236 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="hidden md:flex flex-col shrink-0 relative z-20
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-white/8">
        <SidebarInner onNav={() => {}} />
        {/* collapse button */}
        <button onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-[68px] w-6 h-6 rounded-full
            bg-white dark:bg-slate-800
            border border-slate-200 dark:border-white/15
            flex items-center justify-center shadow-md z-30
            text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400
            hover:border-sky-400 transition-all">
          {collapsed
            ? <ChevronRight style={{ width:'0.7rem', height:'0.7rem' }} />
            : <ChevronLeft  style={{ width:'0.7rem', height:'0.7rem' }} />}
        </button>
      </motion.aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setMobile(false)}
              className="fixed inset-0 bg-black/50 z-30 md:hidden" />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type:'spring', stiffness:320, damping:32 }}
              className="fixed left-0 top-0 bottom-0 w-60 z-40 md:hidden
                bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/8 flex flex-col">
              <button onClick={() => setMobile(false)}
                className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8">
                <X className="w-4 h-4" />
              </button>
              <SidebarInner onNav={() => setMobile(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-5
          bg-white dark:bg-slate-900
          border-b border-slate-200 dark:border-white/8
          shadow-sm dark:shadow-none z-10">

          <div className="flex items-center gap-3">
            {/* hamburger (mobile) */}
            <button onClick={() => setMobile(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 transition">
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                {currentPage}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">
                {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search */}
            <div className="hidden sm:flex items-center gap-2
              bg-slate-100 dark:bg-white/6
              border border-slate-200 dark:border-white/10
              rounded-xl px-3 py-1.5 text-slate-400 dark:text-slate-500 text-xs cursor-pointer
              hover:border-sky-400 transition-colors">
              <Search style={{ width:'0.85rem', height:'0.85rem' }} />
              <span>Search...</span>
            </div>

            {/* Dark / Light toggle */}
            <button onClick={toggleTheme}
              className="p-2 rounded-xl transition-all
                text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400
                hover:bg-slate-100 dark:hover:bg-white/8"
              title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}>
              {theme === 'dark'
                ? <Sun  className="w-[1.1rem] h-[1.1rem]" />
                : <Moon className="w-[1.1rem] h-[1.1rem]" />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl
              text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-white/8 transition">
              <Bell className="w-[1.1rem] h-[1.1rem]" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-sky-500 rounded-full" />
            </button>

            {/* Avatar */}
            <button onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500
                flex items-center justify-center text-xs font-bold text-white
                hover:ring-2 hover:ring-sky-400 hover:ring-offset-2
                dark:hover:ring-offset-slate-900 transition-all"
              title="My Profile">
              {initials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950">
          <div className="min-h-full p-4 md:p-6 text-slate-900 dark:text-slate-100">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
