import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertCircle, RefreshCcw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { SkeletonCard } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useInfiniteEntries, useDeleteEntry } from '../hooks/useEntries';
import { useToast } from '../components/Toast';

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
  const { show: toast } = useToast();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    domain: '',
    platform: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteEntries(filters);

  const deleteMutation = useDeleteEntry();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast('Entry deleted successfully', 'success');
      } catch (err) {
        toast('Failed to delete entry', 'error');
      }
    }
  };

  const loadEntries = () => refetch();

  const clearFilters = () => {
    setFilters({
      domain: '',
      platform: '',
      startDate: '',
      endDate: '',
      search: '',
    });
  };

  // Intersection Observer for Infinite Scroll
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  const allEntries = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h1 text-[#1C1917]">Timeline</h1>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <select
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="px-2 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="px-2 py-2 border border-gray-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-amber-600 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Entries */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : isError ? (
        <div className="max-w-xl mx-auto py-20 text-center space-y-6">
          <div className="h-20 w-20 bg-red-50 rounded-[30px] flex items-center justify-center text-red-500 mx-auto border border-red-100 shadow-sm">
              <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">Timeline Load Failed</h2>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                {(error as any)?.message || 'Failed to load learning entries'}
              </p>
          </div>
          <button
            onClick={loadEntries}
            className="flex items-center justify-center gap-2 mx-auto bg-gray-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry Load
          </button>
        </div>
      ) : allEntries.length === 0 ? (
        <EmptyState
          icon="⏳"
          title={filters.search || filters.domain ? "No matching entries" : "Your timeline is empty"}
          description={filters.search || filters.domain 
            ? "Try adjusting your filters or search terms to find what you're looking for." 
            : "Every great journey begins with a single step. Start logging your learning achievements today."}
          actionLabel="Log first milestone"
          actionHref="/entries/new"
        />
      ) : (
        <div className="space-y-6 pb-20">
          <div className="space-y-4">
            {allEntries.map((entry) => (
              <Link
                key={entry.id}
                to={`/entries/${entry.id}`}
                className="group block bg-card rounded-card shadow-soft p-6 hover:shadow-md transition-shadow relative"
              >
                <button
                  onClick={(e) => handleDelete(e, entry.id)}
                  className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

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
                      <h3 className="text-h3 text-[#1C1917] group-hover:text-amber-600 transition-colors">{entry.title}</h3>
                      <span className="text-sm text-gray-500 mr-8">
                        {format(new Date(entry.completionDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{entry.platform}</span>
                      <span>•</span>
                      <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-button text-xs font-medium">
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
                            className="bg-amber-50 text-amber-700 px-2 py-1 rounded-button text-xs font-medium"
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

          {/* Sentinel for Infinite Scroll */}
          <div ref={sentinelRef} className="py-8">
            {isFetchingNextPage && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            )}
            {!hasNextPage && allEntries.length > 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">You've reached the end 🎉</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
