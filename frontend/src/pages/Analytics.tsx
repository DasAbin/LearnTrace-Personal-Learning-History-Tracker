import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { analyticsAPI } from '../utils/api';

const COLORS = ['#4A90E2', '#9B59B6', '#27AE60', '#E67E22', '#E74C3C', '#2C3E50', '#F39C12', '#16A085'];

export default function Analytics() {
  const [domainDistribution, setDomainDistribution] = useState<Record<string, number>>({});
  const [yearlyTrend, setYearlyTrend] = useState<Record<string, number>>({});
  const [platformUsage, setPlatformUsage] = useState<Record<string, number>>({});
  const [skillsFrequency, setSkillsFrequency] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [domains, trend, platforms, skills] = await Promise.all([
        analyticsAPI.getDomainDistribution(),
        analyticsAPI.getYearlyTrend(),
        analyticsAPI.getPlatformUsage(),
        analyticsAPI.getSkillsFrequency(),
      ]);

      setDomainDistribution(domains);
      setYearlyTrend(trend);
      setPlatformUsage(platforms);
      setSkillsFrequency(skills);
    } catch (error) {
      console.error('Failed to load analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  // Transform data for charts
  const domainData = Object.entries(domainDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const trendData = Object.entries(yearlyTrend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({
      name,
      value,
    }));

  const platformData = Object.entries(platformUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value,
    }));

  const topSkills = Object.entries(skillsFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value,
    }));

  return (
    <div>
      <h1 className="text-h1 text-deep-blue mb-8">Analytics</h1>

      <div className="space-y-8">
        {/* Domain Distribution */}
        <div className="bg-card rounded-card shadow-soft p-6">
          <h2 className="text-h2 text-soft-purple mb-6">Domain Distribution</h2>
          {domainData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={domainData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#9B59B6" />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={domainData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {domainData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Yearly Trend */}
        <div className="bg-card rounded-card shadow-soft p-6">
          <h2 className="text-h2 text-soft-purple mb-6">Yearly Learning Trend</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#9B59B6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Platform Usage */}
        <div className="bg-card rounded-card shadow-soft p-6">
          <h2 className="text-h2 text-soft-purple mb-6">Platform Usage (Top 10)</h2>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#9B59B6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Skills Frequency */}
        <div className="bg-card rounded-card shadow-soft p-6">
          <h2 className="text-h2 text-soft-purple mb-6">Top Skills (Top 10)</h2>
          {topSkills.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSkills}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#9B59B6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
