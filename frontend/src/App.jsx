import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import VenuesPage from './pages/VenuesPage.jsx';
import VenueDetailPage from './pages/VenueDetailPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BookingsPage from './pages/BookingsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import EquipmentPage from './pages/EquipmentPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import GroundsPage from './pages/GroundsPage.jsx';
import GroundDetailPage from './pages/GroundDetailPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import TimetablePage from './pages/TimetablePage.jsx';
import SportsPage from './pages/SportsPage.jsx';
import TournamentPage from './pages/TournamentPage.jsx';
import QRPage from './pages/QRPage.jsx';
import PageShell from './components/PageShell.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

function PrivateRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <div className="page-loading">Checking your session…</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return <PageShell><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/venues" element={<VenuesPage />} />
    <Route path="/venues/:id" element={<VenueDetailPage />} />
    <Route path="/sports" element={<PrivateRoute><SportsPage /></PrivateRoute>} />
    <Route path="/grounds" element={<PrivateRoute><GroundsPage /></PrivateRoute>} />
    <Route path="/grounds/:id" element={<PrivateRoute><GroundDetailPage /></PrivateRoute>} />
    <Route path="/inventory" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
    <Route path="/bookings" element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
    <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
    <Route path="/equipment" element={<PrivateRoute><EquipmentPage /></PrivateRoute>} />
    <Route path="/timetable" element={<PrivateRoute><TimetablePage /></PrivateRoute>} />
    <Route path="/tournaments" element={<PrivateRoute><TournamentPage /></PrivateRoute>} />
    <Route path="/qr" element={<PrivateRoute><QRPage /></PrivateRoute>} />
    <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
    <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></PageShell>;
}
export default App;
