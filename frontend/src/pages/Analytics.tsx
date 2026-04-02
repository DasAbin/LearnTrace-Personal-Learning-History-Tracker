import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { analyticsAPI } from '../utils/api';
import { PieChart as PieIcon, TrendingUp, Cpu, Award, AlertCircle, RefreshCcw } from 'lucide-react';
import { SkeletonChart } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

const COLORS = ['#F59E0B', '#F97316', '#FBBF24', '#EA580C', '#D97706', '#FB923C', '#92400E', '#FED7AA'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900">{payload[0].value} Entries</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState({
    domains: [] as any[],
    trend: [] as any[],
    platforms: [] as any[],
    skills: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [domains, trend, platforms, skills] = await Promise.all([
        analyticsAPI.getDomainDistribution(),
        analyticsAPI.getYearlyTrend(),
        analyticsAPI.getPlatformUsage(),
        analyticsAPI.getSkillsFrequency(),
      ]);

      setAnalyticsData({
        domains: Object.entries(domains).map(([name, value]) => ({ name, value })),
        trend: Object.entries(trend).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value })),
        platforms: Object.entries(platforms).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value })),
        skills: Object.entries(skills).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value })),
      });
    } catch (error) {
      console.error('Failed to load analytics', error);
      setError('Unable to aggregate your learning data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
             <header className="mb-12">
                <div className="h-10 bg-gray-100 animate-pulse rounded-xl w-48 mb-4" />
                <div className="h-4 bg-gray-100 animate-pulse rounded-lg w-64" />
             </header>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SkeletonChart />
                <SkeletonChart />
             </div>
             <SkeletonChart />
        </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6">
        <div className="h-20 w-20 bg-red-50 rounded-[30px] flex items-center justify-center text-red-500 mx-auto border border-red-100 shadow-sm">
            <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Analytics Failed</h2>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">{error}</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center justify-center gap-2 mx-auto bg-gray-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry Aggregation
        </button>
      </div>
    );
  }

  const isEmpty = analyticsData.domains.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
          icon="📊"
          title="No data points yet"
          description="Continue your education journey to see deep insights into your growth, platform usage, and skill velocity."
          actionLabel="Log a new milestone"
          actionHref="/entries/new"
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-gray-500 mt-2 font-medium">Deep insights into your learning velocity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Domain Mix */}
        <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-gray-900">Domain Distribution</h2>
                    <p className="text-xs text-gray-500 font-medium">Topic-wise breakout of activities</p>
                </div>
                <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <PieIcon className="h-5 w-5" />
                </div>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={analyticsData.domains}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                        >
                            {analyticsData.domains.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
                {analyticsData.domains.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{d.name}</span>
                    </div>
                ))}
            </div>
        </section>

        {/* Platform Split */}
        <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-gray-900">Platform Usage</h2>
                    <p className="text-xs text-gray-500 font-medium">Where you spend your time</p>
                </div>
                <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <Award className="h-5 w-5" />
                </div>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.platforms} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#6b7280' }} width={80} />
                        <Tooltip cursor={{ fill: '#f9fafb' }} content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#F97316" radius={[0, 8, 8, 0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* Learning Trend */}
        <section className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-gray-900">Learning Velocity</h2>
                    <p className="text-xs text-gray-500 font-medium">Milestones completed over time</p>
                </div>
                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                </div>
            </div>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.trend}>
                        <defs>
                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* Top Skills */}
        <section className="lg:col-span-2 bg-gray-900 rounded-3xl p-10 text-white shadow-xl shadow-gray-200">
            <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold">Skill Frequency</h2>
                    <p className="text-xs text-amber-500 font-bold uppercase tracking-widest">Most frequently tagged competencies</p>
                </div>
                <Cpu className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.skills}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
      </div>
    </div>
  );
}
