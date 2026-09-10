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
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error("Auth fetch failed:", err);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, tier) => {
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
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error };
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
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
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
