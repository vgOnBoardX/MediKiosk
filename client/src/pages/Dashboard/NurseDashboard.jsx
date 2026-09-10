import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Users, Activity, LogOut, Loader2, 
  AlertTriangle, Clock, Bot, User, X, FileText, ChevronDown 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { 
  useGetTriageQueueQuery,
  useGetEncounterDetailQuery
} from '../../store/apiSlice';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');

const PRIORITY_STYLES = {
  EMERGENCY: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  URGENT: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  ROUTINE: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' }
};

function TranscriptModal({ encounterId, onClose }) {
  const { data: encounter, isLoading } = useGetEncounterDetailQuery(encounterId, { skip: !encounterId });

  if (!encounterId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isLoading ? 'Loading...' : encounter?.name || 'Patient'}
            </h2>
            <p className="text-sm text-slate-500">
              {encounter && (
                <>
                  {encounter.department?.replace(/_/g, ' ')} • 
                  <span className={`ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${PRIORITY_STYLES[encounter.priority]?.bg} ${PRIORITY_STYLES[encounter.priority]?.text}`}>
                    {encounter.priority}
                  </span>
                  {' '}• Wait: {encounter.waitTime}
                </>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* SOCRATES Quick Summary */}
        {encounter?.socratesData && Object.keys(encounter.socratesData).length > 0 && (
          <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100 flex flex-wrap gap-2">
            {Object.entries(encounter.socratesData).filter(([, v]) => v).map(([key, val]) => (
              <span key={key} className="px-3 py-1 bg-white rounded-full text-xs border border-blue-100 text-slate-700">
                <strong className="text-blue-600 uppercase">{key.replace(/_/g, ' ')}:</strong> {val}
              </span>
            ))}
          </div>
        )}

        {/* Transcript Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p className="text-sm">Loading transcript...</p>
            </div>
          ) : encounter?.chatTranscript && encounter.chatTranscript.length > 0 ? (
            <div className="space-y-4">
              {encounter.chatTranscript.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'ai' ? 'bg-blue-100' : 'bg-slate-200'}`}>
                    {msg.role === 'ai' ? <Bot className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-slate-600" />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-sm' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No transcript available for this encounter.</p>
            </div>
          )}
        </div>

        {/* Clinical Summary Footer */}
        {encounter?.clinicalSummary && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Clinical Summary</p>
            <p className="text-sm text-slate-700">{encounter.clinicalSummary}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function NurseDashboard() {
  const { data: queue = [], isLoading, refetch } = useGetTriageQueueQuery('triage');
  const [alerts, setAlerts] = useState([]);
  const [viewingTranscriptId, setViewingTranscriptId] = useState(null);

  useEffect(() => {
    socket.emit('join_triage');
    socket.emit('join_department', 'triage');

    socket.on('triage-alert', (data) => {
      if (data.type === 'NEW_PATIENT_TRIAGE') {
        setAlerts(prev => [{ 
          message: `New patient: ${data.data?.name} (${data.data?.priority})`, 
          time: new Date().toLocaleTimeString(),
          priority: data.data?.priority 
        }, ...prev].slice(0, 10)); // Keep last 10 alerts
      }
      refetch();
    });

    return () => {
      socket.off('triage-alert');
    };
  }, [refetch]);

  const emergencyCount = queue.filter(p => p.priority === 'EMERGENCY').length;
  const urgentCount = queue.filter(p => p.priority === 'URGENT').length;
  const routineCount = queue.filter(p => p.priority === 'ROUTINE').length;

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Activity className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800">Sanjeevani</h1>
            <p className="text-xs text-slate-500">Nurse Triage</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl font-medium">
            <Users className="w-5 h-5" /> Triage Queue
            <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">{queue.length}</span>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium relative">
            <ShieldAlert className="w-5 h-5" /> Emergency Alerts
            {emergencyCount > 0 && (
              <span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">{emergencyCount}</span>
            )}
          </a>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 text-red-600 font-medium w-full p-3 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Nurse Triage Dashboard</h2>
          <p className="text-slate-500">Manage patient queues and emergency alerts in real-time.</p>
        </header>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{emergencyCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Emergency</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{urgentCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Urgent</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">{routineCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Routine</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-5 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl shadow-sm"
            >
              <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5" /> Live Alerts
                <Button variant="ghost" size="sm" className="ml-auto text-red-500" onClick={() => setAlerts([])}>Clear</Button>
              </h3>
              <ul className="space-y-2">
                {alerts.slice(0, 5).map((alert, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_STYLES[alert.priority]?.dot || 'bg-slate-400'}`}></span>
                    <span className="text-slate-700">{alert.message}</span>
                    <span className="ml-auto text-xs text-slate-400">{alert.time}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queue Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-600 font-semibold">Patient Name</th>
                <th className="p-4 text-slate-600 font-semibold">Department</th>
                <th className="p-4 text-slate-600 font-semibold">Priority</th>
                <th className="p-4 text-slate-600 font-semibold">Wait Time</th>
                <th className="p-4 text-slate-600 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading Live Queue...
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                 <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No patients in the triage queue right now.
                  </td>
                </tr>
              ) : (
                queue.map(patient => {
                  const style = PRIORITY_STYLES[patient.priority] || PRIORITY_STYLES.ROUTINE;
                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
                          <span className="font-medium text-slate-800">{patient.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{(patient.department || 'GENERAL_MEDICINE').replace(/_/g, ' ')}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                          {patient.priority}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {patient.time}
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => setViewingTranscriptId(patient.id)}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" /> Review
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Transcript Modal */}
      <AnimatePresence>
        {viewingTranscriptId && (
          <TranscriptModal 
            encounterId={viewingTranscriptId} 
            onClose={() => setViewingTranscriptId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
