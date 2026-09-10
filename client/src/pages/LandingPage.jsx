import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Activity, ShieldPlus, Brain, ArrowRight, Mic, IdCard, Stethoscope } from 'lucide-react';

const FloatingOrb = () => {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} scale={2}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#0ea5e9" wireframe={true} />
    </mesh>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-sky-500/30">
      
      {/* 3D Background Canvas */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={2} color="#38bdf8" />
          <directionalLight position={[-10, -10, -10]} intensity={1} color="#818cf8" />
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
          <FloatingOrb />
        </Canvas>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between p-6 md:px-12 lg:px-24 glass-panel-dark border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/20 rounded-xl border border-sky-500/30">
            <Activity className="w-6 h-6 text-sky-400" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
            Sanjeevani AI-OS
          </span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/nurse')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Staff Login
          </button>
          <button onClick={() => navigate('/doctor')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Doctor Portal
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <motion.div 
          style={{ y, opacity }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel-dark border-sky-500/30 bg-sky-500/10 text-sky-300 mb-8 text-sm font-semibold tracking-wide uppercase">
            <ShieldPlus className="w-4 h-4" />
            Smart India Hackathon Edition
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            The Future of <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 drop-shadow-sm">
              Public Health Triage
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Empowering government hospitals with an autonomous AI-driven kiosk. Seamless ABHA integration, multilingual voice triage, and predictive disease heatmaps.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/kiosk')}
              className="group relative px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Launch Patient Kiosk
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-sky-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => navigate('/admin/heatmap')}
              className="group px-8 py-4 rounded-2xl glass-panel-dark border-white/10 hover:border-white/30 text-white font-semibold text-lg transition-all hover:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                View Disease Heatmap
              </div>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Value Props Section (Scroll Reveal) */}
      <section className="relative z-10 py-24 bg-slate-950/80 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Voice-to-Text AI", desc: "Multilingual triage allows patients to speak symptoms naturally.", color: "from-sky-400 to-blue-500", Icon: Mic },
            { title: "ABHA Linked", desc: "Securely fetch and update patient records across the national health grid.", color: "from-indigo-400 to-purple-500", Icon: IdCard },
            { title: "Rural Telemedicine", desc: "Instantly connect village kiosks to central hospital doctors via WebRTC.", color: "from-emerald-400 to-teal-500", Icon: Stethoscope },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="p-8 rounded-3xl glass-panel-dark border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className={`w-12 h-12 rounded-2xl mb-6 bg-gradient-to-br ${feature.color} opacity-80 shadow-lg flex items-center justify-center`}>
                <feature.Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}
