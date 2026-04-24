import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, ArrowLeft, Calendar, Layout, Hash, MessageCircle, ExternalLink, Award } from 'lucide-react';
import { entriesAPI, getCertificateUrl } from '../utils/api';
import { LearningEntry } from '../types';
import { format } from 'date-fns';

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<LearningEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/entries/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = `${window.location.origin}/entries/${id}`;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    if (!entry) return;
    window.print();
  };

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
        <div className="max-w-5xl mx-auto space-y-8 animate-pulse pt-10">
            <div className="h-10 bg-gray-50 rounded-xl w-32" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-64 bg-gray-50 rounded-[32px]" />
                    <div className="h-40 bg-gray-50 rounded-[32px]" />
                </div>
                <div className="h-96 bg-gray-50 rounded-[32px]" />
            </div>
        </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <p className="text-xl font-bold text-gray-400">Milestone not found</p>
        <Link to="/timeline" className="inline-flex items-center gap-2 text-amber-600 font-bold hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Return to Timeline
        </Link>
      </div>
    );
  }

  const certificateUrl = getCertificateUrl(entry.certificatePath);

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-700 pt-6">
      <header className="flex items-center justify-between mb-12">
        <Link
          to="/timeline"
          className="group flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#1C1917] transition-all"
        >
          <div className="p-2 transition-transform group-hover:-translate-x-1">
            <ArrowLeft className="h-5 w-5" />
          </div>
          Timeline
        </Link>
        
        <div className="flex gap-4">
          <Link
            to={`/entries/${id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 text-[#1C1917] text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-2xl hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Removing...' : 'Delete'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-lg">
                        {entry.domain}
                    </span>
                    {entry.subDomain && (
                        <span className="text-gray-400 text-xs font-medium">• {entry.subDomain}</span>
                    )}
                </div>
                <h1 className="text-5xl font-bold text-[#1C1917] tracking-tight leading-tight mb-6">
                    {entry.title}
                </h1>
                <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl">
                    {entry.description || "No description provided for this milestone."}
                </p>
            </div>

            {certificateUrl && (
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Award className="h-4 w-4 text-amber-500" />
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Certificate of Achievement</h2>
                    </div>
                    <div className="relative group rounded-[32px] overflow-hidden bg-gray-900 border-8 border-white shadow-2xl ring-1 ring-gray-100">
                        <img
                            src={certificateUrl}
                            alt={entry.title}
                            className="w-full h-auto object-contain max-h-[600px] transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                             <a 
                                href={certificateUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-white text-[#1C1917] text-xs font-bold rounded-xl shadow-xl hover:scale-105 transition-transform"
                             >
                                <ExternalLink className="h-4 w-4" />
                                View Full Image
                             </a>
                        </div>
                    </div>
                </section>
            )}

            {entry.reflection && (
                <section className="bg-amber-50/30 rounded-[32px] p-10 space-y-6">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-amber-600" />
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personal Reflection</h2>
                    </div>
                    <p className="text-lg text-gray-800 font-medium italic leading-relaxed whitespace-pre-wrap">
                        "{entry.reflection}"
                    </p>
                </section>
            )}
        </div>

        {/* Sidebar Info */}
        <aside className="sticky top-8 space-y-10">
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-8">
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <Layout className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Source Platform</span>
                        </div>
                        <p className="text-lg font-bold text-[#1C1917]">{entry.platform}</p>
                    </div>

                    <div className="h-px bg-gray-50" />

                    <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Timeline</span>
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-gray-200" />
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Started</p>
                                    <p className="text-sm font-bold text-[#1C1917]">{format(new Date(entry.startDate), 'MMM d, yyyy')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-50" />
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Completed</p>
                                    <p className="text-sm font-bold text-[#1C1917]">{format(new Date(entry.completionDate), 'MMM d, yyyy')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {entry.skills.length > 0 && (
                    <>
                        <div className="h-px bg-gray-50" />
                        <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-4">
                                <Hash className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Competencies</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {entry.skills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="p-8 bg-gray-900 rounded-[32px] text-white space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Share</p>
                <div className="flex gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-xs font-bold"
                    >
                      {copySuccess ? '✓ Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 transition-colors rounded-xl text-xs font-bold"
                    >
                      Download PDF
                    </button>
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
}
