import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import useEnsureUserProfile from '@/hooks/useEnsureUserProfile';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import LandingPage from '@/pages/LandingPage';
import MapPage from '@/pages/MapPage';
import ComplaintsPage from '@/pages/ComplaintsPage';
import ComplaintDetailPage from '@/pages/ComplaintDetailPage';
import ReportPage from '@/pages/ReportPage';
import ContractorsPage from '@/pages/ContractorsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import AIAssistantPage from '@/pages/AIAssistantPage';
import ProfilePage from '@/pages/ProfilePage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import RoadDetailPage from '@/pages/RoadDetailPage';
import WardProfilePage from '@/pages/WardProfilePage';
import AuthoritySelectorPage from '@/pages/AuthoritySelectorPage';
import JuniorOfficerDashboard from '@/pages/authority/JuniorOfficerDashboard';
import RoadInspectorDashboard from '@/pages/authority/RoadInspectorDashboard';
import ExecutiveEngineerDashboard from '@/pages/authority/ExecutiveEngineerDashboard';
import DistrictAuthorityDashboard from '@/pages/authority/DistrictAuthorityDashboard';
import StateAuthorityDashboard from '@/pages/authority/StateAuthorityDashboard';
import SuperAdminDashboard from '@/pages/authority/SuperAdminDashboard';
import PublicGovernancePage from '@/pages/PublicGovernancePage';
import AccidentRiskPage from '@/pages/AccidentRiskPage';
import RepairTrackingPage from '@/pages/RepairTrackingPage';
import AdminPage from '@/pages/AdminPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();
  useEnsureUserProfile(user);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-pulse-ring">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="text-sm text-muted-foreground font-medium">Loading RoadWatch...</div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      {/* Auth pages - public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Landing - no layout */}
      <Route path="/" element={<LandingPage />} />

      {/* Public app pages with shared layout */}
      <Route element={<AppLayout />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/complaints/:complaintId" element={<ComplaintDetailPage />} />
        <Route path="/forums" element={<Navigate to="/governance" replace />} />
        <Route path="/forums/:forumId" element={<Navigate to="/governance" replace />} />
        <Route path="/road/:roadId" element={<RoadDetailPage />} />
        <Route path="/wards/:wardId" element={<WardProfilePage />} />
        <Route path="/governance" element={<PublicGovernancePage />} />
        <Route path="/accident-risk" element={<AccidentRiskPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
      </Route>

      {/* Protected app pages with shared layout */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/report" element={<ReportPage />} />
          <Route path="/authority" element={<AuthoritySelectorPage />} />
          <Route path="/authority/junior-officer" element={<JuniorOfficerDashboard />} />
          <Route path="/authority/road-inspector" element={<RoadInspectorDashboard />} />
          <Route path="/authority/executive-engineer" element={<ExecutiveEngineerDashboard />} />
          <Route path="/authority/district" element={<DistrictAuthorityDashboard />} />
          <Route path="/authority/state" element={<StateAuthorityDashboard />} />
          <Route path="/authority/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/repairs" element={<RepairTrackingPage />} />
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
