import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { setToken, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      setToken(token);
    } else {
      navigate('/login');
    }
  }, [token, setToken, navigate]);

  useEffect(() => {
    if (token && !loading && user) {
      if (user.role === 'PATIENT') navigate('/kiosk');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else if (user.role === 'NURSE') navigate('/nurse');
      else navigate('/kiosk');
    }
  }, [user, loading, token, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center text-sky-400">
        <h2 className="text-2xl font-bold mb-4">Authentication Successful!</h2>
        <p>Redirecting to your secure dashboard...</p>
      </div>
    </div>
  );
}
