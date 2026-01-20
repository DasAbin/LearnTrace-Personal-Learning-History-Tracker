import { useEffect, useState } from 'react';
import { analyticsAPI } from '../utils/api';
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay, addDays } from 'date-fns';

interface HeatmapData {
  date: Date;
  count: number;
  hours: number;
}

export default function Heatmap() {
  const [heatmapData, setHeatmapData] = useState<Record<string, { count: number; hours: number }>>({});
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    return Math.min(count / maxCount, 1);
  };

  const getColorClass = (intensity: number): string => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.25) return 'bg-gray-300';
    if (intensity < 0.5) return 'bg-blue-300';
    if (intensity < 0.75) return 'bg-blue-500';
    return 'bg-deep-blue';
  };

  // Generate calendar data for the current year
  const currentYear = new Date().getFullYear();
  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  const yearEnd = endOfYear(new Date(currentYear, 11, 31));
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Get max count for normalization
  const maxCount = Math.max(...Object.values(heatmapData).map((d) => d.count), 1);

  // Group days by week (starting from Sunday)
  const firstDayOfYear = allDays[0];
  const firstDayWeekDay = firstDayOfYear.getDay(); // 0 = Sunday, 6 = Saturday
  
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Add padding days before year start to align with Sunday
  if (firstDayWeekDay > 0) {
    for (let i = firstDayWeekDay - 1; i >= 0; i--) {
      currentWeek.push(addDays(firstDayOfYear, -(i + 1)));
    }
  }
  
  // Add all days of the year
  allDays.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Add remaining days as last week (don't pad - show partial week)
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getDateKey = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading heatmap...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h1 text-deep-blue mb-8">Learning Heatmap</h1>

      <div className="bg-card rounded-card shadow-soft p-6">
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This calendar shows your learning activity throughout {currentYear}. Darker colors indicate more activity.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <div className="w-3 h-3 bg-blue-300 rounded"></div>
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <div className="w-3 h-3 bg-deep-blue rounded"></div>
            </div>
            <span className="text-sm text-gray-600">More</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              <div className="h-6"></div>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="h-3 w-12 text-xs text-gray-500 text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {/* Week label */}
                  <div className="h-6 text-xs text-gray-500 text-center">
                    {weekIndex % 4 === 0 && format(week[0], 'MMM d')}
                  </div>
                  {/* Days */}
                  {week.map((day, dayIndex) => {
                    const dateKey = getDateKey(day);
                    const data = heatmapData[dateKey];
                    const count = data?.count || 0;
                    const hours = data?.hours || 0;
                    const intensity = getIntensity(count, maxCount);
                    const colorClass = getColorClass(intensity);
                    const isHovered = hoveredDate === dateKey;

                    return (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 rounded ${colorClass} cursor-pointer hover:ring-2 hover:ring-primary transition-all ${
                          isHovered ? 'ring-2 ring-primary scale-125' : ''
                        }`}
                        onMouseEnter={() => setHoveredDate(dateKey)}
                        onMouseLeave={() => setHoveredDate(null)}
                        title={`${format(day, 'MMM d, yyyy')}: ${count} entries, ${hours} hours`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {hoveredDate && heatmapData[hoveredDate] && (
          <div className="mt-4 p-3 bg-gray-50 rounded-button">
            <p className="text-sm font-medium text-deep-blue">
              {format(new Date(hoveredDate), 'MMMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-600">
              {heatmapData[hoveredDate].count} entries • {heatmapData[hoveredDate].hours} hours
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
