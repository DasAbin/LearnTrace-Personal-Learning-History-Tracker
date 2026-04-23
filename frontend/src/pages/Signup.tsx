import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight, ArrowLeft, User, Mail, Lock, Loader2, Check, X,
  Eye, EyeOff, BookOpen, GraduationCap, Shield, Building2, Hash,
  Users, BookMarked, ClipboardCheck
} from 'lucide-react';

type Role = 'STUDENT' | 'TEACHER' | 'HOD' | 'ADMIN' | 'VAC_INCHARGE';

function getPasswordStrength(pw: string): { score: 0|1|2|3|4; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[!@#$%^&*]/.test(pw)) score++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
  const colors  = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-500'];
  return { score: score as 0|1|2|3|4, label: labels[score], color: colors[score] };
}

const YEAR_OPTIONS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

const ROLE_CONFIG: Record<Role, { icon: any; title: string; desc: string }> = {
  STUDENT: {
    icon: GraduationCap,
    title: 'Student',
    desc: 'Track your courses, certifications, and learning milestones',
  },
  TEACHER: {
    icon: BookMarked,
    title: 'Teacher',
    desc: 'Manage and monitor one assigned class of students',
  },
  HOD: {
    icon: Users,
    title: 'HOD',
    desc: 'Head of Department — view all classes in your department',
  },
  ADMIN: {
    icon: Shield,
    title: 'Admin',
    desc: 'Full access — view all classes across the college',
  },
  VAC_INCHARGE: {
    icon: ClipboardCheck,
    title: 'VAC Incharge',
    desc: 'Review and approve student VAC course refund requests',
  },
};

export default function Signup() {
  const [step, setStep] = useState(1);

  // Step 1 — personal
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — role
  const [role, setRole] = useState<Role>('STUDENT');
  const [gender, setGender] = useState('');

  // Step 3 — college details
  // Pre-filled defaults for AIT
  const [collegeName,   setCollegeName]   = useState('Army Institute of Technology');
  const [department,    setDepartment]    = useState('Computer Engineering');
  const [className,     setClassName]     = useState('');
  const [rollNumber,    setRollNumber]    = useState('');
  const [yearOfStudy,   setYearOfStudy]   = useState('');
  const [assignedClass, setAssignedClass] = useState('');

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate   = useNavigate();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const requirements = [
    { label: '8+ characters',   met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number',           met: /[0-9]/.test(password) },
    { label: 'Special char',     met: /[!@#$%^&*]/.test(password) },
  ];

  const canStep1 = strength.score >= 2 && !!firstName && !!lastName && !!email;
  const canStep2 = !!role;
  const canSubmit = canStep1 && canStep2 && !!collegeName;

  const nextStep = () => {
    if (step === 1 && canStep1) setStep(2);
    else if (step === 2 && canStep2) setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await signup({
        firstName, lastName, email, password,
        role,
        gender:       gender || undefined,
        collegeName,
        department:   department || undefined,
        className:    role === 'STUDENT' ? (className || undefined) : undefined,
        rollNumber:   role === 'STUDENT' ? (rollNumber || undefined) : undefined,
        yearOfStudy:  role === 'STUDENT' ? (yearOfStudy || undefined) : undefined,
        assignedClass:role === 'TEACHER' ? (assignedClass || undefined) : undefined,
      });
      // Redirect to dashboard; banner about email verification shown there
      const dest = role === 'VAC_INCHARGE'
        ? '/vac/requests'
        : (role === 'ADMIN' || role === 'HOD' || role === 'TEACHER')
          ? '/admin/dashboard'
          : '/dashboard';
      navigate(dest);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to sign up'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80&auto=format"
          alt="Campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-900/50 to-amber-900/30" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold">LearnTrace</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your academic journey<br />starts here.
          </h1>
          <p className="text-gray-300 text-lg font-medium max-w-md">
            Students document achievements. Teachers gain insights. Everyone grows together.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white overflow-y-auto py-8">
        <div className="w-full max-w-[480px] mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-gray-900 text-xl font-bold">LearnTrace</span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${s <= step ? 'bg-amber-500' : 'bg-gray-100'}`} />
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {step === 1 && 'Create your account'}
              {step === 2 && 'Choose your role'}
              {step === 3 && 'Institution details'}
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

          <form onSubmit={handleSubmit}>
            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">First name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input type="text" required value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Aryan"
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Last name</label>
                    <input type="text" required value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Singh"
                      className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="aryan@ait.edu"
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                    {password && (
                      <span className={`float-right text-xs font-bold ${strength.score >= 3 ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {strength.label}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input type={showPassword ? 'text' : 'password'} required value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none" />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="pt-2">
                      <div className="flex gap-1 h-1">
                        {[0,1,2,3].map(i => (
                          <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i < strength.score ? strength.color : 'bg-gray-100'}`} />
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-y-1.5">
                        {requirements.map(req => (
                          <div key={req.label} className="flex items-center space-x-1.5">
                            {req.met ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-gray-300" />}
                            <span className={`text-xs font-medium ${req.met ? 'text-gray-700' : 'text-gray-400'}`}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button type="button" onClick={nextStep} disabled={!canStep1}
                  className="group w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-30 disabled:cursor-not-allowed mt-2">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            )}

            {/* ── STEP 2 — Role ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(ROLE_CONFIG) as Role[]).map(r => {
                    const cfg = ROLE_CONFIG[r];
                    const Icon = cfg.icon;
                    const active = role === r;
                    return (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all ${
                          active
                            ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/10'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-3 ${active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{cfg.title}</h3>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{cfg.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Gender dropdown — common for all roles */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Gender (optional)</label>
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none appearance-none">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center justify-center py-3.5 px-6 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </button>
                  <button type="button" onClick={nextStep} disabled={!canStep2}
                    className="group flex-1 flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-30">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 — College Details ── */}
            {step === 3 && (
              <div className="space-y-4">
                {/* College — pre-filled, still editable */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    College / Institution <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input type="text" required value={collegeName}
                      onChange={e => setCollegeName(e.target.value)}
                      placeholder="Army Institute of Technology"
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none" />
                  </div>
                </div>

                {/* Department — pre-filled */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Department</label>
                  <input type="text" value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="Computer Engineering"
                    className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none" />
                </div>

                {/* STUDENT-only fields */}
                {role === 'STUDENT' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Year of Study</label>
                        <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}
                          className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none appearance-none">
                          <option value="">Select year</option>
                          {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Class / Section</label>
                        <input type="text" value={className}
                          onChange={e => setClassName(e.target.value)}
                          placeholder="Comp A"
                          className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Roll Number</label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input type="text" value={rollNumber}
                          onChange={e => setRollNumber(e.target.value)}
                          placeholder="3211"
                          className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none" />
                      </div>
                    </div>
                  </>
                )}

                {/* TEACHER-only: their ONE assigned class */}
                {role === 'TEACHER' && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      Assigned Class <span className="text-xs font-normal text-gray-400">(the class you manage)</span>
                    </label>
                    <input type="text" value={assignedClass}
                      onChange={e => setAssignedClass(e.target.value)}
                      placeholder="Comp A"
                      className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none" />
                    <p className="text-xs text-amber-600 font-medium mt-1">
                      As a Teacher you will only see students in this class.
                    </p>
                  </div>
                )}

                {/* HOD info message */}
                {role === 'HOD' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-blue-800">
                      As HOD you will see all classes within your department.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Make sure the Department field above matches exactly what students use when signing up.
                    </p>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800">
                    📧 A verification email will be sent to <strong>{email}</strong> after you create your account.
                  </p>
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex items-center justify-center py-3.5 px-6 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </button>
                  <button type="submit" disabled={loading || !canSubmit}
                    className="group flex-1 flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-30 disabled:cursor-not-allowed">
                    {loading
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : <>Create Account <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                    }
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
