import { useState } from 'react';
import { BookOpen, Clock, Flame, Plus, ArrowUpRight, Calendar, Layers, AlertCircle, RefreshCcw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkeletonCard, SkeletonStat } from '../components/Skeleton';
import { LearningEntry } from '../types';
import { format } from 'date-fns';

import { useSummary, useDomainDistribution } from '../hooks/useAnalytics';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading, isError, refetch } = useSummary();
  const { show: toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const loadSummary = () => refetch();

  const handleResend = async () => {
    try {
      setIsResending(true);
      const res = await authAPI.resendVerification();
      const verificationUrl = `${window.location.origin}/verify-email?token=${res.token}`;
      console.log('✅ [DEV ONLY] Verification Link:', verificationUrl);
      
      // We show a toast that specifically prompts the user to check their console, 
      // since we aren't hooking up a real email provider like SendGrid for this local demo.
      toast('Verification token generated! Check browser console for the link to test it.', 'success');
    } catch (error: any) {
      toast(error.response?.data?.error || 'Failed to resend verification link', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {user && !user.emailVerified && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-[32px] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm shadow-amber-200/20">
          <div className="flex items-center space-x-4">
            <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
               <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Action Required</p>
              <p className="text-sm font-medium text-amber-700 max-w-md">Please verify your email address to unlock all LearnTrace features and ensure account security.</p>
            </div>
          </div>
          <button 
            onClick={handleResend}
            disabled={isResending}
            className="whitespace-nowrap text-xs font-bold text-amber-700 bg-white border border-amber-200 px-6 py-3 rounded-2xl hover:bg-amber-100 active:scale-95 transition-all shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
            ) : (
                'Resend Email'
            )}
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Hi, {user?.firstName || 'Learner'} <span className="inline-block animate-bounce-slow">🚀</span>
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            You've gained some serious momentum today.
          </p>
        </div>
        <div className="flex items-center space-x-3 self-end md:self-auto">
             <button 
                onClick={loadSummary}
                className="p-3.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all active:rotate-180 duration-500"
                title="Refresh Analytics"
            >
                <RefreshCcw className="h-5 w-5" />
            </button>
            <Link
                to="/entries/new"
                className="inline-flex items-center px-6 py-3.5 border border-transparent text-sm font-bold rounded-2xl text-white bg-gray-900 hover:bg-black transition-all hover:shadow-xl hover:shadow-gray-200 active:scale-95 group"
            >
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                Add Milestone
            </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="h-[400px] bg-gray-50 rounded-[32px] animate-pulse" />
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[40px] px-6 text-center">
            <div className="bg-red-50 p-4 rounded-3xl mb-6">
                <Calendar className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics are taking a breather</h3>
            <p className="text-gray-500 max-w-sm mb-8">We couldn't load your recent stats. Don't worry, your progress is still safe!</p>
            <button 
                onClick={loadSummary}
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
            </button>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-700">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Milestones"
              value={summary?.totalEntries || 0}
              icon={<BookOpen className="h-6 w-6" />}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              title="Time Invested"
              value={`${summary?.totalHours || 0}h`}
              icon={<Clock className="h-6 w-6" />}
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <StatCard
              title="Learning Streak"
              value={`${summary?.streak || 0}d`}
              icon={<Flame className="h-6 w-6" />}
              color="text-orange-600"
              bg="bg-orange-50"
            />
            <StatCard
              title="Unique Skills"
              value={summary?.uniqueSkills || 0}
              icon={<Layers className="h-6 w-6" />}
              color="text-purple-600"
              bg="bg-purple-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Recent Entries */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Milestones</h2>
                <Link to="/timeline" className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center transition-colors group">
                  View Full Evolution
                  <ArrowUpRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>

              {summary?.recentEntries && summary.recentEntries.length > 0 ? (
                <div className="space-y-4">
                    {summary.recentEntries.map((entry: LearningEntry, idx: number) => (
                    <div 
                        key={entry.id} 
                        className="bg-white p-6 rounded-[28px] border border-gray-100 hover:border-gray-200 transition-all hover:shadow-xl hover:shadow-gray-50 group animate-in slide-in-from-bottom-4 duration-500"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center space-x-2 mb-2">
                                <span className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest rounded-full">
                                    {entry.platform}
                                </span>
                                <span className="text-[10px] font-bold text-gray-300 uppercase">
                                    {format(new Date(entry.completionDate), 'MMM d, yyyy')}
                                </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-black transition-colors">{entry.title}</h3>
                                <div className="flex flex-wrap gap-2">
                                {entry.skills.slice(0, 3).map((skill: string) => (
                                    <span key={skill} className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                                    #{skill}
                                    </span>
                                ))}
                                {entry.skills.length > 3 && (
                                    <span className="text-xs font-medium text-gray-400 py-1">+{entry.skills.length - 3} more</span>
                                )}
                                </div>
                            </div>
                            <Link 
                                to={`/entries/${entry.id}`}
                                className="p-2 text-gray-300 hover:text-gray-900 transition-colors"
                            >
                                <ArrowUpRight className="h-6 w-6" />
                            </Link>
                        </div>
                    </div>
                    ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-[40px] p-12 text-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium mb-6 italic">Your roadmap is waiting to be filled.</p>
                    <Link
                        to="/entries/new"
                        className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 text-sm font-bold rounded-2xl text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Log Your First Entry
                    </Link>
                </div>
              )}
            </div>

            {/* Sidebar / Quick Tips */}
            <div className="space-y-6">
                <div className="bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 bg-amber-400 h-24 w-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <h3 className="text-xl font-bold mb-4 relative z-10">Pro Tip 💡</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 relative z-10 font-medium">
                        Log certificates to automatically extract skills and boost your profile visibility by 40%.
                    </p>
                    <button className="text-xs font-bold text-white border border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors relative z-10">
                        Learn more
                    </button>
                </div>
                
                <div className="p-8 bg-white border border-gray-100 rounded-[32px] transition-all hover:bg-gray-50 group">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Focus Domains</h3>
                    <FocusDomainWidget />
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }: { title: string, value: string | number, icon: React.ReactNode, color: string, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 hover:shadow-2xl hover:shadow-gray-100 transition-all group overflow-hidden relative">
      <div className={`absolute -right-2 -bottom-2 ${bg} h-20 w-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${bg} ${color} transition-transform group-hover:scale-110 duration-500`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

const DOMAIN_COLORS = [
  'bg-gray-900',
  'bg-amber-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
];

function FocusDomainWidget() {
  const { data: distribution, isLoading } = useDomainDistribution();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-12 bg-gray-100 rounded" />
            </div>
            <div className="h-2 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!distribution || Object.keys(distribution).length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No domains recorded yet. Add your first milestone!</p>
    );
  }

  // Sort by count descending, take top 3
  const sorted = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const maxCount = Math.max(...sorted.map(([, count]) => count));

  return (
    <div className="space-y-4">
      {sorted.map(([domain, count], idx) => (
        <div key={domain} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{domain}</span>
            <span className="text-sm font-bold text-gray-900">{count} {count === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className={`${DOMAIN_COLORS[idx % DOMAIN_COLORS.length]} h-full rounded-full transition-all duration-700`}
              style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
