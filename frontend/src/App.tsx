import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import { TransactionsPage } from './pages/dashboard/TransactionsPage';
import { TaxLotsPage } from './pages/dashboard/TaxLotsPage';
import { ESGPage } from './pages/dashboard/ESGPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { TradePage } from './pages/dashboard/TradePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected — wrapped in AppShell */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/transactions" element={<TransactionsPage />} />
                    <Route path="/tax-lots" element={<TaxLotsPage />} />
                    <Route path="/esg" element={<ESGPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/trade" element={<TradePage />} />
                  </Routes>
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
