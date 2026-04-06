import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token.');
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await axios.post(`${API_URL}/api/v1/auth/verify-email`, { token });
        
        const { user, token: accessToken } = response.data;
        
        if (setSession && user && accessToken) {
          setSession(user, accessToken);
        }
        
        setStatus('success');
        setMessage('Your email has been verified! Redirecting to dashboard...');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message;
        
        if (errorMessage.includes('already verified')) {
          setStatus('success');
          setMessage('Email already verified! Redirecting...');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }

        setStatus('error');
        setMessage(errorMessage || 'Verification failed. The link may be expired.');
      }
    };

    verifyToken();
  }, [token, navigate, setSession]);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-gray-900 rounded-3xl flex items-center justify-center shadow-2xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <div className="bg-white px-10 py-12 border border-gray-100 rounded-[40px] shadow-sm sm:px-12 text-center animate-in fade-in slide-in-from-bottom-4">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 text-amber-500 animate-spin mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Verifying...</h2>
              <p className="text-gray-500">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Verified!</h2>
              <p className="text-gray-500">{message}</p>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-6">
                  <div className="h-full bg-green-500 animate-[progress_3s_linear_forwards]" />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Oops!</h2>
              <p className="text-red-500 font-medium">{message}</p>
              <button 
                onClick={() => navigate('/login')}
                className="mt-6 w-full py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
