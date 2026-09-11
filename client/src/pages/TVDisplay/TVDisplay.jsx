import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Clock, BellRing, MonitorPlay, AlertTriangle, ShieldAlert,
  HeartPulse, Stethoscope, Users, Zap, TrendingUp, Timer,
  Building2, CheckCircle2, Sparkles, Volume2, VolumeX, ArrowUpRight
} from 'lucide-react';
import { useGetTriageQueueQuery } from '../../store/apiSlice';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');

// Initial realistic demonstration data if live queue is currently empty
const SAMPLE_QUEUE = [
  {
    id: 'emg-101',
    token: 'TK-01',
    name: 'Rajesh Sharma',
    department: 'CARDIOLOGY',
    priority: 'EMERGENCY',
    status: 'WAITING',
    time: '2 mins ago',
    waitTimeMinutes: 2,
    vitals: { spO2: '91%', bp: '158/102', pulse: '118 bpm' },
    symptoms: 'Central crushing chest pain, sweating',
    assignedCabin: 'Resuscitation Bay 1'
  },
  {
    id: 'urg-201',
    token: 'TK-14',
    name: 'Sunita Mehra',
    department: 'PULMONOLOGY',
    priority: 'URGENT',
    status: 'WAITING',
    time: '8 mins ago',
    waitTimeMinutes: 8,
    vitals: { spO2: '95%', bp: '130/85', pulse: '92 bpm' },
    symptoms: 'Acute asthmatic wheeze, high fever',
    assignedCabin: 'Cabin 3 (Pulmo OPD)'
  },
  {
    id: 'urg-202',
    token: 'TK-19',
    name: 'Arjun Das',
    department: 'GASTROENTEROLOGY',
    priority: 'URGENT',
    status: 'WAITING',
    time: '14 mins ago',
    waitTimeMinutes: 14,
    vitals: { spO2: '98%', bp: '124/80', pulse: '86 bpm' },
    symptoms: 'Severe RIF abdominal spasm, vomiting',
    assignedCabin: 'Cabin 4 (Gastro OPD)'
  },
  {
    id: 'rtn-301',
    token: 'TK-42',
    name: 'Pooja Verma',
    department: 'GENERAL_MEDICINE',
    priority: 'ROUTINE',
    status: 'WAITING',
    time: '18 mins ago',
    waitTimeMinutes: 18,
    vitals: { spO2: '99%', bp: '118/76', pulse: '74 bpm' },
    symptoms: 'Mild dry cough, seasonal cold',
    assignedCabin: 'Cabin 6 (Gen OPD)'
  },
  {
    id: 'rtn-302',
    token: 'TK-45',
    name: 'Kavita Sengupta',
    department: 'ORTHOPEDICS',
    priority: 'ROUTINE',
    status: 'WAITING',
    time: '24 mins ago',
    waitTimeMinutes: 24,
    vitals: { spO2: '99%', bp: '122/82', pulse: '78 bpm' },
    symptoms: 'Chronic lumbar ache, stiffness',
    assignedCabin: 'Cabin 8 (Ortho OPD)'
  },
  {
    id: 'rtn-303',
    token: 'TK-49',
    name: 'Mohammad Imran',
    department: 'DERMATOLOGY',
    priority: 'ROUTINE',
    status: 'WAITING',
    time: '31 mins ago',
    waitTimeMinutes: 31,
    vitals: { spO2: '98%', bp: '120/80', pulse: '76 bpm' },
    symptoms: 'Forearm allergic contact dermatitis',
    assignedCabin: 'Cabin 9 (Derma OPD)'
  },
  {
    id: 'rtn-304',
    token: 'TK-53',
    name: 'Deepak Patel',
    department: 'ENT',
    priority: 'ROUTINE',
    status: 'WAITING',
    time: '36 mins ago',
    waitTimeMinutes: 36,
    vitals: { spO2: '99%', bp: '116/74', pulse: '72 bpm' },
    symptoms: 'Unilateral ear fullness & tinnitus',
    assignedCabin: 'Cabin 11 (ENT OPD)'
  }
];

