import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { entriesAPI } from '../utils/api';
import { LearningEntry } from '../types';
import { format } from 'date-fns';

const DOMAINS = [
  'Programming',
  'Data Science',
  'Design',
  'Business',
  'Marketing',
  'Language',
  'Science',
  'Engineering',
  'Art',
  'Other',
];

export default function Timeline() {
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    domain: '',
    platform: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [filters]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await entriesAPI.getAll({
        domain: filters.domain || undefined,
        platform: filters.platform || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined,
      });
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      domain: '',
      platform: '',
      startDate: '',
      endDate: '',
      search: '',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h1 text-deep-blue">Timeline</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-button hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card rounded-card shadow-soft p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search entries..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <select
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All domains</option>
                {DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <input
                type="text"
                value={filters.platform}
                onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                placeholder="Filter by platform..."
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="px-2 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="px-2 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Entries */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card rounded-card shadow-soft p-12 text-center">
          <p className="text-gray-500 mb-4">No entries found</p>
          <Link to="/entries/new" className="text-primary hover:underline">
            Add your first entry
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to={`/entries/${entry.id}`}
              className="block bg-card rounded-card shadow-soft p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-6">
                {entry.certificatePath && (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${entry.certificatePath}`}
                    alt={entry.title}
                    className="w-24 h-24 object-cover rounded-button"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-h3 text-deep-blue">{entry.title}</h3>
                    <span className="text-sm text-gray-500">
                      {format(new Date(entry.completionDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                    <span className="font-medium">{entry.platform}</span>
                    <span>•</span>
                    <span className="bg-blue-50 text-primary px-2 py-1 rounded-button text-xs font-medium">
                      {entry.domain}
                    </span>
                    {entry.subDomain && (
                      <>
                        <span>•</span>
                        <span className="text-gray-500">{entry.subDomain}</span>
                      </>
                    )}
                  </div>
                  {entry.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.skills.map((skill, idx) => (
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
  );
}
