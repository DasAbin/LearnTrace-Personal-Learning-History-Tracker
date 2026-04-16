import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import { Users, ArrowRight, Search, Filter, BookOpen } from 'lucide-react';

interface ClassSummary {
  className: string;
  studentCount: number;
}

export default function ClassroomIndex() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await adminAPI.getClasses();
        setClasses(data);
      } catch (err) {
        console.error('Failed to load classes:', err);
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, []);

  const filteredClasses = classes.filter(cls => 
    cls.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 p-8 lg:p-12 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-blue-500/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-500 tracking-[0.2em] uppercase">Academic Management</h4>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              Classroom <span className="text-gray-500 underline decoration-amber-500/30 underline-offset-8">Intelligence</span>
            </h1>
            <p className="text-gray-400 font-medium max-w-lg mt-4">
              Access 3D visualisations of your neural nodes (students) across all registered sectors and departments.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-xl transition-all hover:bg-white/10">
             <div className="h-12 w-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/40">
               <Users className="h-6 w-6 text-amber-500" />
             </div>
             <div>
               <p className="text-2xl font-black text-white leading-none">{classes.length}</p>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total Sectors</p>
             </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-amber-500/50" />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">Initialising neural sectors...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] p-20 text-center">
          <div className="h-20 w-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No sectors found</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            We couldn't find any classrooms matching your criteria. Try adjusting your search string.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <Link
              key={cls.className}
              to={`/admin/classroom/${encodeURIComponent(cls.className)}`}
              className="group relative bg-white border border-gray-100 rounded-[2rem] p-8 transition-all hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="h-14 w-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white transition-all group-hover:bg-amber-500 group-hover:scale-110 group-hover:rotate-3">
                   <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-100">
                  <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 group-hover:text-amber-600 transition-colors">
                {cls.className}
              </h3>
              <p className="text-sm font-medium text-gray-400 mt-1">Academic Sector</p>
              
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-400" />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{cls.studentCount} Students</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>

              {/* Decorative accent */}
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="h-2 w-2 rounded-full bg-amber-500" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