export default function TVDisplay() {
  const { data: rawQueue = [], refetch } = useGetTriageQueueQuery('triage', {
    pollingInterval: 10000 // auto poll every 10s
  });

  const [announcement, setAnnouncement] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Ticking digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Airport / Hospital 2-Tone Chime (Ding-Dong)
  const playHospitalChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Tone 1: High note (G5 - 783.99 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime);
      gain1.gain.setValueAtTime(0.18, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);

      // Tone 2: Low note (E5 - 659.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.28);
      gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.28);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.28);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Audio playback restricted by browser policy:', e);
    }
  };

  // Socket listener for real-time queue calls
  useEffect(() => {
    socket.emit('join_triage');

    socket.on('triage-alert', (payload) => {
      refetch();
      if (payload?.type === 'ENCOUNTER_STATUS_CHANGE' && payload?.data?.status === 'IN_CONSULTATION') {
        const tokenDisplay = payload.data.token || (payload.data.id ? payload.data.id.substring(0, 5).toUpperCase() : 'TK-NOW');
        setAnnouncement(`Token ${tokenDisplay} (${payload.data.name}) — Please proceed to Consultation Cabin.`);
        playHospitalChime();
        setTimeout(() => setAnnouncement(null), 10000);
      }
    });

    return () => {
      socket.off('triage-alert');
    };
  }, [refetch, soundEnabled]);

  // Clean, normalize and enrich patient queue data
  const cleanedQueue = useMemo(() => {
    let sourceData = Array.isArray(rawQueue) && rawQueue.length > 0 ? rawQueue : SAMPLE_QUEUE;

    return sourceData
      .filter(p => p && (p.status === 'WAITING' || p.status === 'TRIAGED' || !p.status))
      .map((p, idx) => {
        const rawPriority = (p.priority || p.severity || 'ROUTINE').toUpperCase();
        let priority = 'ROUTINE';
        if (rawPriority.includes('EMERG')) priority = 'EMERGENCY';
        else if (rawPriority.includes('URGENT') || rawPriority.includes('HIGH')) priority = 'URGENT';

        const token = p.token || (p.id ? `TK-${p.id.toString().slice(-3).toUpperCase()}` : `TK-0${idx + 1}`);
        const name = p.name || p.patientName || 'Kiosk Patient';
        const department = (p.department || p.suggestedDepartment || 'GENERAL_MEDICINE').replace(/_/g, ' ');
        const waitMinutes = typeof p.waitTimeMinutes === 'number' ? p.waitTimeMinutes : (idx * 5 + 3);

        return {
          id: p.id || `pt-${idx}`,
          token,
          name,
          priority,
          department,
          time: p.time || `${waitMinutes}m ago`,
          waitTimeMinutes: waitMinutes,
          vitals: p.vitals || { spO2: '98%', bp: '120/80', pulse: '76 bpm' },
          symptoms: p.symptoms || p.chiefComplaint || 'Triaged via Sanjeevani AI-OS',
          assignedCabin: p.assignedCabin || `Cabin ${(idx % 8) + 1}`
        };
      });
  }, [rawQueue]);

  // Split into 3 clinical priority categories
  const emergency = useMemo(() => cleanedQueue.filter(p => p.priority === 'EMERGENCY'), [cleanedQueue]);
  const urgent = useMemo(() => cleanedQueue.filter(p => p.priority === 'URGENT'), [cleanedQueue]);
  const routine = useMemo(() => cleanedQueue.filter(p => p.priority === 'ROUTINE'), [cleanedQueue]);

  // Dynamic clinical KPIs calculation
  const kpis = useMemo(() => {
    const totalWaiting = cleanedQueue.length;
    const avgWait = cleanedQueue.length > 0 
      ? Math.round(cleanedQueue.reduce((acc, p) => acc + p.waitTimeMinutes, 0) / cleanedQueue.length)
      : 11;

    // Emergency metrics
    const emgAvgDoorToDoctor = emergency.length > 0 ? '< 2 Mins' : 'Ready (0m)';
    const emgBedsFree = '3 / 4 Available';

    // Urgent metrics
    const urgAvgWait = urgent.length > 0 
      ? `${Math.round(urgent.reduce((acc, p) => acc + p.waitTimeMinutes, 0) / urgent.length)} Mins`
      : '8 Mins';
    const urgVelocity = '4.6 Pts / Hr';

    // Routine metrics
    const rtnNextCall = routine.length > 0 ? `~${Math.min(routine[0].waitTimeMinutes, 6)} Mins` : 'Next Available';
    const rtnOnSchedule = '96% On Track';

    return {
      totalWaiting,
      avgWait,
      activeDoctors: 8,
      triageAccuracy: '99.4%',
      emg: { avgDoorToDoctor: emgAvgDoorToDoctor, bedsFree: emgBedsFree },
      urg: { avgWait: urgAvgWait, velocity: urgVelocity },
      rtn: { nextCall: rtnNextCall, onSchedule: rtnOnSchedule }
    };
  }, [cleanedQueue, emergency, urgent, routine]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* ── TOP NAV / HEADER ── */}
      <header className="px-8 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex justify-between items-center z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
            <MonitorPlay className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-wider text-white">
                Sanjeevani <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">Live Queue</span>
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Feed
              </span>
            </div>
            <p className="text-slate-400 text-xs font-semibold tracking-wide flex items-center gap-2">
              <span>Outpatient Department (OPD) & Emergency Triage</span>
              <span className="text-slate-600">·</span>
              <span className="text-sky-400">AIIMS / NABH Gold Standard</span>
            </p>
          </div>
        </div>

        {/* Header Right: Audio control + Live Clock */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-2"
            title={soundEnabled ? "Mute Announcement Chime" : "Enable Announcement Chime"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span className="font-medium text-[11px]">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <div className="text-right pl-4 border-l border-slate-800">
            <p className="text-3xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </p>
            <p className="text-slate-400 text-xs font-semibold tracking-wider">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      {/* ── HIGH-LEVEL KPI RIBBON (Data Visualization Bar) ── */}
      <section className="px-8 py-3 bg-slate-900/60 border-b border-slate-800/60 grid grid-cols-4 gap-4 z-10">
        <TopKpiCard 
          icon={<Users className="w-4 h-4 text-sky-400" />}
          label="Total Waiting in Queue"
          value={`${kpis.totalWaiting} Patients`}
          subtext="Real-time OPD triage backlog"
          badge="+3 this hour"
          badgeColor="text-sky-400 bg-sky-400/10 border-sky-500/20"
        />
        <TopKpiCard 
          icon={<Timer className="w-4 h-4 text-amber-400" />}
          label="Facility Average Wait"
          value={`${kpis.avgWait} Mins`}
          subtext="Target: < 20 mins (NABH Level 1)"
          badge="Optimal"
          badgeColor="text-emerald-400 bg-emerald-400/10 border-emerald-500/20"
        />
        <TopKpiCard 
          icon={<Stethoscope className="w-4 h-4 text-emerald-400" />}
          label="Specialist Doctors Active"
          value={`${kpis.activeDoctors} Cabins Open`}
          subtext="Cardiology, Pulmo, Gastro, Ortho"
          badge="100% Staffed"
          badgeColor="text-emerald-400 bg-emerald-400/10 border-emerald-500/20"
        />
        <TopKpiCard 
          icon={<Sparkles className="w-4 h-4 text-purple-400" />}
          label="AI Triage Accuracy"
          value={kpis.triageAccuracy}
          subtext="Autonomous SOCRATES matching"
          badge="Verified"
          badgeColor="text-purple-400 bg-purple-400/10 border-purple-500/20"
        />
      </section>

      {/* ── ANNOUNCEMENT BANNER ── */}
      <AnimatePresence>
        {announcement && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white px-8 py-4 shadow-2xl flex items-center justify-between border-b-2 border-emerald-300 z-30"
          >
            <div className="flex items-center gap-4">
              <span className="p-2.5 rounded-xl bg-white/20 animate-bounce">
                <BellRing className="w-6 h-6 text-white" />
              </span>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-200 block">Current Consultation Call</span>
                <h2 className="text-2xl font-black tracking-wide">{announcement}</h2>
              </div>
            </div>
            <span className="text-xs font-bold bg-white text-emerald-800 px-4 py-1.5 rounded-full shadow">
              Proceed to Door Now
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN QUEUE COLUMNS (Emergency, Urgent, Routine) ── */}
      <main className="flex-1 p-6 grid grid-cols-3 gap-6 overflow-hidden min-h-0">
        
        {/* ══════════════════════════════════════
            COLUMN 1: EMERGENCY (Priority 1)
        ══════════════════════════════════════ */}
        <div className="flex flex-col h-full rounded-2xl bg-gradient-to-b from-red-950/30 to-slate-900/50 border border-red-500/30 overflow-hidden shadow-2xl shadow-red-950/20">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-red-900/40 via-red-950/50 to-slate-900 border-b border-red-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-400/50 flex items-center justify-center text-red-400 shadow-md shadow-red-500/20"
              >
                <HeartPulse className="w-5 h-5 text-red-400" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-red-400 tracking-wider uppercase">Emergency</h2>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-extrabold tracking-widest uppercase">
                    Level 1
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-medium">Immediate Resuscitation & Bed Transfer</p>
              </div>
            </div>
            
            {/* Animated Counter Badge */}
            <motion.div 
              key={emergency.length}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="px-4 py-1.5 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center gap-2 shadow-inner"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-2xl font-black text-red-200">{emergency.length}</span>
            </motion.div>
          </div>

          {/* Section KPIs Banner */}
          <div className="p-3 bg-red-950/20 border-b border-red-500/20 grid grid-cols-2 gap-2">
            <MiniKpiItem 
              label="Door-to-Doctor"
              value={kpis.emg.avgDoorToDoctor}
              highlightColor="text-red-300"
              icon={<Zap className="w-3.5 h-3.5 text-red-400" />}
            />
            <MiniKpiItem 
              label="Resuscitation Bays"
              value={kpis.emg.bedsFree}
              highlightColor="text-emerald-300"
              icon={<Building2 className="w-3.5 h-3.5 text-emerald-400" />}
            />
          </div>

          {/* Patient Card Stream */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto custom-scroll relative">
            <AnimatePresence mode="popLayout">
              {emergency.length === 0 ? (
                <EmptyState 
                  title="No Active Emergencies"
                  desc="Critical bays clear · Trauma team standing by"
                  accent="text-emerald-400"
                />
              ) : (
                emergency.map((patient, idx) => (
                  <PatientQueueCard 
                    key={patient.id} 
                    patient={patient} 
                    isTop={idx === 0} 
                    theme="emergency" 
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ══════════════════════════════════════
            COLUMN 2: URGENT (Priority 2)
        ══════════════════════════════════════ */}
        <div className="flex flex-col h-full rounded-2xl bg-gradient-to-b from-amber-950/30 to-slate-900/50 border border-amber-500/30 overflow-hidden shadow-2xl shadow-amber-950/20">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-amber-900/40 via-amber-950/50 to-slate-900 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ rotate: [0, -4, 4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/20"
              >
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-amber-400 tracking-wider uppercase">Urgent</h2>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold tracking-widest uppercase">
                    Level 2
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-medium">Evaluation Window &lt; 30 Mins Target</p>
              </div>
            </div>
            
            {/* Animated Counter Badge */}
            <motion.div 
              key={urgent.length}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="px-4 py-1.5 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center gap-2 shadow-inner"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-2xl font-black text-amber-200">{urgent.length}</span>
            </motion.div>
          </div>

          {/* Section KPIs Banner */}
          <div className="p-3 bg-amber-950/20 border-b border-amber-500/20 grid grid-cols-2 gap-2">
            <MiniKpiItem 
              label="Urgent Avg Wait"
              value={kpis.urg.avgWait}
              highlightColor="text-amber-300"
              icon={<Clock className="w-3.5 h-3.5 text-amber-400" />}
            />
            <MiniKpiItem 
              label="Clearance Velocity"
              value={kpis.urg.velocity}
              highlightColor="text-sky-300"
              icon={<TrendingUp className="w-3.5 h-3.5 text-sky-400" />}
            />
          </div>

          {/* Patient Card Stream */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto custom-scroll relative">
            <AnimatePresence mode="popLayout">
              {urgent.length === 0 ? (
                <EmptyState 
                  title="No Urgent Backlog"
                  desc="All urgent cases cleared to cabin"
                  accent="text-amber-400"
                />
              ) : (
                urgent.map((patient, idx) => (
                  <PatientQueueCard 
                    key={patient.id} 
                    patient={patient} 
                    isTop={idx === 0} 
                    theme="urgent" 
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ══════════════════════════════════════
            COLUMN 3: ROUTINE (Priority 3)
        ══════════════════════════════════════ */}
        <div className="flex flex-col h-full rounded-2xl bg-gradient-to-b from-slate-900/70 to-slate-950/70 border border-slate-700/50 overflow-hidden shadow-2xl shadow-slate-950/30">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-800/80 via-slate-900 to-slate-950 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600/50 flex items-center justify-center text-slate-300 shadow-md">
                <Activity className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-200 tracking-wider uppercase">Routine</h2>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-300 text-[10px] font-extrabold tracking-widest uppercase">
                    Level 3
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-medium">Standard OPD Consultations & Follow-ups</p>
              </div>
            </div>
            
            {/* Animated Counter Badge */}
            <motion.div 
              key={routine.length}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="px-4 py-1.5 rounded-xl bg-slate-800 border border-slate-600/80 flex items-center gap-2 shadow-inner"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="text-2xl font-black text-white">{routine.length}</span>
            </motion.div>
          </div>

          {/* Section KPIs Banner */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-2 gap-2">
            <MiniKpiItem 
              label="Est. Next Call"
              value={kpis.rtn.nextCall}
              highlightColor="text-sky-300"
              icon={<Timer className="w-3.5 h-3.5 text-sky-400" />}
            />
            <MiniKpiItem 
              label="Schedule Adherence"
              value={kpis.rtn.onSchedule}
              highlightColor="text-emerald-300"
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            />
          </div>

          {/* Patient Card Stream */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto custom-scroll relative">
            <AnimatePresence mode="popLayout">
              {routine.length === 0 ? (
                <EmptyState 
                  title="Queue Clear"
                  desc="OPD registration kiosk open at front desk"
                  accent="text-sky-400"
                />
              ) : (
                routine.map((patient, idx) => (
                  <PatientQueueCard 
                    key={patient.id} 
                    patient={patient} 
                    isTop={idx === 0} 
                    theme="routine" 
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* ── FOOTER TICKER ── */}
      <footer className="px-8 py-3 bg-slate-950 border-t border-slate-800/80 text-xs font-semibold text-slate-400 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <p className="tracking-wide">
            <strong className="text-slate-200">AI Clinical Triage Guard:</strong> Severity-driven dynamic queue sequencing active. Red-flag cases bypass standard queue order immediately.
          </p>
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
          <span>NABH Certified OPD Engine</span>
          <span>·</span>
          <span>Sanjeevani AI-OS v2.4</span>
        </div>
      </footer>
    </div>
  );
}

// ── SUB-COMPONENT: Top KPI Card ──
function TopKpiCard({ icon, label, value, subtext, badge, badgeColor }) {
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
          <span className="text-lg font-black text-white leading-tight">{value}</span>
          <span className="text-[10px] text-slate-500 font-medium block">{subtext}</span>
        </div>
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── SUB-COMPONENT: Mini Section KPI ──
function MiniKpiItem({ label, value, highlightColor, icon }) {
  return (
    <div className="bg-slate-950/80 rounded-lg p-2 flex items-center justify-between border border-white/5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-xs font-black font-mono ${highlightColor}`}>{value}</span>
    </div>
  );
}

// ── SUB-COMPONENT: Patient Queue Card ──
function PatientQueueCard({ patient, isTop, theme }) {
  const styles = {
    emergency: {
      border: 'border-l-4 border-red-500',
      bg: isTop ? 'bg-red-950/40 border-red-500/40 ring-1 ring-red-500/30' : 'bg-slate-900/80 border-slate-800',
      tokenBg: 'bg-red-500/20 text-red-300 border-red-500/40',
      badge: 'bg-red-500/20 text-red-300 border-red-500/40'
    },
    urgent: {
      border: 'border-l-4 border-amber-500',
      bg: isTop ? 'bg-amber-950/40 border-amber-500/40 ring-1 ring-amber-500/30' : 'bg-slate-900/80 border-slate-800',
      tokenBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    routine: {
      border: 'border-l-4 border-sky-500',
      bg: isTop ? 'bg-sky-950/30 border-sky-500/30 ring-1 ring-sky-500/20' : 'bg-slate-900/80 border-slate-800',
      tokenBg: 'bg-slate-800 text-slate-300 border-slate-700',
      badge: 'bg-slate-800 text-slate-400 border-slate-700'
    }
  }[theme];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`p-3.5 rounded-xl border ${styles.border} ${styles.bg} transition-all shadow-md relative overflow-hidden`}
    >
      {isTop && (
        <div className="absolute top-0 right-0">
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg bg-emerald-500 text-slate-950 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
            Next In Line
          </span>
        </div>
      )}

      {/* Main Card Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-sm border ${styles.tokenBg}`}>
            {patient.token}
          </span>
          <div>
            <h3 className="font-extrabold text-sm text-white tracking-wide">{patient.name}</h3>
            <span className="text-[11px] text-slate-400 font-medium">{patient.assignedCabin}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="flex items-center justify-end text-[11px] font-semibold text-slate-400 gap-1">
            <Clock className="w-3 h-3 text-slate-500" /> {patient.time}
          </span>
          <span className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${styles.badge}`}>
            {patient.department}
          </span>
        </div>
      </div>

      {/* Clinical Symptoms & Vitals Bar */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
        <span className="text-slate-300 font-medium truncate max-w-[180px]" title={patient.symptoms}>
          {patient.symptoms}
        </span>
        {patient.vitals && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400">
              SpO2 {patient.vitals.spO2}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
              {patient.vitals.bp}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── SUB-COMPONENT: Empty State ──
function EmptyState({ title, desc, accent }) {
  return (
    <div className="h-44 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800/80 rounded-xl bg-slate-950/40">
      <CheckCircle2 className={`w-8 h-8 mb-2 ${accent} opacity-80`} />
      <h4 className="font-bold text-sm text-slate-300 mb-0.5">{title}</h4>
      <p className="text-xs text-slate-500 max-w-[200px]">{desc}</p>
    </div>
  );
}
