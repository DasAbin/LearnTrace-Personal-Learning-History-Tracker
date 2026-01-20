import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Flame, Tag, Plus } from 'lucide-react';
import { analyticsAPI } from '../utils/api';
import { DashboardSummary, LearningEntry } from '../types';
import { format } from 'date-fns';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await analyticsAPI.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Failed to load dashboard data</p>
        <button
          onClick={loadSummary}
          className="text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Entries',
      value: summary.totalEntries,
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Hours',
      value: summary.totalHours,
      icon: Clock,
      color: 'text-success-green',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Day Streak',
      value: summary.streak,
      icon: Flame,
      color: 'text-warm-orange',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Unique Skills',
      value: summary.uniqueSkills,
      icon: Tag,
      color: 'text-soft-purple',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h1 text-deep-blue">Dashboard</h1>
        <Link
          to="/entries/new"
          className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-button hover:bg-blue-600 transition-colors shadow-soft"
        >
          <Plus className="h-5 w-5" />
          <span>Add Entry</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-card rounded-card shadow-soft p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-button`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-deep-blue mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-card shadow-soft p-6">
        <h2 className="text-h2 text-deep-blue mb-6">Recent Activity</h2>
        {summary.recentEntries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No entries yet</p>
            <Link
              to="/entries/new"
              className="inline-flex items-center space-x-2 text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              <span>Add your first entry</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.recentEntries.map((entry: LearningEntry) => (
              <Link
                key={entry.id}
                to={`/entries/${entry.id}`}
                className="block p-4 border border-gray-200 rounded-button hover:border-primary hover:shadow-soft transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-h3 text-deep-blue mb-2">{entry.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="font-medium">{entry.platform}</span>
                      <span>•</span>
                      <span className="bg-blue-50 text-primary px-2 py-1 rounded-button text-xs font-medium">
                        {entry.domain}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(entry.completionDate), 'MMM d, yyyy')}</span>
                    </div>
                    {entry.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {entry.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded-button text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
