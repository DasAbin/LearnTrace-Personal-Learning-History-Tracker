import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import EntryDetail from './pages/EntryDetail';
import AddEntry from './pages/AddEntry';
import BadgeVault from './pages/BadgeVault';
import Analytics from './pages/Analytics';
import Heatmap from './pages/Heatmap';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/timeline" element={<Timeline />} />
                          <Route path="/entries/new" element={<AddEntry />} />
                          <Route path="/entries/:id" element={<EntryDetail />} />
                          <Route path="/entries/:id/edit" element={<AddEntry />} />
                          <Route path="/badges" element={<BadgeVault />} />
                          <Route path="/verify-email" element={<VerifyEmail />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/heatmap" element={<Heatmap />} />
                          <Route path="/profile" element={<Profile />} />
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
