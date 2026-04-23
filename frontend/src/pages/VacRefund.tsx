import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { vacAPI, getCertificateUrl } from '../utils/api';
import type { VacRefundRequest } from '../types';
import {
  FileCheck, UploadCloud, X, Loader2, ArrowRight, Clock,
  CheckCircle2, XCircle, BookOpen, Globe, IndianRupee,
  FileText, RefreshCcw, AlertCircle
} from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface FormFields {
  courseName: string;
  platform: string;
  courseAmount: string;
  notes: string;
}

interface FileSlot {
  file: File | null;
  preview: string | null;
}

const emptySlot: FileSlot = { file: null, preview: null };

function FileUploadZone({
  label, hint, slot, onChange, onRemove,
}: {
  label: string; hint: string;
  slot: FileSlot;
  onChange: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (f.size > MAX_FILE_SIZE) {
      alert('File must be 5 MB or smaller.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      alert('Please select an image (PNG, JPG, WebP) or PDF file.');
      return;
    }
    onChange(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
      className={`relative rounded-2xl border-2 border-dashed transition-all p-5 text-center cursor-pointer group ${
        dragOver ? 'border-amber-500 bg-amber-50' :
        slot.file ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
      }`}
      onClick={() => !slot.file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      {slot.file ? (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            {slot.file.type === 'application/pdf'
              ? <FileText className="h-5 w-5 text-emerald-600" />
              : <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            }
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-gray-900 truncate">{slot.file.name}</p>
            <p className="text-xs text-gray-400">{(slot.file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <UploadCloud className="h-6 w-6 text-gray-400 mx-auto mb-2 group-hover:text-amber-500 transition-colors" />
          <p className="text-xs font-bold text-gray-700">{label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>
        </>
      )}
    </div>
  );
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function VacRefund() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormFields>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requests, setRequests] = useState<VacRefundRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [preApproval, setPreApproval] = useState<FileSlot>(emptySlot);
  const [certificate, setCertificate] = useState<FileSlot>(emptySlot);
  const [paymentReceipt, setPaymentReceipt] = useState<FileSlot>(emptySlot);
  const [additionalDoc, setAdditionalDoc] = useState<FileSlot>(emptySlot);

  const fetchMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await vacAPI.getMyRequests();
      setRequests(data);
    } catch {
      // silent
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => { fetchMyRequests(); }, []);

  const onSubmit = async (data: FormFields) => {
    setError('');
    setSuccess('');

    if (!preApproval.file && !certificate.file) {
      setError('Please upload at least a pre-approval document or certificate proof.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('courseName', data.courseName);
      formData.append('platform', data.platform);
      formData.append('courseAmount', data.courseAmount);
      if (data.notes) formData.append('notes', data.notes);
      if (preApproval.file) formData.append('preApproval', preApproval.file);
      if (certificate.file) formData.append('certificate', certificate.file);
      if (paymentReceipt.file) formData.append('paymentReceipt', paymentReceipt.file);
      if (additionalDoc.file) formData.append('additionalDoc', additionalDoc.file);

      await vacAPI.submitRequest(formData);

      setSuccess('Your refund request has been submitted! The VAC Incharge will review it shortly.');
      reset();
      setPreApproval(emptySlot);
      setCertificate(emptySlot);
      setPaymentReceipt(emptySlot);
      setAdditionalDoc(emptySlot);
      fetchMyRequests();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(err.response.data.error || 'You already have a pending request for this course.');
      } else {
        setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setFile = (setter: React.Dispatch<React.SetStateAction<FileSlot>>) => (f: File) => {
    setter({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : 'pdf' });
  };
  const clearFile = (setter: React.Dispatch<React.SetStateAction<FileSlot>>) => () => {
    setter(emptySlot);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-amber-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">VAC Course Refund</h1>
        </div>
        <p className="text-gray-500 font-medium ml-[52px]">
          Submit your Value Added Course documents to request a fee refund from your institution.
        </p>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6 mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-600" />
            Course Details
          </h2>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">{success}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                {...register('courseName', { required: 'Course name is required' })}
                placeholder="e.g., Python for Everybody"
                className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
              />
            </div>
            {errors.courseName && <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.courseName.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Platform <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  {...register('platform', { required: 'Platform is required' })}
                  placeholder="e.g., Coursera, NPTEL, Udemy"
                  className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                />
              </div>
              {errors.platform && <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.platform.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  {...register('courseAmount', { required: 'Amount is required', min: { value: 0, message: 'Must be positive' } })}
                  placeholder="e.g., 2499"
                  className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none"
                />
              </div>
              {errors.courseAmount && <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.courseAmount.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any additional information about your course completion..."
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none resize-none"
            />
          </div>
        </section>

        {/* Document Upload Section */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6 mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-amber-600" />
            Supporting Documents
          </h2>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 font-semibold">
            ⚠️ At least a Pre-approval document or Certificate proof is required. Max 5 MB each.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUploadZone
              label="Pre-approval / Minute Sheet"
              hint="PDF or image · Required if no certificate"
              slot={preApproval}
              onChange={setFile(setPreApproval)}
              onRemove={clearFile(setPreApproval)}
            />
            <FileUploadZone
              label="Certificate Proof"
              hint="Course completion certificate"
              slot={certificate}
              onChange={setFile(setCertificate)}
              onRemove={clearFile(setCertificate)}
            />
            <FileUploadZone
              label="Payment Receipt / Email"
              hint="Payment proof or confirmation email"
              slot={paymentReceipt}
              onChange={setFile(setPaymentReceipt)}
              onRemove={clearFile(setPaymentReceipt)}
            />
            <FileUploadZone
              label="Additional Documents"
              hint="Any other supporting files"
              slot={additionalDoc}
              onChange={setFile(setAdditionalDoc)}
              onRemove={clearFile(setAdditionalDoc)}
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="group w-full flex justify-center items-center py-4 px-6 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 disabled:opacity-50 disabled:cursor-not-allowed mb-12"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Request Verification
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* My Past Requests */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-extrabold text-gray-900">My Requests</h2>
          <button
            onClick={fetchMyRequests}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {loadingRequests ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
            <FileCheck className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No requests yet</p>
            <p className="text-xs text-gray-300 mt-1">Submit your first VAC refund request above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{req.courseName}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {req.platform} · {formatINR(req.courseAmount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {req.status === 'PENDING' && <Clock className="h-3 w-3" />}
                    {req.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
                    {req.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                    {req.status}
                  </div>
                </div>
                {/* Document links */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {req.preApprovalPath && (
                    <a href={getCertificateUrl(req.preApprovalPath) || '#'} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">
                      Pre-approval ↗
                    </a>
                  )}
                  {req.certificatePath && (
                    <a href={getCertificateUrl(req.certificatePath) || '#'} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">
                      Certificate ↗
                    </a>
                  )}
                  {req.paymentReceiptPath && (
                    <a href={getCertificateUrl(req.paymentReceiptPath) || '#'} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">
                      Receipt ↗
                    </a>
                  )}
                  {req.additionalDocPath && (
                    <a href={getCertificateUrl(req.additionalDocPath) || '#'} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">
                      Additional ↗
                    </a>
                  )}
                </div>
                {req.status === 'REJECTED' && req.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-xs font-bold text-red-600 mb-1">Rejection Reason:</p>
                    <p className="text-xs text-red-500 italic">{req.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
