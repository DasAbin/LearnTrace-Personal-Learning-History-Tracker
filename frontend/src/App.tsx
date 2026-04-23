import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Stable Production Build v1.0.2 (Cache Busting Strategy)
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute, VacRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import EntryDetail from './pages/EntryDetail';
import AddEntry from './pages/AddEntry';
import BadgeVault from './pages/BadgeVault';
import Analytics from './pages/Analytics';
import Heatmap from './pages/Heatmap';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClassroomIndex from './pages/admin/ClassroomIndex';
import ClassroomView from './pages/admin/ClassroomView';
import EmailVerified from './pages/EmailVerified';
import VacRefund from './pages/VacRefund';
import VacRequests from './pages/vac/VacRequests';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/email-verified" element={<EmailVerified />} />

              {/* Protected routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ErrorBoundary>
                        <Routes>
                          {/* Student routes */}
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/timeline" element={<Timeline />} />
                          <Route path="/entries/new" element={<AddEntry />} />
                          <Route path="/entries/:id" element={<EntryDetail />} />
                          <Route path="/entries/:id/edit" element={<AddEntry />} />
                          <Route path="/badges" element={<BadgeVault />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/heatmap" element={<Heatmap />} />
                          <Route path="/profile" element={<Profile />} />

                          {/* Admin routes */}
                          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                          <Route path="/admin/classroom" element={<AdminRoute><ClassroomIndex /></AdminRoute>} />
                          <Route path="/admin/classroom/:className" element={<AdminRoute><ClassroomView /></AdminRoute>} />

                          {/* VAC routes */}
                          <Route path="/vac-refund" element={<VacRefund />} />
                          <Route path="/vac/requests" element={<VacRoute><VacRequests /></VacRoute>} />

                          {/* Default redirect */}
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
