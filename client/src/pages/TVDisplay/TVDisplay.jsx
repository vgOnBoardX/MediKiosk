import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, BellRing, MonitorPlay } from 'lucide-react';
import { useGetTriageQueueQuery } from '../../store/apiSlice';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');

export default function TVDisplay() {
  const { data: queue = [], refetch } = useGetTriageQueueQuery('triage');
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    socket.emit('join_triage');

    socket.on('triage-alert', (payload) => {
      refetch();
      if (payload.type === 'ENCOUNTER_STATUS_CHANGE' && payload.data.status === 'IN_CONSULTATION') {
        setAnnouncement(`Token ${payload.data.id.substring(0, 4).toUpperCase()} (${payload.data.name}) - Please proceed to Doctor's Cabin.`);
        playChime();
        setTimeout(() => setAnnouncement(null), 10000);
      }
    });

    return () => {
      socket.off('triage-alert');
    };
  }, [refetch]);

  const playChime = () => {
    // Attempt to play a simple chime or beep using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.log('Audio playback blocked by browser policy');
    }
  };

  // Only show waiting patients
  const waitingPatients = queue.filter(p => p.status === 'WAITING' || p.status === 'TRIAGED');
  
  // Separate by priority
  const emergency = waitingPatients.filter(p => p.priority === 'EMERGENCY');
  const urgent = waitingPatients.filter(p => p.priority === 'URGENT');
  const routine = waitingPatients.filter(p => p.priority === 'ROUTINE');

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      <header className="px-8 py-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <MonitorPlay className="w-10 h-10 text-sky-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-wider">Sanjeevani <span className="text-sky-500">Live Queue</span></h1>
            <p className="text-slate-400 font-medium">Outpatient Department (OPD)</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold font-mono tracking-widest">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-slate-400 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      <AnimatePresence>
        {announcement && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-emerald-600 text-white p-6 text-center shadow-2xl flex items-center justify-center gap-4 border-b-4 border-emerald-400"
          >
            <BellRing className="w-10 h-10 animate-bounce" />
            <h2 className="text-4xl font-bold">{announcement}</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 p-8 grid grid-cols-3 gap-8">
        
        {/* Emergency Column */}
        <div className="col-span-1 flex flex-col">
          <div className="bg-red-500/20 border border-red-500/30 rounded-t-2xl p-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-red-400 uppercase tracking-widest">Emergency</h2>
            <span className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xl">{emergency.length}</span>
          </div>
          <div className="flex-1 bg-slate-900/50 border border-t-0 border-slate-800 rounded-b-2xl p-4 space-y-4 overflow-hidden relative">
            {emergency.map((p, i) => (
              <QueueCard key={p.id} patient={p} isTop={i === 0} highlightColor="border-red-500" />
            ))}
          </div>
        </div>

        {/* Urgent Column */}
        <div className="col-span-1 flex flex-col">
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-t-2xl p-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-amber-400 uppercase tracking-widest">Urgent</h2>
            <span className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">{urgent.length}</span>
          </div>
          <div className="flex-1 bg-slate-900/50 border border-t-0 border-slate-800 rounded-b-2xl p-4 space-y-4 overflow-hidden relative">
            {urgent.map((p, i) => (
              <QueueCard key={p.id} patient={p} isTop={i === 0} highlightColor="border-amber-500" />
            ))}
          </div>
        </div>

        {/* Routine Column */}
        <div className="col-span-1 flex flex-col">
          <div className="bg-slate-800 border border-slate-700 rounded-t-2xl p-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-300 uppercase tracking-widest">Routine</h2>
            <span className="w-10 h-10 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xl">{routine.length}</span>
          </div>
          <div className="flex-1 bg-slate-900/50 border border-t-0 border-slate-800 rounded-b-2xl p-4 space-y-4 overflow-hidden relative">
            {routine.slice(0, 8).map((p, i) => (
              <QueueCard key={p.id} patient={p} isTop={i === 0} highlightColor="border-slate-500" />
            ))}
            {routine.length > 8 && (
              <div className="text-center p-4 text-slate-500 font-bold uppercase tracking-widest">
                + {routine.length - 8} more waiting
              </div>
            )}
          </div>
        </div>

      </main>

      <footer className="px-8 py-4 bg-slate-900 border-t border-slate-800 text-slate-500 flex justify-between">
        <p>AI Triage active. Emergency cases are automatically prioritized.</p>
        <p>Powered by Sanjeevani AI-OS</p>
      </footer>
    </div>
  );
}

function QueueCard({ patient, isTop, highlightColor }) {
  const token = patient.id.substring(0, 4).toUpperCase();
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-xl flex items-center justify-between border-l-4 bg-slate-800/80 ${highlightColor} ${isTop ? 'shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] ring-1 ring-white/10' : ''}`}
    >
      <div>
        <h3 className={`font-bold ${isTop ? 'text-3xl text-white mb-1' : 'text-xl text-slate-200'}`}>Token: {token}</h3>
        <p className={`font-medium ${isTop ? 'text-lg text-slate-300' : 'text-sm text-slate-400'}`}>{patient.name}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="px-3 py-1 bg-slate-950 rounded-full text-xs font-bold text-slate-400 tracking-wider mb-2">
          {patient.department?.replace(/_/g, ' ')}
        </span>
        <span className="flex items-center text-slate-500 text-sm font-medium">
          <Clock className="w-4 h-4 mr-1" /> {patient.time}
        </span>
      </div>
    </motion.div>
  );
}
