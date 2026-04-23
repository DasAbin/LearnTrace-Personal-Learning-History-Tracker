import { useState, useEffect, useRef } from 'react';
import { vacAPI, getCertificateUrl } from '../../utils/api';
import type { VacRefundRequest } from '../../types';
import {
  FileCheck, Clock, CheckCircle2, XCircle, ExternalLink,
  Loader2, AlertCircle, RefreshCcw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function VacRequests() {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [pending, setPending] = useState<VacRefundRequest[]>([]);
  const [completed, setCompleted] = useState<VacRefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const rejectRef = useRef<HTMLTextAreaElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        vacAPI.getPendingRequests(),
        vacAPI.getCompletedRequests(),
      ]);
      setPending(p);
      setCompleted(c);
    } catch {
      showToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (rejectId && rejectRef.current) rejectRef.current.focus();
  }, [rejectId]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    // Optimistic — remove from pending
    const item = pending.find(r => r.id === id);
    setPending(prev => prev.filter(r => r.id !== id));

    try {
      const updated = await vacAPI.approveRequest(id);
      setCompleted(prev => [{ ...updated, student: item?.student }, ...prev]);
      showToast('Request approved successfully!', 'success');
      setConfirmApproveId(null);
    } catch {
      // Rollback
      if (item) setPending(prev => [...prev, item]);
      showToast('Failed to approve request', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    const item = pending.find(r => r.id === id);
    setPending(prev => prev.filter(r => r.id !== id));

    try {
      const updated = await vacAPI.rejectRequest(id, rejectReason.trim());
      setCompleted(prev => [{ ...updated, student: item?.student }, ...prev]);
      showToast('Request rejected.', 'success');
      setRejectId(null);
      setRejectReason('');
    } catch {
      if (item) setPending(prev => [...prev, item]);
      showToast('Failed to reject request', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const renderDocLink = (path: string | undefined | null, label: string) => {
    if (!path) return (
      <span className="text-xs text-gray-300 font-medium">{label}: N/A</span>
    );
    const url = getCertificateUrl(path);
    return (
      <a
        href={url || '#'}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors"
      >
        {label} <ExternalLink className="h-3 w-3" />
      </a>
    );
  };

  const renderCard = (req: VacRefundRequest, isActive: boolean) => {
    const s = req.student;
    return (
      <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Student + Course Info */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            {s && (
              <p className="text-xs font-bold text-gray-500 mb-1">
                {s.firstName} {s.lastName}
                {s.className && <> · {s.className}</>}
                {s.rollNumber && <> · Roll: {s.rollNumber}</>}
              </p>
            )}
            <h3 className="font-bold text-gray-900">{req.courseName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {req.platform} · {formatINR(req.courseAmount)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Submitted {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
            </p>
          </div>
          {!isActive && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {req.status === 'APPROVED' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {req.status === 'APPROVED' ? 'Approved' : 'Rejected'}
            </div>
          )}
        </div>

        {/* Notes */}
        {req.notes && (
          <p className="text-xs text-gray-500 italic mb-3 bg-gray-50 rounded-lg px-3 py-2">
            "{req.notes}"
          </p>
        )}

        {/* Documents */}
        <div className="flex flex-wrap gap-2 mb-4">
          {renderDocLink(req.preApprovalPath, 'Pre-approval')}
          {renderDocLink(req.certificatePath, 'Certificate')}
          {renderDocLink(req.paymentReceiptPath, 'Receipt')}
          {renderDocLink(req.additionalDocPath, 'Additional')}
        </div>

        {/* Rejection reason for completed */}
        {!isActive && req.status === 'REJECTED' && req.rejectionReason && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl mt-2">
            <p className="text-xs font-bold text-red-600 mb-1">Rejection Reason:</p>
            <p className="text-xs text-red-500 italic">{req.rejectionReason}</p>
          </div>
        )}

        {/* Actions for active tab */}
        {isActive && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {confirmApproveId === req.id ? (
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold text-gray-600 flex-1">
                  Approve {formatINR(req.courseAmount)} for "{req.courseName}"?
                </p>
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={actionLoading === req.id}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  {actionLoading === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmApproveId(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : rejectId === req.id ? (
              <div className="space-y-3">
                <textarea
                  ref={rejectRef}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Please explain why this request is being rejected..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none resize-none"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={!rejectReason.trim() || actionLoading === req.id}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {actionLoading === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Submit Rejection'}
                  </button>
                  <button
                    onClick={() => { setRejectId(null); setRejectReason(''); }}
                    className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConfirmApproveId(req.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => setRejectId(req.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-700 border border-red-200 rounded-xl hover:bg-red-50 transition-all"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-bold ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        } animate-in slide-in-from-top-2`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-amber-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">VAC Refund Requests</h1>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{pending.length}</p>
              <p className="text-xs font-bold text-gray-400 uppercase">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{completed.length}</p>
              <p className="text-xs font-bold text-gray-400 uppercase">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed ({completed.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        </div>
      ) : activeTab === 'pending' ? (
        pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No pending requests 🎉</p>
            <p className="text-xs text-gray-300 mt-1">All caught up! Check back later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(r => renderCard(r, true))}
          </div>
        )
      ) : (
        completed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
            <FileCheck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No completed requests yet</p>
            <p className="text-xs text-gray-300 mt-1">Reviewed requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {completed.map(r => renderCard(r, false))}
          </div>
        )
      )}
    </div>
  );
}
