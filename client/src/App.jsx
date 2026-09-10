import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import AppLayout from "./layouts/AppLayout";

/* ── Patient / Public Pages ── */
import KioskHome       from "./pages/Kiosk/KioskHome";
import AbhaLogin       from "./pages/Kiosk/AbhaLogin";
import VitalsCapture   from "./pages/Kiosk/VitalsCapture";
import VisualTriage    from "./pages/Kiosk/VisualTriage";
import TriageChat      from "./pages/Kiosk/TriageChat";
import DocumentScanner from "./pages/Kiosk/DocumentScanner";
import TVDisplay       from "./pages/TVDisplay/TVDisplay";
import Appointments    from "./pages/Patient/Appointments";

/* ── Staff Pages ── */
import Login           from "./pages/Auth/Login";
import AuthSuccess     from "./pages/Auth/AuthSuccess";
import DoctorDashboard from "./pages/Dashboard/DoctorDashboard";
import NurseDashboard  from "./pages/Dashboard/NurseDashboard";
import AdminDashboard  from "./pages/Dashboard/AdminDashboard";
import Profile         from "./pages/Patient/Profile";

const STAFF = ['DOCTOR', 'NURSE', 'ADMIN'];

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100
        font-sans antialiased overflow-x-hidden selection:bg-sky-500 selection:text-white transition-colors duration-200">
        <Routes>

          {/* ══════════════════════════════════════════════════════
              PATIENT PORTAL — Fully public, no login needed
              This is the main entry point for patients
          ══════════════════════════════════════════════════════ */}
          <Route path="/"             element={<KioskHome />} />
          <Route path="/kiosk"        element={<KioskHome />} />
          <Route path="/kiosk/abha"   element={<AbhaLogin />} />
          <Route path="/kiosk/vitals" element={<VitalsCapture />} />
          <Route path="/kiosk/visual" element={<VisualTriage />} />
          <Route path="/triage"       element={<TriageChat />} />
          <Route path="/kiosk/triage" element={<TriageChat />} />
          <Route path="/scan"         element={<DocumentScanner />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/tv"           element={<TVDisplay />} />

          {/* ══════════════════════════════════════════════════════
              STAFF AUTH — Login/register for doctors, nurses, admins
          ══════════════════════════════════════════════════════ */}
          <Route path="/login"        element={<Login />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/unauthorized" element={
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
              <div className="text-6xl">🚫</div>
              <h1 className="text-2xl font-bold text-red-500">403 — Unauthorized Access</h1>
              <p className="text-slate-500 text-sm">You don't have permission to view this page.</p>
              <a href="/login" className="text-sky-500 hover:underline text-sm">← Back to Staff Login</a>
            </div>
          } />

          {/* ══════════════════════════════════════════════════════
              STAFF DASHBOARD — Protected, requires staff login
              All wrapped inside AppLayout (sidebar + topbar)
          ══════════════════════════════════════════════════════ */}
          <Route element={
            <ProtectedRoute allowedRoles={STAFF}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/doctor"  element={<DoctorDashboard />} />
            <Route path="/nurse"   element={<NurseDashboard />} />
            <Route path="/admin"   element={<AdminDashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all → patient kiosk */}
          <Route path="*" element={<KioskHome />} />

        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
