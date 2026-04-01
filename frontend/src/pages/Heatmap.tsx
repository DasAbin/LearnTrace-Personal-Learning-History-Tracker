import { useEffect, useState } from 'react';
import { analyticsAPI } from '../utils/api';
import { format, startOfYear, endOfYear, eachDayOfInterval } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export default function Heatmap() {
  const [heatmapData, setHeatmapData] = useState<Record<string, { count: number; hours: number }>>({});
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadHeatmap();
  }, []);

  const loadHeatmap = async () => {
    try {
      const data = await analyticsAPI.getHeatmap();
      setHeatmapData(data);
    } catch (error) {
      console.error('Failed to load heatmap data', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensity = (count: number, maxCount: number): number => {
    if (maxCount === 0) return 0;
    if (count === 0) return 0;
    return Math.max(0.1, Math.min(count / maxCount, 1));
  };

  const getColor = (intensity: number): string => {
    if (intensity === 0) return '#FEF3C7'; // no-activity
    if (intensity <= 0.25) return '#FDE68A'; // low
    if (intensity <= 0.5) return '#F59E0B'; // medium
    if (intensity <= 0.75) return '#D97706'; // high
    return '#92400E'; // peak
  };

  // Generate calendar data
  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Get max count for normalization
  const maxCount = Math.max(...Object.values(heatmapData).map((d) => d.count), 1);

  // Group days by week
  const firstDayWeekDay = yearStart.getDay();
  
  // Padding for first week
  if (firstDayWeekDay > 0) {
    for (let i = 0; i < firstDayWeekDay; i++) {
        // Use a special null or placeholder? We'll just manage offsets in rendering.
    }
  }
  
  // Re-approach: build a grid of 7 rows (Sun-Sat)
  const grid: (Date | null)[][] = Array.from({ length: 7 }, () => []);
  
  // Add leading placeholders
  for (let i = 0; i < firstDayWeekDay; i++) {
    grid[i].push(null);
  }
  
  allDays.forEach((day) => {
    const dayOfWeek = day.getDay();
    grid[dayOfWeek].push(day);
  });

  const getDateKey = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse pb-20">
         <div className="h-12 bg-gray-50 rounded-xl w-1/4" />
         <div className="h-64 bg-gray-50 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Learning Heatmap</h1>
          <p className="text-gray-500 mt-2 font-medium">Visualization of your daily consistency.</p>
        </div>
        
        <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            <button 
                onClick={() => setSelectedYear(y => y - 1)}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                title="Previous Year"
            >
                <ChevronLeft className="h-4 w-4 text-gray-400" />
            </button>
            <span className="px-4 text-sm font-bold text-gray-900">{selectedYear}</span>
            <button 
                onClick={() => setSelectedYear(y => y + 1)}
                disabled={selectedYear >= new Date().getFullYear()}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-30"
                title="Next Year"
            >
                <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
        </div>
      </header>

      <section className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                    <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Activity Grid</h2>
                    <p className="text-xs text-gray-400 font-medium">Daily resolution of learning efforts</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Less</span>
                <div className="flex gap-1">
                    {[0, 0.25, 0.5, 0.75, 1].map(v => (
                        <div key={v} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(v) }} />
                    ))}
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">More</span>
            </div>
        </div>

        <div className="relative">
            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex flex-col gap-1.5 min-w-max">
                    {grid.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1.5 items-center">
                            <div className="w-8 text-[10px] font-bold text-gray-300 uppercase text-right mr-2">
                                {rowIndex === 1 && 'Mon'}
                                {rowIndex === 3 && 'Wed'}
                                {rowIndex === 5 && 'Fri'}
                            </div>
                            {row.map((day, colIndex) => {
                                if (!day) return <div key={`empty-${colIndex}`} className="w-3.5 h-3.5 bg-transparent" />;
                                
                                const dateKey = getDateKey(day);
                                const data = heatmapData[dateKey];
                                const count = data?.count || 0;
                                const intensity = getIntensity(count, maxCount);
                                const isHovered = hoveredDate === dateKey;
                                
                                return (
                                    <div
                                        key={dateKey}
                                        className={`w-3.5 h-3.5 rounded-sm transition-all duration-200 cursor-crosshair ${
                                            isHovered ? 'scale-150 z-10 shadow-lg ring-2 ring-white ring-offset-1 ring-offset-amber-500' : ''
                                        }`}
                                        style={{ backgroundColor: getColor(intensity) }}
                                        onMouseEnter={() => setHoveredDate(dateKey)}
                                        onMouseLeave={() => setHoveredDate(null)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Hover State Detail Card */}
            <div className="mt-12 flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100/50">
               {hoveredDate ? (
                   <>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selected Date</span>
                            <span className="text-lg font-bold text-gray-900">{format(new Date(hoveredDate), 'MMMM do, yyyy')}</span>
                        </div>
                        <div className="h-10 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Activity</span>
                            <span className="text-lg font-bold text-amber-600">
                                {heatmapData[hoveredDate]?.count || 0} Milestones
                                <span className="text-gray-400 font-medium text-sm ml-2">
                                    ({heatmapData[hoveredDate]?.hours || 0} hours)
                                </span>
                            </span>
                        </div>
                   </>
               ) : (
                   <div className="flex items-center gap-3 text-gray-400">
                       <Info className="h-5 w-5" />
                       <p className="text-sm font-medium">Hover over the squares to see activity details.</p>
                   </div>
               )}
            </div>
        </div>
      </section>
    </div>
  );
}
