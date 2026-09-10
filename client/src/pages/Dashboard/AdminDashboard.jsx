import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, ShieldAlert, Map, AlertTriangle, TrendingUp, Users, Bug, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data for the Radar
const MOCK_OUTBREAKS = [
  { id: 1, region: 'North District', disease: 'Dengue Fever', cases: 142, trend: '+15%', status: 'CRITICAL', coords: { x: 30, y: 40 } },
  { id: 2, region: 'East Ward', disease: 'Acute Gastroenteritis', cases: 89, trend: '+5%', status: 'WARNING', coords: { x: 70, y: 30 } },
  { id: 3, region: 'South Block', disease: 'Viral Conjunctivitis', cases: 210, trend: '-2%', status: 'MONITORING', coords: { x: 50, y: 70 } },
  { id: 4, region: 'West Zone', disease: 'Malaria', cases: 45, trend: '+20%', status: 'WARNING', coords: { x: 20, y: 60 } },
];

const PATIENT_FLOW_DATA = [
  { time: '08:00', patients: 120, waitTime: 15 },
  { time: '10:00', patients: 250, waitTime: 25 },
  { time: '12:00', patients: 380, waitTime: 45 },
  { time: '14:00', patients: 310, waitTime: 30 },
  { time: '16:00', patients: 190, waitTime: 20 },
  { time: '18:00', patients: 220, waitTime: 22 },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('radar');

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldAlert className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Sanjeevani</h1>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('radar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'radar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" /> Outbreak Radar
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" /> Patient Flow Analytics
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'map' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Map className="w-5 h-5" /> Geographic View
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white">
              {activeTab === 'analytics' ? 'Analytics Dashboard' : 'Epidemic Outbreak Radar'}
            </h2>
            <p className="text-slate-400 mt-1">
              {activeTab === 'analytics' ? 'Real-time patient throughput and system load.' : 'Real-time syndromic surveillance based on AI triage data.'}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> System Online
            </div>
            {activeTab === 'radar' && (
              <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2 text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Feed Active
              </div>
            )}
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Stats Column */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Total Detected Anomalies</p>
                    <h3 className="text-4xl font-bold text-white">486</h3>
                  </div>
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">High Risk Zones</p>
                    <h3 className="text-4xl font-bold text-white">2</h3>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 text-white border-t-4 border-t-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bug className="w-5 h-5 text-red-400" /> Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_OUTBREAKS.filter(o => o.status === 'CRITICAL').map(o => (
                    <div key={o.id} className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <h4 className="font-bold text-red-400">{o.disease} Spike</h4>
                      <p className="text-sm text-slate-300 mt-1">{o.cases} cases reported in {o.region} in the last 48 hours. {o.trend} increase.</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dynamic Main View */}
          <div className="lg:col-span-2">
            {activeTab === 'analytics' ? (
              <Card className="bg-slate-900 border-slate-800 h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Patient Flow & Wait Times</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PATIENT_FLOW_DATA}>
                      <defs>
                        <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="patients" stroke="#6366f1" fillOpacity={1} fill="url(#colorPatients)" name="Patient Count" />
                      <Area type="monotone" dataKey="waitTime" stroke="#ef4444" fillOpacity={1} fill="url(#colorWait)" name="Avg Wait Time (mins)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-900 border-slate-800 h-[600px] overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                
                {/* Radar Sweeper */}
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-500/20 pointer-events-none origin-center"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(99, 102, 241, 0.1) 360deg)'
                  }}
                />
                
                {/* Grid Lines */}
                <div className="absolute inset-0 border-[0.5px] border-slate-800/50" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <CardContent className="relative h-full w-full p-0">
                  {MOCK_OUTBREAKS.map((outbreak, i) => (
                    <motion.div
                      key={outbreak.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.2 }}
                      className="absolute group cursor-pointer"
                      style={{ left: `${outbreak.coords.x}%`, top: `${outbreak.coords.y}%` }}
                    >
                      <div className="relative">
                        {/* Pulse */}
                        <div className={`absolute -inset-4 rounded-full opacity-50 animate-ping ${
                          outbreak.status === 'CRITICAL' ? 'bg-red-500' : 
                          outbreak.status === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        
                        {/* Dot */}
                        <div className={`relative w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] ${
                          outbreak.status === 'CRITICAL' ? 'bg-red-500' : 
                          outbreak.status === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />

                        {/* Tooltip */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity w-48 z-10 pointer-events-none">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{outbreak.region}</p>
                          <p className={`font-bold ${
                            outbreak.status === 'CRITICAL' ? 'text-red-400' : 
                            outbreak.status === 'WARNING' ? 'text-amber-400' : 'text-blue-400'
                          }`}>{outbreak.disease}</p>
                          <div className="flex justify-between items-center mt-2 text-sm text-slate-300">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {outbreak.cases}</span>
                            <span className="flex items-center gap-1 text-red-400"><TrendingUp className="w-3 h-3"/> {outbreak.trend}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
