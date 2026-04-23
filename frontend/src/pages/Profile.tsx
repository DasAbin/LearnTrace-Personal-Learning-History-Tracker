import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Download, LogOut, User as UserIcon, Mail, Shield, Database,
  Activity, Trophy, Code, Info, Trash2, AlertTriangle, Lock,
  Eye, EyeOff, CheckCircle2, Building2, GraduationCap, BookOpen,
  Users, FileCheck, Briefcase
} from 'lucide-react';
import { analyticsAPI, userAPI, authAPI } from '../utils/api';
import { DashboardSummary } from '../types';

type Role = 'STUDENT' | 'TEACHER' | 'HOD' | 'ADMIN' | 'VAC_INCHARGE';

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  HOD: 'Head of Department',
  ADMIN: 'Administrator',
  VAC_INCHARGE: 'VAC Incharge',
};

const ROLE_COLORS: Record<Role, string> = {
  STUDENT: 'bg-blue-50 text-blue-700 border border-blue-100',
  TEACHER: 'bg-amber-50 text-amber-700 border border-amber-100',
  HOD: 'bg-amber-50 text-amber-700 border border-amber-100',
  ADMIN: 'bg-gray-900 text-white',
  VAC_INCHARGE: 'bg-amber-50 text-amber-700 border border-amber-100',
};

