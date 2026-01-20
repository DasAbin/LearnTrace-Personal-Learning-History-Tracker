import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import { entriesAPI } from '../utils/api';
import { LearningEntry } from '../types';
import { format } from 'date-fns';

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<LearningEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadEntry(id);
    }
  }, [id]);

  const loadEntry = async (entryId: string) => {
    try {
      const data = await entriesAPI.getById(entryId);
      setEntry(data);
    } catch (error) {
      console.error('Failed to load entry', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await entriesAPI.delete(id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete entry', error);
      alert('Failed to delete entry');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Entry not found</p>
        <Link to="/dashboard" className="text-primary hover:underline">
          Go to dashboard
        </Link>
      </div>
    );
  }

  const certificateUrl = entry.certificatePath
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${entry.certificatePath}`
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/timeline"
          className="flex items-center space-x-2 text-gray-600 hover:text-deep-blue"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Timeline</span>
        </Link>
        <div className="flex gap-3">
          <Link
            to={`/entries/${id}/edit`}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-button hover:bg-blue-600 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center space-x-2 px-4 py-2 bg-alert-red text-white rounded-button hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>{deleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Certificate */}
        <div>
          {certificateUrl ? (
            <div className="bg-card rounded-card shadow-soft p-4">
              <img
                src={certificateUrl}
                alt={entry.title}
                className="w-full rounded-button"
              />
            </div>
          ) : (
            <div className="bg-card rounded-card shadow-soft p-12 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No certificate uploaded</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-card rounded-card shadow-soft p-6">
          <h1 className="text-h1 text-deep-blue mb-6">{entry.title}</h1>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Platform</div>
              <div className="text-lg text-deep-blue">{entry.platform}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Domain</div>
                <div className="bg-blue-50 text-primary px-3 py-1 rounded-button inline-block font-medium">
                  {entry.domain}
                </div>
              </div>
              {entry.subDomain && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Sub-domain</div>
                  <div className="text-lg text-deep-blue">{entry.subDomain}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Start Date</div>
                <div className="text-lg text-deep-blue">
                  {format(new Date(entry.startDate), 'MMM d, yyyy')}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Completion Date</div>
                <div className="text-lg text-deep-blue">
                  {format(new Date(entry.completionDate), 'MMM d, yyyy')}
                </div>
              </div>
            </div>

            {entry.skills.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Skills</div>
                <div className="flex flex-wrap gap-2">
                  {entry.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-button text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {entry.description && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Description</div>
                <div className="text-deep-blue whitespace-pre-wrap">{entry.description}</div>
              </div>
            )}

            {entry.reflection && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Reflection</div>
                <div className="text-deep-blue whitespace-pre-wrap">{entry.reflection}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
