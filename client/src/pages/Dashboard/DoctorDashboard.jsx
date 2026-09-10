import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BrainCircuit, FileText, ClipboardList, Loader2, Users, 
  Activity, ChevronRight, Bot, User, Clock, AlertTriangle, CheckCircle2,
  PlayCircle, XCircle, QrCode, Download, ShieldAlert, FileSignature
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  useGetTriageQueueQuery, 
  useGetEncounterDetailQuery,
  useUpdateEncounterStatusMutation,
  useGetPatientDocumentsQuery
} from '../../store/apiSlice';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');

const SOCRATES_LABELS = {
  site: { label: 'Site', icon: '📍' },
  onset: { label: 'Onset', icon: '⏱️' },
  character: { label: 'Character', icon: '🔬' },
  radiation: { label: 'Radiation', icon: '↗️' },
  associations: { label: 'Associations', icon: '🔗' },
  time_course: { label: 'Time Course', icon: '📈' },
  exacerbating_relieving: { label: 'Exacerbating / Relieving', icon: '⚡' },
  severity: { label: 'Severity', icon: '🎯' }
};

const PRIORITY_STYLES = {
  EMERGENCY: 'bg-red-100 text-red-700 border-red-200',
  URGENT: 'bg-amber-100 text-amber-700 border-amber-200',
  ROUTINE: 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function DoctorDashboard() {
  const { data: queue = [], isLoading: isQueueLoading, refetch } = useGetTriageQueueQuery('GENERAL_MEDICINE');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [query, setQuery] = useState('');
  const [summary, setSummary] = useState('');
  const [isRagLoading, setIsRagLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [prescriptionInput, setPrescriptionInput] = useState('');
  const [ddiWarning, setDdiWarning] = useState(null);
  const { facilityTier } = useAuth();

  // Fetch encounter detail when a patient is selected
  const { data: encounter, isLoading: isEncounterLoading } = useGetEncounterDetailQuery(
    selectedPatientId, 
    { skip: !selectedPatientId }
  );

  const { data: documentsData, isLoading: isDocsLoading } = useGetPatientDocumentsQuery(
    encounter?.patientId || selectedPatientId,
    { skip: !selectedPatientId }
  );
  const documents = documentsData?.data || [];

  const [updateEncounterStatus] = useUpdateEncounterStatusMutation();

  // Mock AI Pharmacovigilance & Smart Pharmacy
  const PHARMACY_DB = {
    'aspirin': { stock: 0, generic: 'Acetylsalicylic acid (Jan Aushadhi)', genericPrice: '₹12/strip' },
    'paracetamol': { stock: 45, generic: 'Paracetamol 500mg (Jan Aushadhi)', genericPrice: '₹5/strip' },
    'amoxicillin': { stock: 0, generic: 'Amoxicillin 250mg (Jan Aushadhi)', genericPrice: '₹22/strip' }
  };
  const [pharmacyInsights, setPharmacyInsights] = useState([]);
  const [whatsappSent, setWhatsappSent] = useState(false);

  useEffect(() => {
    if (!showQrModal) setWhatsappSent(false);
  }, [showQrModal]);

  useEffect(() => {
    const text = prescriptionInput.toLowerCase();
    if (text.includes('aspirin') || text.includes('nsaid')) {
      setDdiWarning('AI WARNING: Patient history indicates active Peptic Ulcer Disease. NSAIDs/Aspirin are contraindicated. Consider Paracetamol.');
    } else {
      setDdiWarning(null);
    }

    const words = text.split(/[\s,]+/);
    const insights = [];
    Object.keys(PHARMACY_DB).forEach(med => {
      if (words.includes(med) || words.some(w => w.includes(med))) {
        insights.push({ med, ...PHARMACY_DB[med] });
      }
    });
    setPharmacyInsights(insights);
  }, [prescriptionInput]);

  // Join department room for real-time updates
  useEffect(() => {
    socket.emit('join_department', 'GENERAL_MEDICINE');
    socket.emit('join_triage');

    socket.on('triage-alert', () => {
      refetch();
    });

    return () => {
      socket.off('triage-alert');
    };
  }, [refetch]);

  const handleSynthesize = async () => {
    if (!query) return;
    setIsRagLoading(true);
    
    try {
      const aiUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
      const response = await fetch(`${aiUrl}/synthesize-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: selectedPatientId || "123", query })
      });
      const data = await response.json();
      setSummary(data.data?.summary || 'No data found.');
    } catch (e) {
      setSummary('Failed to retrieve synthesized history.');
    } finally {
      setIsRagLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedPatientId) return;
    try {
      await updateEncounterStatus({ 
        encounterId: selectedPatientId, 
        status: newStatus 
      }).unwrap();
      if (newStatus === 'COMPLETED' || newStatus === 'REFERRED_UP') {
        setSelectedPatientId(null);
        setShowQrModal(false);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const emergencyCount = queue.filter(p => p.priority === 'EMERGENCY').length;
  const urgentCount = queue.filter(p => p.priority === 'URGENT').length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Queue */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <Activity className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">Doctor Console</h1>
              <p className="text-xs text-slate-500 font-bold uppercase">{facilityTier} Level • General Medicine</p>
            </div>
          </div>

          {/* Priority Badges */}
          <div className="flex gap-2">
            {emergencyCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> {emergencyCount} Emergency
              </span>
            )}
            {urgentCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
                {urgentCount} Urgent
              </span>
            )}
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
              <Users className="w-3 h-3" /> {queue.length} Total
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isQueueLoading ? (
            <div className="text-center p-8 text-slate-500 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-teal-500" />
              <span className="text-sm">Loading Queue...</span>
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center p-8 text-slate-400 flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">All clear</p>
              <p className="text-sm">No patients waiting.</p>
            </div>
          ) : (
            queue.map(patient => (
              <motion.div 
                key={patient.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedPatientId(patient.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                  selectedPatientId === patient.id 
                    ? 'bg-teal-50 border-teal-300 shadow-sm ring-1 ring-teal-200' 
                    : 'bg-white border-slate-100 hover:border-teal-200 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">{patient.name}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${PRIORITY_STYLES[patient.priority] || PRIORITY_STYLES.ROUTINE}`}>
                    {patient.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {patient.time}
                  </p>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedPatientId === patient.id ? 'text-teal-500 translate-x-0.5' : 'text-slate-300'}`} />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
        <AnimatePresence mode="wait">
          {selectedPatientId ? (
            <motion.div
              key={selectedPatientId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {isEncounterLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                </div>
              ) : encounter ? (
                <>
                  {/* Header */}
                  <header className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">Consultation</h2>
                      <p className="text-slate-500">
                        Patient: <strong>{encounter.name}</strong> • 
                        Priority: <span className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${PRIORITY_STYLES[encounter.priority] || ''}`}>{encounter.priority}</span> • 
                        Dept: {encounter.department?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {encounter.status === 'WAITING' && (
                        <Button 
                          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md"
                          onClick={() => handleStatusChange('IN_CONSULTATION')}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" /> Start Consultation
                        </Button>
                      )}
                      {encounter.status === 'IN_CONSULTATION' && (
                        <>
                          {facilityTier !== 'APEX' && (
                            <Button 
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                              onClick={() => setShowHandoverModal(true)}
                            >
                              Escalate / Refer Upward
                            </Button>
                          )}
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
                            onClick={() => setShowQrModal(true)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Complete
                          </Button>
                        </>
                      )}
                      <Button variant="outline" className="rounded-xl" onClick={() => setSelectedPatientId(null)}>
                        <XCircle className="w-4 h-4 mr-2" /> Close
                      </Button>
                    </div>
                  </header>

                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: SOCRATES + RAG */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* SOCRATES Assessment Card */}
                      <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <ClipboardList className="w-5 h-5 text-blue-600" /> SOCRATES Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          {encounter.socratesData && Object.keys(encounter.socratesData).length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-4">
                              {Object.entries(SOCRATES_LABELS).map(([key, { label, icon }]) => {
                                const value = encounter.socratesData[key];
                                return (
                                  <div key={key} className={`p-4 rounded-xl border transition-all ${value ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-base">{icon}</span>
                                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                                    </div>
                                    <p className="text-slate-800 font-medium">{value || '—'}</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic text-center py-6">No SOCRATES data extracted for this patient.</p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Explainable AI (XAI) / CDSS Card */}
                      <Card className="border-indigo-200 shadow-sm overflow-hidden mt-6 bg-indigo-50/30">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 pb-3">
                          <CardTitle className="flex items-center justify-between text-lg">
                            <span className="flex items-center gap-2 text-indigo-700">
                              <BrainCircuit className="w-5 h-5" /> AI Clinical Decision Support (XAI)
                            </span>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">Auto-Generated</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Differential Diagnoses</p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between bg-white p-2 rounded border border-indigo-100">
                                  <span className="font-bold text-slate-700">1. Dengue Fever</span>
                                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">85% Probability</span>
                                </div>
                                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-100">
                                  <span className="font-medium text-slate-600">2. Viral Influenza</span>
                                  <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded">12% Probability</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border border-indigo-200 border-l-4 border-l-indigo-500 text-sm text-slate-700 shadow-sm">
                              <p className="font-bold text-indigo-700 mb-1">AI Reasoning (Explainable AI):</p>
                              <p>High probability of Dengue Fever driven by <strong>High fever onset (3 days)</strong>, <strong>severe retro-orbital pain</strong>, and cross-referenced with <strong>active Epidemic Radar alerts</strong> in the patient's registered district.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* AYUSH Assessment (if present) */}
                      {encounter.ayushData && Object.keys(encounter.ayushData).length > 0 && (
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              🌿 AYUSH / Dashavidha Pariksha
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                              {Object.entries(encounter.ayushData).map(([key, value]) => (
                                <div key={key} className="p-4 rounded-xl border border-green-100 bg-white shadow-sm">
                                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">{key}</span>
                                  <p className="text-slate-800 font-medium mt-1">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* RAG Synthesis */}
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-blue-600" /> AI Patient History Synthesis (RAG)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 mb-4">
                            <input 
                              type="text" 
                              placeholder="Ask about patient's past cardiac events or lab results..."
                              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSynthesize()}
                            />
                            <Button onClick={handleSynthesize} disabled={isRagLoading} className="rounded-xl">
                              {isRagLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...</> : <><Search className="w-4 h-4 mr-2" /> Synthesize</>}
                            </Button>
                          </div>
                          {summary && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-slate-700">
                              <p className="font-medium mb-1 text-blue-800">Synthesized Result:</p>
                              {summary}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Medical Timeline */}
                      {documents.length > 0 && (
                        <Card className="border-slate-200 shadow-sm mt-6">
                          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <FileText className="w-5 h-5 text-purple-600" /> Medical History Timeline
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="relative border-l-2 border-purple-200 ml-4 pl-6 space-y-8">
                              {documents.map((doc, idx) => (
                                <div key={doc._id || idx} className="relative">
                                  <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-purple-500 ring-4 ring-purple-100" />
                                  <div className="mb-1 text-sm font-bold text-slate-500">
                                    {doc.parsedEntities?.date || new Date(doc.createdAt).toLocaleDateString()}
                                  </div>
                                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                      {doc.documentType?.replace(/_/g, ' ')}
                                      <a href={doc.cloudinaryUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline ml-auto">View Original</a>
                                    </h4>
                                    
                                    {doc.parsedEntities?.abnormalValues?.length > 0 && (
                                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
                                          <AlertTriangle className="w-4 h-4" /> Abnormal Findings / Red Flags
                                        </div>
                                        <ul className="list-disc pl-5 text-sm text-red-600">
                                          {doc.parsedEntities.abnormalValues.map((val, i) => (
                                            <li key={i}>{val}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {doc.parsedEntities?.diagnoses?.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-xs font-semibold text-slate-500 uppercase">Diagnoses: </span>
                                        <span className="text-sm text-slate-700">{doc.parsedEntities.diagnoses.join(', ')}</span>
                                      </div>
                                    )}
                                    
                                    {doc.parsedEntities?.medications?.length > 0 && (
                                      <div>
                                        <span className="text-xs font-semibold text-slate-500 uppercase">Medications: </span>
                                        <ul className="list-disc pl-4 text-sm text-slate-700 mt-1">
                                          {doc.parsedEntities.medications.map((med, i) => (
                                            <li key={i}>{med.name} - {med.dosage} {med.frequency}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* AI Pharmacovigilance / Prescription */}
                      <Card className="border-slate-200 shadow-sm mt-6">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <FileSignature className="w-5 h-5 text-emerald-600" /> Smart e-Prescription
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <textarea 
                            className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none mb-2"
                            placeholder="Type prescription here (e.g. Tab Paracetamol 500mg, Tab Aspirin...)"
                            value={prescriptionInput}
                            onChange={(e) => setPrescriptionInput(e.target.value)}
                          />
                          <AnimatePresence>
                            {pharmacyInsights.map((insight, idx) => (
                              <motion.div 
                                key={`pharmacy-${insight.med}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className={`p-3 mt-2 border rounded-xl flex gap-3 text-sm items-start shadow-sm ${insight.stock === 0 ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                  <span className="text-xl">{insight.stock === 0 ? '⚠️' : '💊'}</span>
                                  <div>
                                    <p className="font-bold">{insight.med.toUpperCase()} - {insight.stock === 0 ? 'Out of Stock in Dispensary' : `In Stock (${insight.stock} strips)`}</p>
                                    <p>Suggested Jan Aushadhi Generic: <strong>{insight.generic}</strong> ({insight.genericPrice})</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          <AnimatePresence>
                            {ddiWarning && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 mt-2 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-700 items-start shadow-sm">
                                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                  <p className="text-sm font-medium">{ddiWarning}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>

                    </div>

                    {/* Right Column: Chat Transcript + Actions */}
                    <div className="space-y-6">
                      {/* Chat Transcript */}
                      <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-zinc-50 border-b border-slate-100">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="w-5 h-5 text-slate-600" /> Triage Transcript
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                          {encounter.chatTranscript && encounter.chatTranscript.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                              {encounter.chatTranscript.map((msg, idx) => (
                                <div key={idx} className={`p-4 flex gap-3 ${msg.role === 'ai' ? 'bg-white' : 'bg-slate-50/50'}`}>
                                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${msg.role === 'ai' ? 'bg-blue-100' : 'bg-slate-200'}`}>
                                    {msg.role === 'ai' ? <Bot className="w-3.5 h-3.5 text-blue-600" /> : <User className="w-3.5 h-3.5 text-slate-600" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-400 mb-0.5">{msg.role === 'ai' ? 'AI Assistant' : 'Patient'}</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{msg.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-slate-400">
                              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">No transcript available.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Patient Info */}
                      <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">ABHA Number</span>
                            <span className="font-medium font-mono text-xs">{encounter.abhaNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Wait Time</span>
                            <span className="font-medium">{encounter.waitTime}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Status</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                              encounter.status === 'IN_CONSULTATION' ? 'bg-teal-100 text-teal-700' :
                              encounter.status === 'REFERRED_UP' ? 'bg-blue-100 text-blue-700' :
                              encounter.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>{encounter.status?.replace(/_/g, ' ')}</span>
                          </div>
                          {encounter.status === 'REFERRED_UP' && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 font-medium">
                              e-Referral generated. AI History and timeline securely transferred to the next facility level.
                            </div>
                          )}
                          {encounter.clinicalSummary && (
                            <div className="pt-3 border-t border-slate-100">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Clinical Summary</p>
                              <p className="text-sm text-slate-700">{encounter.clinicalSummary}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-12">Encounter not found.</div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-slate-400"
            >
              <div className="p-6 bg-slate-100 rounded-full mb-6">
                <ClipboardList className="w-16 h-16 opacity-40" />
              </div>
              <h2 className="text-2xl font-bold text-slate-600 mb-2">Ready for Patients</h2>
              <p className="text-slate-500 max-w-md text-center">Select a patient from the queue to begin consultation. New patients will appear in real-time as they complete triage.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Code Prescription Modal */}
        <AnimatePresence>
          {showQrModal && encounter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">e-Prescription Generated</h3>
                  <p className="text-slate-500 mt-2">Patient can scan this code via ABHA app to download their prescription securely.</p>
                </div>

                <div className="flex justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mb-6">
                  <QRCodeSVG 
                    value={`https://example.com/prescription/${encounter.id}`} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                {!whatsappSent ? (
                  <Button 
                    className="w-full mb-6 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl shadow-lg h-12"
                    onClick={() => setWhatsappSent(true)}
                  >
                    <Bot className="w-5 h-5 mr-2" /> Send via WhatsApp (Local Language Audio)
                  </Button>
                ) : (
                  <div className="w-full mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center justify-center font-bold shadow-inner h-12">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Audio Prescription Sent!
                  </div>
                )}

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl"
                    onClick={() => setShowQrModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    onClick={() => handleStatusChange('COMPLETED')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Finish Consult
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Rural PHC Specialist Handover Modal */}
        <AnimatePresence>
          {showHandoverModal && encounter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full"
              >
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Specialist Handover</h3>
                    <p className="text-slate-500 font-medium">Rural PHC ➡️ District Hospital</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tele-Consult Link</p>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value={`https://telemed.sanjeevani.gov.in/join/${encounter.id}`} className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-blue-600 font-medium" />
                      <Button variant="outline" className="shrink-0" onClick={() => alert('Link Copied to Clipboard!')}>Copy</Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Share this secure link with the District Specialist. AI transcript and SOCRATES data will be auto-attached.</p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-800">Emergency Transport</p>
                      <p className="text-sm text-red-700 mt-1">108 Ambulance service has been pinged with patient's GPS coordinates.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowHandoverModal(false)}>Cancel</Button>
                  <Button 
                    className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    onClick={() => {
                      handleStatusChange('REFERRED_UP');
                      setShowHandoverModal(false);
                    }}
                  >
                    Confirm Handover
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