export default function Profile() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');

  const isStudent = user?.role === 'STUDENT';
  const isVacIncharge = user?.role === 'VAC_INCHARGE';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'HOD' || user?.role === 'TEACHER';

  useEffect(() => {
    if (user && isStudent) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const data = await analyticsAPI.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load profile data', error);
    }
  };

  const handleExport = async (formatType: 'json' | 'csv') => {
    setExporting(formatType);
    try {
      await userAPI.exportData(formatType);
    } catch (error) {
      console.error('Failed to export data', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPw !== confirmPw) { setPwError('New passwords do not match'); return; }
    const pwRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!pwRegex.test(newPw)) {
      setPwError('Password must be 8+ chars with uppercase, number, and special character');
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword(currentPw, newPw);
      setPwSuccess('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setChangingPw(false);
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      await authAPI.sendVerification();
      setVerifyMsg('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setVerifyMsg(err.response?.data?.error || 'Failed to send verification email');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure? This action is permanent and all your data will be deleted forever.')) return;
    setIsDeleting(true);
    try {
      await userAPI.deleteProfile();
      logout();
    } catch (error) {
      alert('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  const role = user.role as Role;

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-[#1C1917] tracking-tight">Account</h1>
        <p className="text-gray-500 mt-2 font-medium">Manage your profile and security settings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* ── Identity Card ── */}
          <section className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 pointer-events-none">
              <UserIcon size={200} />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 relative">
              <div className={`h-24 w-24 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-xl flex-shrink-0 ${isStaff || isVacIncharge ? 'bg-amber-500 shadow-amber-500/20' : 'bg-gray-900'}`}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#1C1917]">{user.firstName} {user.lastName}</h2>
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[role]}`}>
                    {role === 'ADMIN' && <Shield className="h-3 w-3" />}
                    {role === 'HOD' && <Briefcase className="h-3 w-3" />}
                    {role === 'TEACHER' && <GraduationCap className="h-3 w-3" />}
                    {role === 'VAC_INCHARGE' && <FileCheck className="h-3 w-3" />}
                    {role === 'STUDENT' && <BookOpen className="h-3 w-3" />}
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Role-Specific Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 pt-10 border-t border-gray-50">
              {isStudent ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="h-3 w-3" /> Activity Streak
                    </span>
                    <p className="text-xl font-bold text-[#1C1917]">{summary?.streak || 0} Days</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Trophy className="h-3 w-3" /> Milestones
                    </span>
                    <p className="text-xl font-bold text-[#1C1917]">{summary?.totalEntries || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Code className="h-3 w-3" /> Skill Depth
                    </span>
                    <p className="text-xl font-bold text-[#1C1917]">{summary?.uniqueSkills || 0} Areas</p>
                  </div>
                </>
              ) : isVacIncharge ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <FileCheck className="h-3 w-3" /> Role
                    </span>
                    <p className="text-xl font-bold text-[#1C1917]">VAC Incharge</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="h-3 w-3" /> Institution
                    </span>
                    <p className="text-xl font-bold text-[#1C1917] truncate">{user.collegeName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Shield className="h-3 w-3" /> Access
                    </span>
                    <p className="text-xl font-bold text-[#1C1917]">VAC Requests</p>
                  </div>
                </>
              ) : (
                /* HOD / TEACHER / ADMIN */
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="h-3 w-3" /> Institution
                    </span>
                    <p className="text-xl font-bold text-[#1C1917] truncate">{user.collegeName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap className="h-3 w-3" /> Department
                    </span>
                    <p className="text-xl font-bold text-[#1C1917] truncate">{user.department || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      {role === 'ADMIN' ? 'Access' : 'Assigned Class'}
                    </span>
                    <p className="text-xl font-bold text-[#1C1917]">
                      {role === 'ADMIN' ? 'Full Admin' : (user.assignedClass || '—')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ── Security Section ── */}
          <section className="bg-gray-50 rounded-[32px] p-10 border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-[#1C1917] shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1C1917]">Security</h2>
                <p className="text-xs text-gray-500 font-medium">Manage your password and account access.</p>
              </div>
            </div>

            {/* Email verification */}
            {user.emailVerified === false ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <p className="text-sm font-bold text-amber-800 mb-1">Email not verified</p>
                <p className="text-xs text-amber-700 mb-3">Verify your email to secure your account.</p>
                {verifyMsg && <p className="text-xs font-semibold text-amber-900 mb-2">{verifyMsg}</p>}
                <button
                  onClick={handleResendVerification}
                  disabled={verifyLoading}
                  className="text-xs font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900 disabled:opacity-50"
                >
                  {verifyLoading ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3 border border-emerald-100 mb-6">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-bold text-emerald-700">Email verified</span>
              </div>
            )}

            {/* Change Password */}
            {!changingPw ? (
              <button
                onClick={() => { setChangingPw(true); setPwError(''); setPwSuccess(''); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all text-sm"
              >
                <Lock className="h-4 w-4" />
                Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <p className="text-sm font-bold text-gray-800">Change Password</p>
                {pwError && <p className="text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-xl">{pwError}</p>}
                {pwSuccess && <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-3 rounded-xl">{pwSuccess}</p>}

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    placeholder="Current password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    required
                    className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400">
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="New password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    required
                    className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400">
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  required
                  className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                />

                <p className="text-[10px] text-gray-400 font-medium">
                  Must be 8+ chars with 1 uppercase, 1 number, 1 special character.
                </p>

                <div className="flex gap-2 pt-1">
                  <button type="button"
                    onClick={() => { setChangingPw(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError(''); }}
                    className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={pwLoading}
                    className="flex-1 py-3 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-all disabled:opacity-50">
                    {pwLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* ── Data Management (Students only) ── */}
          {isStudent && (
            <section className="bg-gray-50 rounded-[32px] p-10 border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-[#1C1917] shadow-sm">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1C1917]">Data Management</h2>
                  <p className="text-xs text-gray-500 font-medium">Your learning history belongs to you.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#1C1917]">Archive Locally</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Download your entire learning history in standard portable formats.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleExport('json')}
                    disabled={!!exporting}
                    className="w-full flex items-center justify-between px-6 py-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all group disabled:opacity-50"
                  >
                    <span className="text-sm font-bold text-gray-700">Export as JSON</span>
                    {exporting === 'json'
                      ? <span className="h-4 w-4 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
                      : <Download className="h-4 w-4 text-gray-300 group-hover:text-amber-600 transition-colors" />}
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={!!exporting}
                    className="w-full flex items-center justify-between px-6 py-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all group disabled:opacity-50"
                  >
                    <span className="text-sm font-bold text-gray-700">Export as CSV</span>
                    {exporting === 'csv'
                      ? <span className="h-4 w-4 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
                      : <Download className="h-4 w-4 text-gray-300 group-hover:text-amber-600 transition-colors" />}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <aside className="space-y-8">
          {/* Session & Logout */}
          <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Session</h3>

            <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-700">Active Session</span>
            </div>

            {/* Role info card for staff */}
            {!isStudent && (
              <div className="p-4 bg-amber-50 rounded-2xl flex items-center gap-3 border border-amber-100">
                <div className="h-8 w-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {role === 'ADMIN' && <Shield className="h-4 w-4 text-amber-700" />}
                  {role === 'HOD' && <Briefcase className="h-4 w-4 text-amber-700" />}
                  {role === 'TEACHER' && <GraduationCap className="h-4 w-4 text-amber-700" />}
                  {role === 'VAC_INCHARGE' && <FileCheck className="h-4 w-4 text-amber-700" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">{ROLE_LABELS[role]}</p>
                  <p className="text-[10px] text-amber-700 font-medium">Staff Account</p>
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100" />

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/30 rounded-[32px] border border-red-100 p-8 space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Danger Zone</h3>
            </div>
            <p className="text-xs text-red-800/60 leading-relaxed font-medium">
              Permanently delete your account and all your data. This action is irreversible.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-red-200 text-red-600 font-bold rounded-2xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 disabled:opacity-50 group"
            >
              {isDeleting
                ? <span className="h-4 w-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                : <>
                  <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Delete Account
                </>}
            </button>
          </div>

          {/* Info card */}
          <div className="p-8 bg-gray-900 bg-gradient-to-br from-orange-900 to-gray-900 rounded-[32px] text-white shadow-xl shadow-orange-500/10 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <Info className="h-6 w-6 mb-4 opacity-50" />
              <p className="text-sm font-bold mb-2">
                {isStudent ? 'Learning Tip' : 'Platform Tip'}
              </p>
              <p className="text-xs text-amber-100/80 leading-relaxed">
                {isStudent
                  ? 'LearnTrace automatically calculates your learning velocity based on your completion dates. Keep logging to improve your accuracy!'
                  : 'As a staff member, you can access classroom data and student learning reports from the navigation sidebar.'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
