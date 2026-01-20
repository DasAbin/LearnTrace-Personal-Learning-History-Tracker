import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { entriesAPI } from '../utils/api';
import { LearningEntry } from '../types';
import { X } from 'lucide-react';

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
  const [filterDomain, setFilterDomain] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [filterDomain, filterPlatform]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await entriesAPI.getAll({
        domain: filterDomain || undefined,
        platform: filterPlatform || undefined,
      });
      // Filter entries that have certificates
      const entriesWithCertificates = data.filter((entry) => entry.certificatePath);
      setEntries(entriesWithCertificates);
    } catch (error) {
      console.error('Failed to load entries', error);
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h1 text-deep-blue">Badge Vault</h1>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-card shadow-soft p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
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
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All platforms</option>
              {uniquePlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card rounded-card shadow-soft p-12 text-center">
          <p className="text-gray-500 mb-4">No certificates found</p>
          <Link to="/entries/new" className="text-primary hover:underline">
            Add an entry with a certificate
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {entries.map((entry) => {
            const certificateUrl = entry.certificatePath
              ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${entry.certificatePath}`
              : null;

            if (!certificateUrl) return null;

            return (
              <div
                key={entry.id}
                className="bg-card rounded-card shadow-soft overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openPreview(entry.certificatePath!)}
              >
                <div className="aspect-square bg-gray-100">
                  <img
                    src={certificateUrl}
                    alt={entry.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-deep-blue mb-1 truncate">{entry.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="truncate">{entry.platform}</span>
                    <span className="bg-blue-50 text-primary px-2 py-0.5 rounded-button text-xs">
                      {entry.domain}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-screen Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closePreview}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImage}
              alt="Certificate preview"
              className="max-w-full max-h-[90vh] object-contain rounded-button"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
