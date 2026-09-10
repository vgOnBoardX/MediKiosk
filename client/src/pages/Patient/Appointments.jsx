import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2,
  Plus, ArrowRight, ChevronLeft, Sun, Sunset, Moon, Trash2, AlertTriangle, X
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

/* ─── helpers ─── */
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getNext14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d;
  });
}
function isBooked(dateIdx, slot) {
  const seed = (dateIdx * 7 + slot.id * 3) % 10;
  return seed < 3;
}
function fmtDate(d) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${DAY_NAMES[dt.getDay()]}, ${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`;
}

const SPECIALTIES = [
  { id: 1, name: 'General Medicine',  icon: '🩺', color: 'blue',   waitTime: '10 mins', doctor: 'Dr. Arun Sharma'  },
  { id: 2, name: 'Cardiology',        icon: '❤️', color: 'red',    waitTime: '45 mins', doctor: 'Dr. Priya Nair'   },
  { id: 3, name: 'Orthopedics',       icon: '🦴', color: 'amber',  waitTime: '20 mins', doctor: 'Dr. Rahul Gupta'  },
  { id: 4, name: 'Pediatrics',        icon: '👶', color: 'green',  waitTime: '15 mins', doctor: 'Dr. Meena Iyer'   },
  { id: 5, name: 'Dermatology',       icon: '🧴', color: 'purple', waitTime: '30 mins', doctor: 'Dr. Sunita Roy'   },
  { id: 6, name: 'ENT',               icon: '👂', color: 'teal',   waitTime: '25 mins', doctor: 'Dr. Karan Mehta'  },
];
const TIME_SESSIONS = [
  { label:'Morning',   icon:Sun,    color:'amber',
    slots:[{id:1,time:'08:00 AM'},{id:2,time:'08:30 AM'},{id:3,time:'09:00 AM'},{id:4,time:'09:30 AM'},
           {id:5,time:'10:00 AM'},{id:6,time:'10:30 AM'},{id:7,time:'11:00 AM'},{id:8,time:'11:30 AM'}]},
  { label:'Afternoon', icon:Sunset, color:'orange',
    slots:[{id:9,time:'12:00 PM'},{id:10,time:'12:30 PM'},{id:11,time:'01:00 PM'},{id:12,time:'01:30 PM'},
           {id:13,time:'02:00 PM'},{id:14,time:'02:30 PM'},{id:15,time:'03:00 PM'},{id:16,time:'03:30 PM'}]},
  { label:'Evening',   icon:Moon,   color:'indigo',
    slots:[{id:17,time:'04:00 PM'},{id:18,time:'04:30 PM'},{id:19,time:'05:00 PM'},{id:20,time:'05:30 PM'},
           {id:21,time:'06:00 PM'},{id:22,time:'06:30 PM'}]},
];
const COLOR = {
  blue:  {ring:'ring-blue-500',  bg:'bg-blue-50',  text:'text-blue-600',  badge:'bg-blue-100 text-blue-700' },
  red:   {ring:'ring-red-400',   bg:'bg-red-50',   text:'text-red-500',   badge:'bg-red-100 text-red-700'   },
  amber: {ring:'ring-amber-400', bg:'bg-amber-50', text:'text-amber-500', badge:'bg-amber-100 text-amber-700'},
  green: {ring:'ring-green-500', bg:'bg-green-50', text:'text-green-600', badge:'bg-green-100 text-green-700'},
  purple:{ring:'ring-purple-500',bg:'bg-purple-50',text:'text-purple-600',badge:'bg-purple-100 text-purple-700'},
  teal:  {ring:'ring-teal-500',  bg:'bg-teal-50',  text:'text-teal-600',  badge:'bg-teal-100 text-teal-700' },
  orange:{ring:'ring-orange-400',bg:'bg-orange-50',text:'text-orange-500',badge:'bg-orange-100 text-orange-700'},
  indigo:{ring:'ring-indigo-500',bg:'bg-indigo-50',text:'text-indigo-600',badge:'bg-indigo-100 text-indigo-700'},
};

/* initial demo past history (stored in state so they can be deleted) */
const INITIAL_HISTORY = [
  { id:'h1', icon:'🩺', name:'General Checkup',      date:'12 Aug 2026', doctor:'Dr. Sharma', token:'A23' },
  { id:'h2', icon:'❤️', name:'Cardio Consultation',  date:'03 Jul 2026', doctor:'Dr. Nair',   token:'B11' },
];

/* ══════════════════════════════════════════════════════════ */
export default function Appointments() {
  const allDays = useMemo(() => getNext14Days(), []);

  /* booking wizard state */
  const [isBooking, setIsBooking]       = useState(false);
  const [step, setStep]                 = useState(1);
  const [selSpec, setSelSpec]           = useState(null);
  const [selDate, setSelDate]           = useState(null);
  const [selSlot, setSelSlot]           = useState(null);
  const [weekOff, setWeekOff]           = useState(0);

  /* appointment lists */
  const [upcoming, setUpcoming]         = useState([]);    // confirmed this session
  const [history,  setHistory]          = useState(INITIAL_HISTORY);

  /* delete confirm dialog */
  const [deleteTarget, setDeleteTarget] = useState(null);  // {id, list:'upcoming'|'history', name}

  const visibleDays = allDays.slice(weekOff * 7, weekOff * 7 + 7);

  /* reset wizard */
  const resetWizard = () => {
    setIsBooking(false); setStep(1);
    setSelSpec(null); setSelDate(null); setSelSlot(null); setWeekOff(0);
  };

  /* confirm a new booking */
  const confirmBooking = (token) => {
    const appt = {
      id: `u-${Date.now()}`,
      icon: selSpec.icon,
      name: selSpec.name,
      doctor: selSpec.doctor,
      date: selDate.toISOString(),
      time: selSlot.time,
      token,
    };
    setUpcoming(prev => [...prev, appt]);
  };

  /* delete helpers */
  const askDelete = (id, list, name) => setDeleteTarget({ id, list, name });
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.list === 'upcoming') setUpcoming(p => p.filter(a => a.id !== deleteTarget.id));
    else                                   setHistory(p  => p.filter(a => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  /* ── Delete confirm modal ── */
  const DeleteModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
        exit={{scale:0.9,opacity:0}} transition={{type:'spring',stiffness:300,damping:22}}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-red-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500"/>
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Delete Appointment?</h3>
        </div>
        <p className="text-slate-500 text-sm mb-5">
          Are you sure you want to delete <strong className="text-slate-700">"{deleteTarget?.name}"</strong>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}
            className="flex-1 rounded-xl border-slate-200">
            Cancel
          </Button>
          <Button onClick={confirmDelete}
            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white">
            <Trash2 className="w-4 h-4 mr-1.5"/> Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );

  /* ── Booking wizard ── */
  const BookingModal = () => {
    const [token] = useState(`A${Math.floor(Math.random()*90)+10}`);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div initial={{opacity:0,scale:0.95,y:24}} animate={{opacity:1,scale:1,y:0}}
          exit={{opacity:0,scale:0.95,y:24}} transition={{type:'spring',stiffness:260,damping:22}}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">

          {/* header */}
          <div className="p-5 bg-gradient-to-r from-blue-600 to-teal-500 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Book Appointment</h2>
              <div className="flex items-center gap-2 mt-1.5">
                {[1,2,3].map(n=>(
                  <div key={n} className={`h-1.5 rounded-full transition-all duration-300 ${n<=step?'bg-white w-8':'bg-white/30 w-4'}`}/>
                ))}
                <span className="text-blue-100 text-xs ml-1">Step {step} of 3</span>
              </div>
            </div>
            <button onClick={resetWizard} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors">
              <X className="w-4 h-4"/>
            </button>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* Step 1 */}
              {step===1 && (
                <motion.div key="s1" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.2}}>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Select Specialty</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {SPECIALTIES.map(spec=>{
                      const c=COLOR[spec.color], active=selSpec?.id===spec.id;
                      return (
                        <button key={spec.id} onClick={()=>setSelSpec(spec)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${active?`border-current ring-2 ${c.ring} ${c.bg}`:'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                          <div className="text-3xl mb-2">{spec.icon}</div>
                          <h4 className="font-bold text-slate-800 text-sm">{spec.name}</h4>
                          <p className={`text-xs mt-0.5 ${active?c.text:'text-slate-400'}`}>👨‍⚕️ {spec.doctor}</p>
                          <span className={`inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full ${active?c.badge:'bg-slate-100 text-slate-500'}`}>
                            <Clock className="w-3 h-3"/>~{spec.waitTime}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end mt-5">
                    <Button disabled={!selSpec} onClick={()=>setStep(2)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                      Next <ArrowRight className="w-4 h-4 ml-1"/>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2 */}
              {step===2 && (
                <motion.div key="s2" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.2}}>
                  {/* Date strip */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-800">Select Date</h3>
                      <div className="flex items-center gap-1">
                        <button onClick={()=>setWeekOff(0)} disabled={weekOff===0} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition">
                          <ChevronLeft className="w-4 h-4 text-slate-500"/>
                        </button>
                        <span className="text-xs text-slate-500 px-1">{MONTH_NAMES[visibleDays[0].getMonth()]}</span>
                        <button onClick={()=>setWeekOff(1)} disabled={weekOff===1} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition">
                          <ChevronRight className="w-4 h-4 text-slate-500"/>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {visibleDays.map((date,i)=>{
                        const dayIdx=weekOff*7+i, isToday=dayIdx===0, isSun=date.getDay()===0;
                        const active=selDate?.toDateString()===date.toDateString();
                        return (
                          <button key={i} disabled={isSun} onClick={()=>{setSelDate(date);setSelSlot(null);}}
                            className={`flex flex-col items-center py-2.5 rounded-xl border-2 transition-all duration-200 ${
                              active?'border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-200'
                              :isSun?'border-transparent bg-slate-50 text-slate-300 cursor-not-allowed'
                              :'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${active?'text-blue-100':isSun?'text-slate-300':'text-slate-400'}`}>{DAY_NAMES[date.getDay()]}</span>
                            <span className="text-base font-extrabold mt-0.5">{date.getDate()}</span>
                            {isToday&&<span className={`text-[9px] font-bold mt-0.5 ${active?'text-blue-200':'text-blue-500'}`}>TODAY</span>}
                            {isSun&&<span className="text-[9px] text-slate-300 mt-0.5">Closed</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time slots */}
                  <AnimatePresence>
                  {selDate?(
                    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                      <h3 className="text-lg font-bold text-slate-800 mb-3">Select Time Slot</h3>
                      <div className="space-y-4">
                        {TIME_SESSIONS.map(session=>{
                          const SIcon=session.icon, sc=COLOR[session.color];
                          return (
                            <div key={session.label}>
                              <div className={`flex items-center gap-2 mb-2 ${sc.text}`}>
                                <SIcon className="w-4 h-4"/>
                                <span className="text-xs font-bold uppercase tracking-wider">{session.label}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {session.slots.map(slot=>{
                                  const dateIdx=allDays.findIndex(d=>d.toDateString()===selDate.toDateString());
                                  const booked=isBooked(dateIdx,slot), active=selSlot?.id===slot.id;
                                  return (
                                    <button key={slot.id} disabled={booked} onClick={()=>setSelSlot(slot)}
                                      className={`py-2 px-1 rounded-xl text-xs font-semibold border-2 transition-all duration-150 ${
                                        booked?'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through'
                                        :active?'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                                        :'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'}`}>
                                      {booked?'🔒':''} {slot.time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ):(
                    <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                      <CalendarIcon className="w-10 h-10 mb-2"/>
                      <p className="text-sm">Pick a date to see available slots</p>
                    </div>
                  )}
                  </AnimatePresence>

                  <div className="flex justify-between mt-5 pt-4 border-t border-slate-100">
                    <Button variant="outline" onClick={()=>setStep(1)} className="rounded-xl">
                      <ChevronLeft className="w-4 h-4 mr-1"/> Back
                    </Button>
                    <Button disabled={!selDate||!selSlot} onClick={()=>{confirmBooking(token);setStep(3);}}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 disabled:opacity-40">
                      Confirm Slot <ArrowRight className="w-4 h-4 ml-1"/>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3 */}
              {step===3 && (
                <motion.div key="s3" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="text-center py-6">
                  <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:300,delay:0.1}}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10 text-green-600"/>
                  </motion.div>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-1">Booking Confirmed!</h3>
                  <p className="text-slate-500 text-sm mb-6">Your appointment details are shown below.</p>
                  <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-5 text-left border border-blue-100 space-y-3 mb-6">
                    <SummaryRow icon="🩺" label="Specialty" value={selSpec?.name}/>
                    <SummaryRow icon="👨‍⚕️" label="Doctor"    value={selSpec?.doctor}/>
                    <SummaryRow icon="📅" label="Date"       value={fmtDate(selDate)}/>
                    <SummaryRow icon="⏰" label="Time"       value={selSlot?.time}/>
                    <SummaryRow icon="🏥" label="Location"   value="OPD Block B, Ground Floor"/>
                    <div className="pt-2 border-t border-blue-100">
                      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5"/> Confirmed — Token #{token}
                      </span>
                    </div>
                  </div>
                  <Button onClick={resetWizard} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8">Done</Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  };

  /* ── page variants ── */
  const cv = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:0.1}} };
  const iv = { hidden:{y:20,opacity:0}, visible:{y:0,opacity:1,transition:{type:'spring',stiffness:100}} };

  return (
    <motion.div variants={cv} initial="hidden" animate="visible" className="max-w-5xl mx-auto space-y-8">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <motion.h1 variants={iv} className="text-4xl font-extrabold text-slate-900 tracking-tight">
            My <span className="text-blue-600">Appointments</span>
          </motion.h1>
          <motion.p variants={iv} className="text-slate-500 mt-2">Manage your visits and history.</motion.p>
        </div>
        <motion.div variants={iv}>
          <Button onClick={()=>setIsBooking(true)} size="lg"
            className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white shadow-lg shadow-blue-500/30 rounded-xl font-bold text-lg h-14 px-8">
            <Plus className="w-5 h-5 mr-2"/> Book Appointment
          </Button>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* ── Upcoming ── */}
        <motion.div variants={iv} className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500"/> Upcoming Visits
            {upcoming.length>0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">
                {upcoming.length}
              </span>
            )}
          </h2>

          {upcoming.length === 0 ? (
            <Card className="glass-panel border-none shadow-lg">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center h-[260px]">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5">
                  <CalendarIcon className="w-8 h-8 text-blue-300"/>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No upcoming appointments</h3>
                <p className="text-slate-400 text-sm max-w-xs mb-5">
                  Book an appointment to get started.
                </p>
                <Button onClick={()=>setIsBooking(true)} variant="outline"
                  className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 text-sm">
                  <Plus className="w-4 h-4 mr-1"/> Book Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {upcoming.map(appt => (
                  <motion.div key={appt.id}
                    initial={{opacity:0, y:-10, scale:0.98}}
                    animate={{opacity:1, y:0, scale:1}}
                    exit={{opacity:0, x:60, scale:0.95}}
                    transition={{type:'spring', stiffness:300, damping:25}}
                    layout>
                    <Card className="bg-white border border-blue-100 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                          {appt.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800">{appt.name}</h4>
                          <p className="text-xs text-slate-500">{appt.doctor}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                              <CalendarIcon className="w-3 h-3"/> {fmtDate(appt.date)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-600 font-semibold px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3"/> {appt.time}
                            </span>
                            <span className="text-xs text-green-600 font-bold">Token #{appt.token}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => askDelete(appt.id, 'upcoming', appt.name)}
                          className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                          title="Delete appointment">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ── Past History ── */}
        <motion.div variants={iv} className="md:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-500"/> Past History
            </h2>
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(`Clear all ${history.length} history records?`)) setHistory([]);
                }}
                className="text-xs text-red-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors">
                <Trash2 className="w-3 h-3"/> Clear All
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
              <Clock className="w-10 h-10 mb-2"/>
              <p className="text-sm text-center">No history records</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {history.map(h => (
                  <motion.div key={h.id}
                    initial={{opacity:0, x:20}}
                    animate={{opacity:1, x:0}}
                    exit={{opacity:0, x:60, scale:0.95}}
                    transition={{type:'spring', stiffness:300, damping:25}}
                    layout>
                    <Card className="bg-white/60 hover:bg-white/80 transition-colors border-none shadow-sm group">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center text-xl shrink-0">
                          {h.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{h.name}</h4>
                          <p className="text-xs text-slate-400">{h.date} · {h.doctor}</p>
                          {h.token && <p className="text-xs text-slate-400 mt-0.5">Token #{h.token}</p>}
                        </div>
                        <button
                          onClick={() => askDelete(h.id, 'history', h.name)}
                          className="p-1.5 rounded-lg text-slate-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>{isBooking && <BookingModal/>}</AnimatePresence>
      <AnimatePresence>{deleteTarget && <DeleteModal/>}</AnimatePresence>

    </motion.div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl w-7">{icon}</span>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
