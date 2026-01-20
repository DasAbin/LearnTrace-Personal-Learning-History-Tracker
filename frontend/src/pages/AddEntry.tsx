import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { entriesAPI } from '../utils/api';
import { TagInput } from '../components/TagInput';
import { X } from 'lucide-react';
import type { LearningEntry } from '../types';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
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
      setValue('startDate', entry.startDate.split('T')[0]);
      setValue('completionDate', entry.completionDate.split('T')[0]);
      setValue('description', entry.description || '');
      setValue('reflection', entry.reflection || '');
      setSkills(entry.skills || []);
      if (entry.certificatePath) {
        setCertificatePreview(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${entry.certificatePath}`);
      }
    } catch (err) {
      console.error('Failed to load entry', err);
      navigate('/dashboard');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setCertificate(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setCertificatePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please select an image file');
      }
    }
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-h1 text-deep-blue mb-8">
        {isEditing ? 'Edit Entry' : 'Add Learning Entry'}
      </h1>

      <div className="bg-card rounded-card shadow-soft p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-alert-red text-alert-red px-4 py-3 rounded-button">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-alert-red">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., Complete React Course"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-alert-red">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform <span className="text-alert-red">*</span>
              </label>
              <input
                {...register('platform', { required: 'Platform is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Coursera, Udemy"
              />
              {errors.platform && (
                <p className="mt-1 text-sm text-alert-red">{errors.platform.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain <span className="text-alert-red">*</span>
              </label>
              <select
                {...register('domain', { required: 'Domain is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select domain</option>
                {DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
              {errors.domain && (
                <p className="mt-1 text-sm text-alert-red">{errors.domain.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub-domain (optional)
            </label>
            <input
              {...register('subDomain')}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., Frontend Development"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-alert-red">*</span>
              </label>
              <input
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-alert-red">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Date <span className="text-alert-red">*</span>
              </label>
              <input
                type="date"
                {...register('completionDate', { required: 'Completion date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.completionDate && (
                <p className="mt-1 text-sm text-alert-red">{errors.completionDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <TagInput tags={skills} onChange={setSkills} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Brief description of what you learned..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reflection Notes
            </label>
            <textarea
              {...register('reflection')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Your thoughts and takeaways..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate (Image)
            </label>
            {certificatePreview ? (
              <div className="relative inline-block">
                <img
                  src={certificatePreview}
                  alt="Certificate preview"
                  className="max-w-xs max-h-48 rounded-button border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeCertificate}
                  className="absolute top-2 right-2 bg-alert-red text-white p-1 rounded-full hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 rounded-button font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-button font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
