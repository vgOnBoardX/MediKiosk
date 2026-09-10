import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-500">Loading Secure Portal...</div>;

  if (!user) {
    // If trying to access kiosk routes, redirect to ABHA login instead of staff login
    const isKioskRoute = location.pathname.startsWith('/kiosk') || location.pathname === '/triage' || location.pathname === '/scan';
    return <Navigate to={isKioskRoute ? '/kiosk/abha' : '/login'} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />; // or redirect to their respective dashboard
  }

  return children;
}
