import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { entriesAPI, getCertificateUrl } from '../utils/api';
import { TagInput } from '../components/TagInput';
import { X, UploadCloud, FileText, Calendar, Globe, Sparkles } from 'lucide-react';

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

interface FormData {
  title: string;
  platform: string;
  domain: string;
  subDomain: string;
  hoursSpent: string;
  startDate: string;
  completionDate: string;
  description: string;
  reflection: string;
}

export default function AddEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [skills, setSkills] = useState<string[]>([]);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionMessage, setExtractionMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>();

  useEffect(() => {
    if (isEditing && id) {
      loadEntry(id);
    }
  }, [id, isEditing]);

  const loadEntry = async (entryId: string) => {
    try {
      const entry = await entriesAPI.getById(entryId);
      setValue('title', entry.title);
      setValue('platform', entry.platform);
      setValue('domain', entry.domain);
      setValue('subDomain', entry.subDomain || '');
      setValue('hoursSpent', entry.hoursSpent?.toString() || '');
      setValue('startDate', entry.startDate.split('T')[0]);
      setValue('completionDate', entry.completionDate.split('T')[0]);
      setValue('description', entry.description || '');
      setValue('reflection', entry.reflection || '');
      setSkills(entry.skills || []);
      if (entry.certificatePath) {
        setCertificatePreview(getCertificateUrl(entry.certificatePath));
      }
    } catch (err) {
      console.error('Failed to load entry', err);
      navigate('/dashboard');
    }
  };

  const processFile = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select an image (PNG, JPG, WebP) or PDF file');
      return;
    }
    setCertificate(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertificatePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Auto-extraction (images only) — best effort, never overwrites existing data
      try {
        setExtracting(true);
        setExtractionMessage('Analyzing certificate...');
        const result = await entriesAPI.extractCertificate(file);
        if (result?.extracted) {
          const e = result.extracted;
          const currentValues = {
            title: (document.getElementById('title') as HTMLInputElement)?.value || '',
            platform: (document.getElementById('platform') as HTMLInputElement)?.value || '',
            domain: (document.getElementById('domain') as HTMLSelectElement)?.value || '',
            description: (document.getElementById('description') as HTMLTextAreaElement)?.value || '',
          };

          // Only autofill fields that are currently empty
          if (e.title && !currentValues.title.trim()) setValue('title', e.title);
          if (e.platform && !currentValues.platform.trim()) setValue('platform', e.platform);
          if (e.domain && !currentValues.domain.trim()) setValue('domain', e.domain);
          if (e.description && !currentValues.description.trim()) setValue('description', e.description);

          // Only add skills that don't already exist
          if (e.skills && e.skills.length > 0) {
            setSkills(prev => {
              const existing = new Set(prev.map(s => s.toLowerCase()));
              const newSkills = e.skills!.filter((s: string) => !existing.has(s.toLowerCase()));
              return prev.length === 0 ? e.skills! : [...prev, ...newSkills];
            });
          }

          setExtractionMessage('✓ Details auto-filled from certificate');
          setTimeout(() => setExtractionMessage(''), 4000);
        } else {
          setExtractionMessage('');
        }
      } catch {
        // Silently ignore extraction failures
        setExtractionMessage('');
      } finally {
        setExtracting(false);
      }
    } else {
      // PDF — show a placeholder, no extraction
      setCertificatePreview('pdf');
    }
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removeCertificate = () => {
    setCertificate(null);
    setCertificatePreview(null);
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('platform', data.platform);
      formData.append('domain', data.domain);
      if (data.subDomain) formData.append('subDomain', data.subDomain);
      if (data.hoursSpent) formData.append('hoursSpent', data.hoursSpent);
      formData.append('startDate', data.startDate);
      formData.append('completionDate', data.completionDate);
      formData.append('skills', JSON.stringify(skills));
      if (data.description) formData.append('description', data.description);
      if (data.reflection) formData.append('reflection', data.reflection);
      if (certificate) formData.append('certificate', certificate);

      if (isEditing && id) {
        await entriesAPI.update(id, formData);
      } else {
        await entriesAPI.create(formData);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-[#1C1917] tracking-tight">
            {isEditing ? 'Edit Entry' : 'New Milestone'}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Record what you've achieved today.</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form id="entry-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">General Information</h2>
                </div>

                <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                        Milestone Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        {...register('title', { required: 'Title is required' })}
                        autoFocus
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-[#1C1917] placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium"
                        placeholder="e.g., Advanced TypeScript Masterclass"
                    />
                    {errors.title && <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="platform" className="block text-sm font-semibold text-gray-700 mb-2">Platform</label>
                        <input
                            id="platform"
                            {...register('platform', { required: 'Platform is required' })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                            placeholder="e.g., Udemy, YouTube"
                        />
                    </div>
                    <div>
                        <label htmlFor="domain" className="block text-sm font-semibold text-gray-700 mb-2">Domain</label>
                        <select
                            id="domain"
                            {...register('domain', { required: 'Domain is required' })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 cursor-pointer"
                        >
                            <option value="">Select Domain</option>
                            {DOMAINS.map(d => <option key={`domain-option-${d}`} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                        id="description"
                        {...register('description')}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                        placeholder="What was this course about?"
                    />
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Time & Skills</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                        <input
                            id="startDate"
                            type="date"
                            {...register('startDate', { required: true })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="completionDate" className="block text-sm font-semibold text-gray-700 mb-2">Completion Date</label>
                        <input
                            id="completionDate"
                            type="date"
                            {...register('completionDate', { required: true })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="hoursSpent" className="block text-sm font-semibold text-gray-700 mb-2">Hours Spent</label>
                    <input
                        id="hoursSpent"
                        type="number"
                        min="0"
                        {...register('hoursSpent')}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                        placeholder="e.g. 4"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Skills Acquired</label>
                    <TagInput tags={skills} onChange={setSkills} />
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <label htmlFor="reflection" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Deep Reflection</label>
                </div>
                <textarea
                    id="reflection"
                    {...register('reflection')}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                    placeholder="Key takeaways, challenges faced, or how you'll apply this knowledge..."
                />
            </section>
          </form>
        </div>

        {/* Sidebar: Media & Actions */}
        <aside className="space-y-8">
            <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Globe className="h-4 w-4 text-amber-600" />
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Proof of Learning</h2>
                </div>

                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 group flex flex-col items-center justify-center p-8 text-center ${
                        isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    } ${certificatePreview ? 'p-2' : ''}`}
                >
                    {certificatePreview ? (
                        <div className="relative w-full group/preview">
                            {certificatePreview === 'pdf' ? (
                              <div className="flex flex-col items-center justify-center py-10">
                                <FileText className="h-16 w-16 text-red-400 mb-2" />
                                <p className="text-sm font-bold text-gray-700">{certificate?.name || 'PDF Certificate'}</p>
                                <p className="text-xs text-gray-400 mt-1">PDF attached</p>
                              </div>
                            ) : (
                              <img src={certificatePreview} alt="Preview" className="w-full h-auto rounded-xl object-contain bg-black/5" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                                <button
                                    type="button"
                                    onClick={removeCertificate}
                                    className="p-3 bg-white text-red-600 rounded-full hover:scale-110 transition-transform shadow-xl"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-gray-900">Drag certificate here</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                            <label htmlFor="certificate-upload" className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                                Choose File
                                <input id="certificate-upload" type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                            </label>
                        </>
                    )}
                </div>
                {extracting && (
                  <p className="text-xs text-amber-600 font-medium mt-2 animate-pulse">
                    🔍 Analyzing certificate...
                  </p>
                )}
                {!extracting && extractionMessage && (
                  <p className="text-xs text-emerald-600 font-medium mt-2">
                    {extractionMessage}
                  </p>
                )}
            </section>

            <div className="sticky top-8 space-y-4">
                <button
                    form="entry-form"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                             <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             Saving...
                        </span>
                    ) : isEditing ? 'Update Entry' : 'Publish Milestone'}
                </button>
            </div>
        </aside>
      </div>
    </div>
  );
}
