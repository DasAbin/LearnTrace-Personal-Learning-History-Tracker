import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, ArrowLeft, User, Mail, Lock, Loader2, Check, X, Eye, EyeOff, BookOpen, GraduationCap, Shield, Building2, Hash } from 'lucide-react';

function getPasswordStrength(password: string): { score: 0|1|2|3|4; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;
  
  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-500'];
  
  return { score: score as 0|1|2|3|4, label: labels[score], color: colors[score] };
}

export default function Signup() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [gender, setGender] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [className, setClassName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  
  const requirements = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special char', met: /[!@#$%^&*]/.test(password) },
  ];

  const canProceedStep1 = strength.score >= 2 && firstName && lastName && email;
  const canProceedStep2 = !!role;
  const canSubmit = canProceedStep1 && canProceedStep2 && collegeName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setError('');
    setLoading(true);

    try {
      await signup({
        firstName, lastName, email, password,
        role, gender: gender || undefined,
        collegeName, department: department || undefined,
        className: className || undefined,
        rollNumber: rollNumber || undefined,
      });
      navigate(role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && canProceedStep1) setStep(2);
    else if (step === 2 && canProceedStep2) setStep(3);
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left — Image Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80&auto=format"
          alt="University campus with students"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-900/50 to-amber-900/30" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">LearnTrace</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your academic journey<br />starts here.
          </h1>
          <p className="text-gray-300 text-lg font-medium max-w-md">
            Students document achievements. Counselors gain insights. Everyone grows together.
          </p>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white overflow-y-auto py-8">
        <div className="w-full max-w-[480px] mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-gray-900 text-xl font-bold">LearnTrace</span>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                  s <= step ? 'bg-amber-500' : 'bg-gray-100'
                }`} />
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {step === 1 && 'Create your account'}
              {step === 2 && 'Choose your role'}
              {step === 3 && 'College details'}
            </h2>
            <p className="mt-1.5 text-gray-500 font-medium text-sm">
              {step === 1 && 'Enter your personal information to get started'}
              {step === 2 && 'Select how you\'ll be using LearnTrace'}
              {step === 3 && 'Tell us about your institution'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="signup-form">
            {/* Step 1 — Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="signup-first-name" className="block text-sm font-semibold text-gray-700">First name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input id="signup-first-name" type="text" required value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="signup-last-name" className="block text-sm font-semibold text-gray-700">Last name</label>
                    <input id="signup-last-name" type="text" required value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="signup-email" className="block text-sm font-semibold text-gray-700">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input id="signup-email" type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="john@university.edu"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="signup-password" className="block text-sm font-semibold text-gray-700">
                    Password
                    {password && (
                      <span className={`float-right text-xs font-bold ${strength.score >= 3 ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {strength.label}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input id="signup-password" type={showPassword ? 'text' : 'password'} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="Create a strong password"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="pt-2">
                      <div className="flex gap-1 h-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i < strength.score ? strength.color : 'bg-gray-100'}`} />
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-y-1.5">
                        {requirements.map((req) => (
                          <div key={req.label} className="flex items-center space-x-1.5">
                            {req.met ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-gray-300" />
                            )}
                            <span className={`text-xs font-medium ${req.met ? 'text-gray-700' : 'text-gray-400'}`}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button type="button" onClick={nextStep} disabled={!canProceedStep1}
                  className="group w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-30 disabled:cursor-not-allowed mt-2">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            )}

            {/* Step 2 — Role Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setRole('STUDENT')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      role === 'STUDENT'
                        ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/10'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${
                      role === 'STUDENT' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Student</h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Track your courses, certifications, and learning milestones
                    </p>
                  </button>

                  <button type="button" onClick={() => setRole('ADMIN')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      role === 'ADMIN'
                        ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/10'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${
                      role === 'ADMIN' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Admin / Counselor</h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      View student progress and provide mentorship
                    </p>
                  </button>
                </div>

                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center justify-center py-3.5 px-6 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </button>
                  <button type="button" onClick={nextStep} disabled={!canProceedStep2}
                    className="group flex-1 flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-30">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — College Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="signup-college" className="block text-sm font-semibold text-gray-700">College / Institution *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <input id="signup-college" type="text" required value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="e.g. Delhi Technical University"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="signup-dept" className="block text-sm font-semibold text-gray-700">Department</label>
                    <input id="signup-dept" type="text" value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                      placeholder="Computer Science"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="signup-gender" className="block text-sm font-semibold text-gray-700">Gender</label>
                    <select id="signup-gender" value={gender} onChange={(e) => setGender(e.target.value)}
                      className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none appearance-none">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {role === 'STUDENT' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="signup-class" className="block text-sm font-semibold text-gray-700">Class / Section</label>
                      <input id="signup-class" type="text" value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                        placeholder="CS-2024-A"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="signup-roll" className="block text-sm font-semibold text-gray-700">Roll Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Hash className="h-4 w-4 text-gray-400" />
                        </div>
                        <input id="signup-roll" type="text" value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                          placeholder="2024CSE001"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex items-center justify-center py-3.5 px-6 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </button>
                  <button type="submit" disabled={loading || !canSubmit}
                    id="signup-submit"
                    className="group flex-1 flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-30 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-center text-sm font-medium text-gray-500">
              Already have an account?{' '}
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
