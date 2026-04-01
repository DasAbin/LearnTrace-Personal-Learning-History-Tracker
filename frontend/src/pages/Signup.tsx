import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, ArrowRight, User, Mail, Lock, Loader2, Check, X } from 'lucide-react';

function getPasswordStrength(password: string): { score: 0|1|2|3|4; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;
  
  const labels = ['Too weak', 'Weak', 'Good', 'Strong', 'Excellent'];
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
  
  return { 
    score: score as 0|1|2|3|4, 
    label: labels[score], 
    color: colors[score] 
  };
}

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  
  const requirements = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Upper case letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[!@#$%^&*]/.test(password) },
  ];

  const canSubmit = strength.score >= 2 && firstName && lastName && email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setError('');
    setLoading(true);

    try {
      await signup(firstName, lastName, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign up. Email might already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-amber-100 selection:text-orange-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center mb-6">
            <div className="h-14 w-14 bg-gray-900 rounded-[22px] flex items-center justify-center shadow-2xl shadow-amber-500/20">
                 <Sparkles className="h-7 w-7 text-white" />
            </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Create account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">
          Start documenting your professional evolution
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="bg-white px-10 py-12 border border-gray-100 rounded-[40px] shadow-sm sm:px-12 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-amber-50 rounded-full blur-3xl opacity-50" />
            
          <form className="space-y-6 relative" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-xs font-bold animate-in shake">
                 {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        First Name
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                        </div>
                        <input
                            id="firstName"
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all outline-none"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Last Name
                    </label>
                    <input
                        id="lastName"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-transparent rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all outline-none"
                    placeholder="you@domain.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 text-between">
                <span>Secure Password</span>
                {password && (
                  <span className={`float-right font-black uppercase text-[9px] ${strength.label === 'Excellent' ? 'text-green-500' : 'text-gray-400'}`}>
                    {strength.label}
                  </span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-transparent rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all outline-none"
                    placeholder="Create a strong password"
                />
              </div>

              {/* Strength Bar */}
              {password && (
                <div className="pt-2">
                  <div className="flex gap-1 h-1.5 px-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-full transition-all duration-500 ${i <= strength.score ? strength.color : 'bg-gray-100'}`} 
                      />
                    ))}
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-y-2 px-1">
                    {requirements.map((req) => (
                      <div key={req.label} className="flex items-center space-x-2">
                        {req.met ? (
                          <div className="bg-green-100 p-0.5 rounded-full">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-0.5 rounded-full">
                            <X className="h-3 w-3 text-gray-300" />
                          </div>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${req.met ? 'text-gray-900' : 'text-gray-300'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 active:scale-95 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
              >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                )}
              </button>
              {!canSubmit && password && (
                <p className="mt-3 text-center text-xs font-medium text-gray-400 animate-in fade-in">
                  Please complete the requirements to join
                </p>
              )}
            </div>
          </form>

          <div className="mt-10 pt-10 border-t border-gray-50">
            <p className="text-center text-sm font-medium text-gray-500">
                Already part of the network?{' '}
                <Link to="/login" className="font-bold text-amber-600 hover:text-amber-500 transition-colors">
                    Sign in
                </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
