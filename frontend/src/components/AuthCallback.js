import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const { setGoogleUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from URL hash
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        navigate('/welcome');
        return;
      }

      try {
        // Exchange session_id for session_token
        const response = await api.post('/auth/session', { session_id: sessionId });
        
        // Set user in context
        setGoogleUser(response.data);
        
        // Clear the hash and navigate to dashboard
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/dashboard', { replace: true, state: { user: response.data } });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/welcome');
      }
    };

    processAuth();
  }, [navigate, setGoogleUser]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">جاري تسجيل الدخول...</p>
      </div>
    </div>
  );
}
