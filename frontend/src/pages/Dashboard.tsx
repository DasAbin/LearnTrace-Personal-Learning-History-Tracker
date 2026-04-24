import { useState } from 'react';
import { BookOpen, Clock, Flame, Plus, ArrowUpRight, Calendar, Layers, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkeletonCard, SkeletonStat } from '../components/Skeleton';
import { LearningEntry } from '../types';
import { format } from 'date-fns';
import { useSummary, useDomainDistribution } from '../hooks/useAnalytics';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading, isError, refetch } = useSummary();
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleResendVerification = async () => {
    setVerifyLoading(true);
    try {
      await authAPI.sendVerification();
      setVerifyMsg('Verification email sent! Check your inbox.');
    } catch {
      setVerifyMsg('Could not send email. Try again from your Profile page.');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {user?.emailVerified === false && (
        <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              Please verify your email address
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Check your inbox for a verification link from LearnTrace.
              {verifyMsg && <span className="ml-2 font-semibold">{verifyMsg}</span>}
            </p>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={verifyLoading}
            className="flex-shrink-0 text-xs font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900 disabled:opacity-50 whitespace-nowrap"
          >
            {verifyLoading ? 'Sending...' : 'Resend email'}
          </button>
        </div>
      )}
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-8 lg:p-10">
        <img
          src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80&auto=format"
          alt="Study workspace"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">
              Hi, {user?.firstName || 'Learner'} 👋
            </h1>
            <p className="text-gray-400 font-medium text-lg">
              Track your achievements and keep the momentum going.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => refetch()}
              className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
            <Link
              to="/entries/new"
              className="inline-flex items-center px-5 py-3 text-sm font-bold rounded-xl text-gray-900 bg-amber-400 hover:bg-amber-300 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 group"
            >
              <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              Add Milestone
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonStat key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
            <div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl px-6 text-center">
          <div className="bg-red-50 p-4 rounded-2xl mb-6">
            <Calendar className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Couldn't load your stats</h3>
          <p className="text-gray-500 max-w-sm mb-6 text-sm">Don't worry, your progress is safe!</p>
          <button onClick={() => refetch()}
            className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
            <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Milestones" value={summary?.totalEntries || 0}
              icon={<BookOpen className="h-5 w-5" />} color="text-blue-600" bg="bg-blue-50" />
            <StatCard title="Time Invested" value={`${summary?.totalHours || 0}h`}
              icon={<Clock className="h-5 w-5" />} color="text-amber-600" bg="bg-amber-50" />
            <StatCard title="Learning Streak" value={`${summary?.streak || 0}d`}
              icon={<Flame className="h-5 w-5" />} color="text-orange-600" bg="bg-orange-50" />
            <StatCard title="Unique Skills" value={summary?.uniqueSkills || 0}
              icon={<Layers className="h-5 w-5" />} color="text-purple-600" bg="bg-purple-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Entries */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Recent Milestones</h2>
                <Link to="/timeline" className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center transition-colors group">
                  View All <ArrowUpRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>

              {summary?.recentEntries && summary.recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {summary.recentEntries.map((entry: LearningEntry, idx: number) => (
                    <Link
                      key={entry.id}
                      to={`/entries/${entry.id}`}
                      className="block bg-white p-5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md group cursor-pointer"
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 bg-gray-100 text-xs font-bold text-gray-500 rounded-md">
                              {entry.platform}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                              {format(new Date(entry.completionDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 mb-2 group-hover:text-gray-700 truncate">{entry.title}</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.skills.slice(0, 3).map((skill: string, sIdx: number) => (
                              <span key={`${entry.id}-${skill}-${sIdx}`} className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                {skill}
                              </span>
                            ))}
                            {entry.skills.length > 3 && (
                              <span className="text-[11px] text-gray-400 py-0.5">+{entry.skills.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <span className="p-2 text-gray-300 group-hover:text-amber-500 transition-colors ml-3">
                          <ArrowUpRight className="h-5 w-5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
                  <img
                    src="https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80&auto=format"
                    alt="Start learning"
                    className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 opacity-60"
                  />
                  <p className="text-gray-500 font-medium mb-4">Start documenting your learning journey</p>
                  <Link to="/entries/new"
                    className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-200 text-sm font-bold rounded-xl text-gray-900 hover:bg-gray-50 transition-all shadow-sm">
                    Log Your First Entry
                  </Link>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 bg-amber-400 h-20 w-20 rounded-full blur-3xl opacity-20" />
                <h3 className="text-lg font-bold mb-3 relative z-10">Quick Tip 💡</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 relative z-10 font-medium">
                  Upload certificates to auto-extract skills and boost your profile visibility.
                </p>
                <Link to="/entries/new" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors relative z-10">
                  Upload now →
                </Link>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
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

function StatCard({ title, value, icon, color, bg }: { title: string; value: string | number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all group">
      <div className={`h-10 w-10 ${bg} rounded-lg flex items-center justify-center ${color} mb-3 transition-transform group-hover:scale-105`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

const DOMAIN_COLORS = ['bg-gray-900', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500'];

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
            <div className="h-1.5 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!distribution || Object.keys(distribution).length === 0) {
    return <p className="text-sm text-gray-400">No domains recorded yet</p>;
  }

  const sorted = Object.entries(distribution).sort(([, a], [, b]) => b - a).slice(0, 3);
  const maxCount = Math.max(...sorted.map(([, count]) => count));

  return (
    <div className="space-y-3">
      {sorted.map(([domain, count], idx) => (
        <div key={domain}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">{domain}</span>
            <span className="text-sm font-bold text-gray-900">{count}</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className={`${DOMAIN_COLORS[idx % DOMAIN_COLORS.length]} h-full rounded-full transition-all duration-700`}
              style={{ width: `${Math.round((count / maxCount) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
