import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Download, LogOut } from 'lucide-react';
import { entriesAPI, analyticsAPI } from '../utils/api';
import { LearningEntry, DashboardSummary } from '../types';
import { format } from 'date-fns';

export default function Profile() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const data = await analyticsAPI.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load profile data', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const entries = await entriesAPI.getAll();
      
      if (format === 'json') {
        const dataStr = JSON.stringify(entries, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `learntrace-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export
        const headers = ['Title', 'Platform', 'Domain', 'Sub-domain', 'Start Date', 'Completion Date', 'Skills', 'Description', 'Reflection'];
        const csvRows = [
          headers.join(','),
          ...entries.map((entry) => {
            return [
              `"${entry.title.replace(/"/g, '""')}"`,
              `"${entry.platform.replace(/"/g, '""')}"`,
              `"${entry.domain.replace(/"/g, '""')}"`,
              `"${(entry.subDomain || '').replace(/"/g, '""')}"`,
              format(new Date(entry.startDate), 'yyyy-MM-dd'),
              format(new Date(entry.completionDate), 'yyyy-MM-dd'),
              `"${entry.skills.join('; ').replace(/"/g, '""')}"`,
              `"${(entry.description || '').replace(/"/g, '""')}"`,
              `"${(entry.reflection || '').replace(/"/g, '""')}"`,
            ].join(',');
          }),
        ];
        
        const csv = csvRows.join('\n');
        const dataBlob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `learntrace-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data', error);
      alert('Failed to export data');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1 className="text-h1 text-deep-blue mb-8">Profile & Settings</h1>

      <div className="space-y-6">
        {/* Profile Info */}
        <div className="bg-card rounded-card shadow-soft p-6">
          <h2 className="text-h2 text-deep-blue mb-6">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-lg text-deep-blue">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-lg text-deep-blue">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
              <p className="text-lg text-deep-blue">
                {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {!loading && summary && (
          <div className="bg-card rounded-card shadow-soft p-6">
            <h2 className="text-h2 text-deep-blue mb-6">Learning Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Entries</div>
                <div className="text-2xl font-bold text-deep-blue">{summary.totalEntries}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Hours</div>
                <div className="text-2xl font-bold text-deep-blue">{summary.totalHours}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Current Streak</div>
                <div className="text-2xl font-bold text-deep-blue">{summary.streak} days</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Unique Skills</div>
                <div className="text-2xl font-bold text-deep-blue">{summary.uniqueSkills}</div>
              </div>
            </div>
          </div>
        )}

        {/* Data Export */}
        <div className="bg-card rounded-card shadow-soft p-6">
          <h2 className="text-h2 text-deep-blue mb-6">Data Export</h2>
          <p className="text-gray-600 mb-4">
            Export all your learning entries in JSON or CSV format.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => exportData('json')}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-button hover:bg-blue-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export as JSON</span>
            </button>
            <button
              onClick={() => exportData('csv')}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-button hover:bg-blue-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export as CSV</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-card rounded-card shadow-soft p-6">
          <h2 className="text-h2 text-deep-blue mb-6">Account Actions</h2>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-6 py-3 bg-alert-red text-white rounded-button hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
