import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [facilityTier, setFacilityTier] = useState(localStorage.getItem('facilityTier') || 'PHC');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('facilityTier', facilityTier);
      fetchUser();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('facilityTier');
      localStorage.removeItem('patientProfile');
      setUser(null);
      setPatientProfile(null);
      setLoading(false);
    }
  }, [token, facilityTier]);

  // Restore patient profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('patientProfile');
    if (savedProfile) {
      try {
        setPatientProfile(JSON.parse(savedProfile));
      } catch {}
    }
  }, []);

  const fetchUser = async () => {
    try {
      // If demo token, restore cached user
      if (token && token.startsWith('demo-jwt-token-')) {
        const cached = localStorage.getItem('user');
        if (cached) {
          try { setUser(JSON.parse(cached)); return; } catch {}
        }
      }

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else if (res.status === 401 || res.status === 403) {
        setToken(null);
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.warn("Auth fetch failed (offline or server unreachable):", err);
      // If server unreachable, retain cached user from localStorage
      const cached = localStorage.getItem('user');
      if (cached) {
        try { setUser(JSON.parse(cached)); } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, tier) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setFacilityTier(tier || 'PHC');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Invalid email or password.' };
    } catch (err) {
      console.warn("Backend server unreachable, activating seamless offline session:", err);
      // Demo / Offline fallback when backend is unreachable (e.g. on Vercel showcase)
      const isDoctor = email.toLowerCase().includes('doctor');
      const isNurse = email.toLowerCase().includes('nurse');
      const isAdmin = email.toLowerCase().includes('admin');
      const role = isDoctor ? 'DOCTOR' : (isNurse ? 'NURSE' : (isAdmin ? 'ADMIN' : 'DOCTOR'));

      const fallbackUser = {
        id: 'user-' + Date.now(),
        name: isDoctor ? 'Dr. Priya Sharma' : (isNurse ? 'Sister Priya' : (isAdmin ? 'Super Admin' : (email.split('@')[0] || 'Medical Officer'))),
        email: email || 'doctor@hospital.gov.in',
        role: role
      };
      const fallbackToken = 'demo-jwt-token-' + Date.now();

      setToken(fallbackToken);
      setFacilityTier(tier || 'PHC');
      setUser(fallbackUser);
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      return { success: true, user: fallbackUser, isDemo: true };
    }
  };

  const register = async (email, password, name, role, tier) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role: role || 'JUNIOR_DOCTOR' })
      });
      const data = await res.json();
      if (res.ok) {
        // Auto-login after registration
        return await login(email, password, tier);
      }
      return { success: false, error: data.error || 'Registration failed.' };
    } catch (err) {
      console.warn("Backend server unreachable during registration, activating offline session:", err);
      // Offline fallback: allow immediate entry
      const fallbackUser = {
        id: 'user-' + Date.now(),
        name: name || 'Medical Officer',
        email: email,
        role: role || 'DOCTOR'
      };
      const fallbackToken = 'demo-jwt-token-' + Date.now();

      setToken(fallbackToken);
      setFacilityTier(tier || 'PHC');
      setUser(fallbackUser);
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      return { success: true, user: fallbackUser, isDemo: true };
    }
  };

  /**
   * ABHA-based kiosk login — authenticates patient by ABHA number (no password).
   * Returns JWT token and creates/updates PatientProfile on the backend.
   */
  const abhaLogin = async (abhaNumber, patientName) => {
    try {
      const res = await fetch(`${API_URL}/auth/abha-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaNumber, patientName })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        if (data.profile) {
          setPatientProfile(data.profile);
          localStorage.setItem('patientProfile', JSON.stringify(data.profile));
        }
        return { success: true, user: data.user, profile: data.profile };
      }
      return { success: false, error: data.error };
    } catch (err) {
      console.error("ABHA login failed:", err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setToken(null);
    setPatientProfile(null);
    localStorage.removeItem('patientProfile');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, patientProfile, facilityTier, token, setToken, loading, login, register, abhaLogin, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
