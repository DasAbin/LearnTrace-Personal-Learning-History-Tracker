import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../utils/api';
import type { CollegeOverview } from '../../types';
import { Users, BookOpen, GraduationCap, Building2, ArrowRight, Clock, Loader2, Database } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<CollegeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminAPI.getOverview();
        setOverview(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load college overview');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-10 w-10 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="border border-red-500/50 p-10 text-center">
          <p className="text-red-400 font-semibold tracking-widest uppercase text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Luxury Hero Section */}
      <div className="relative overflow-hidden rounded-md bg-[#0F0E0C] p-12 lg:p-16 border border-[#C9A84C]">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6 hidden md:flex">
            <Building2 className="h-6 w-6 text-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.3em]">Institutional Overview</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-serif text-[#F5F0E8] mb-6">
            Welcome, {user?.firstName}
          </h1>
          <p className="text-[#F5F0E8]/70 font-sans max-w-2xl text-lg leading-relaxed">
            {overview?.collegeName} — Access institutional telemetry, review structural cohorts, and audit registry logs across your campus infrastructure.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard icon={<Users className="h-6 w-6" />} label="Registered Scholars" value={overview?.totalStudents || 0} />
        <StatCard icon={<Building2 className="h-6 w-6" />} label="Defined Sectors" value={overview?.totalClasses || 0} />
        <StatCard icon={<BookOpen className="h-6 w-6" />} label="Archived Entries" value={overview?.totalEntries || 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        
        {/* Classes List */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-[#C9A84C]/30 pb-4">
            <h2 className="text-3xl font-serif text-[#F5F0E8]">Active Sectors</h2>
            <span className="text-xs font-semibold text-[#F5F0E8]/50 uppercase tracking-[0.2em]">{overview?.classes.length || 0} Total</span>
          </div>

          {overview?.classes && overview.classes.length > 0 ? (
            <div className="space-y-6">
              {overview.classes.map((cls) => (
                <Link
                  key={cls.className}
                  to={`/admin/classroom/${encodeURIComponent(cls.className!)}`}
                  className="group flex flex-col justify-between bg-[#0F0E0C] border border-[#C9A84C]/30 hover:border-[#C9A84C] rounded-md p-8 transition-colors duration-300"
                >
                  <div className="flex items-start justify-between mb-8">
                    <GraduationCap className="h-8 w-8 text-[#C9A84C]" />
                    <div className="h-10 w-10 border border-[#C9A84C]/30 flex items-center justify-center group-hover:bg-[#C9A84C] transition-colors rounded-sm">
                      <ArrowRight className="h-5 w-5 text-[#C9A84C] group-hover:text-[#0F0E0C]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif text-[#F5F0E8] mb-3 group-hover:text-[#C9A84C] transition-colors">{cls.className}</h3>
                    <p className="text-sm text-[#F5F0E8]/50 uppercase tracking-widest font-semibold font-sans">
                      {cls.studentCount} Registered
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center border border-[#C9A84C]/20 rounded-md">
              <Database className="h-8 w-8 text-[#C9A84C] mx-auto mb-6 opacity-50" />
              <p className="text-[#F5F0E8]/60 font-serif text-xl">No structural sectors defined.</p>
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-[#C9A84C]/30 pb-4">
            <h2 className="text-3xl font-serif text-[#F5F0E8]">Recent Additions</h2>
          </div>
          
          <div className="border border-[#C9A84C]/30 p-8 rounded-md bg-[#0F0E0C]">
            {overview?.recentStudents && overview.recentStudents.length > 0 ? (
              <div className="space-y-6">
                {overview.recentStudents.map((student) => (
                  <div key={student.id} className="group flex items-center gap-6 p-4 rounded-sm border border-transparent hover:border-[#C9A84C]/50 transition-colors">
                    <div className="h-14 w-14 border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] font-serif text-lg">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-serif text-[#F5F0E8] truncate group-hover:text-[#C9A84C] transition-colors">
                        {student.firstName} {student.lastName}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-[#F5F0E8]/50 uppercase tracking-widest font-semibold border border-[#F5F0E8]/20 px-2 py-1">
                          {student.className || 'UNASSIGNED'}
                        </span>
                        <span className="text-xs text-[#F5F0E8]/50 uppercase tracking-widest font-semibold">
                          ID: {student.rollNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-2 text-[#C9A84C]">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest">
                        {new Date(student.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-[#F5F0E8]/50 font-serif text-lg">Registry is empty.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: number;
}) {
  return (
    <div className="bg-[#0F0E0C] border border-[#C9A84C] p-10 rounded-md hover:bg-[#C9A84C]/5 transition-colors duration-300">
      <div className="h-12 w-12 border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] mb-8 rounded-sm">
        {icon}
      </div>
      <div>
        <p className="text-5xl font-serif text-[#F5F0E8] mb-3">{value.toLocaleString()}</p>
        <p className="text-xs text-[#C9A84C] font-semibold uppercase tracking-[0.2em]">{label}</p>
      </div>
    </div>
  );
}
