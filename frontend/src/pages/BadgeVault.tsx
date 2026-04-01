import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { entriesAPI } from '../utils/api';
import { LearningEntry } from '../types';
import { X, Search, Filter, Award, Maximize2, ExternalLink, AlertCircle, RefreshCcw } from 'lucide-react';

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

export default function BadgeVault() {
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [filterDomain, filterPlatform]);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await entriesAPI.getAll({
        domain: filterDomain || undefined,
        platform: filterPlatform || undefined,
      });
      const entriesWithCertificates = data.filter((entry) => entry.certificatePath);
      setEntries(entriesWithCertificates);
    } catch (error) {
      console.error('Failed to load entries', error);
      setError('Failed to load certificates from your vault.');
    } finally {
      setLoading(false);
    }
  };

  const openPreview = (certificatePath: string) => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${certificatePath}`;
    setPreviewImage(url);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const uniquePlatforms = Array.from(
    new Set(entries.map((entry) => entry.platform))
  ).sort();

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-[#1C1917] tracking-tight">Badge Vault</h1>
          <p className="text-gray-500 mt-2 font-medium">A curated selection of your verified achievements.</p>
        </div>
      </header>

      {/* Modern Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-12 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex-1 relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
            <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl text-sm font-bold text-[#1C1917] focus:ring-2 focus:ring-amber-500/10 transition-all appearance-none cursor-pointer"
            >
                <option value="">All Domains</option>
                {DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                ))}
            </select>
        </div>

        <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
            <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl text-sm font-bold text-[#1C1917] focus:ring-2 focus:ring-amber-500/10 transition-all appearance-none cursor-pointer"
            >
                <option value="">All Platforms</option>
                {uniquePlatforms.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[4/3] bg-gray-100 animate-shimmer rounded-[32px]" />
          ))}
        </div>
      ) : error ? (
        <div className="max-w-xl mx-auto py-20 text-center space-y-6">
          <div className="h-20 w-20 bg-red-50 rounded-[30px] flex items-center justify-center text-red-500 mx-auto border border-red-100 shadow-sm">
              <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">Vault Access Failed</h2>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{error}</p>
          </div>
          <button
            onClick={loadEntries}
            className="flex items-center justify-center gap-2 mx-auto bg-gray-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry Access
          </button>
        </div>
      ) : entries.length === 0 ? (

        <div className="max-w-md mx-auto py-20 text-center space-y-6">
            <div className="h-20 w-20 bg-gray-50 rounded-[30px] flex items-center justify-center text-gray-300 mx-auto border border-gray-100 shadow-sm">
                <Award size={40} />
            </div>
            <p className="text-[#1C1917] font-bold text-xl">Vault Empty</p>
            <p className="text-gray-400 text-sm">You haven't uploaded any certificates yet. Achievements will appear here once verified.</p>
            <Link to="/entries/new" className="inline-flex items-center gap-2 text-amber-600 font-bold hover:underline">
                Collect your first badge <ExternalLink className="h-4 w-4" />
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {entries.map((entry) => {
            const certificateUrl = entry.certificatePath
              ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${entry.certificatePath}`
              : null;

            if (!certificateUrl) return null;

            return (
              <div
                key={entry.id}
                className="group relative bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                onClick={() => openPreview(entry.certificatePath!)}
              >
                <div className="aspect-[3/4] overflow-hidden bg-gray-900">
                  <img
                    src={certificateUrl}
                    alt={entry.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest rounded">
                            {entry.domain}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight mb-1">{entry.title}</h3>
                      <p className="text-xs text-white/60 font-medium">{entry.platform}</p>
                  </div>
                  
                  {/* Hover Overlay Icon */}
                  <div className="absolute top-6 right-6 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 text-white">
                      <Maximize2 className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Immersive Gallery Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-gray-950/90 z-50 flex items-center justify-center p-6 sm:p-12 animate-in fade-in zoom-in duration-300 backdrop-blur-2xl"
          onClick={closePreview}
        >
          <div className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center">
            <button
              onClick={closePreview}
              className="absolute -top-4 -right-4 sm:top-0 sm:right-0 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full h-full flex items-center justify-center py-10" onClick={(e) => e.stopPropagation()}>
                <img
                  src={previewImage}
                  alt="Certificate preview"
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
                />
            </div>
            <div className="mt-6 flex gap-4">
                 <a 
                    href={previewImage} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="px-8 py-3 bg-orange-500 text-white rounded-2xl text-sm font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <ExternalLink className="h-4 w-4" />
                    Open Source 
                 </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
