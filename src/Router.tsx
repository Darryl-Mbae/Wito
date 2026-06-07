import { Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./routes/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Website from "./pages/Website";
import NotFound from "./pages/NotFound";

// Dashboard pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import Events from "./pages/dashboard/Events";
import Directors from "./pages/dashboard/Directors";
import Settings from "./pages/dashboard/Settings";
import HelpSupport from "./pages/dashboard/HelpSupport";
import CreateClub from "./pages/CreateClub";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Unsubscribe from "./pages/Unsubscribe";
import AcceptInvitation from "./pages/AcceptInvitation";
import TermsOfService from "./pages/TermsOfService";
import EventPublic from "./pages/EventPublic";
import EventDetail from "./pages/dashboard/EventDetail";
import CalendarPage from "./pages/dashboard/CalendarPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Website />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route path="/accept-invite" element={<AcceptInvitation />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/event/:id" element={<EventPublic />} />
      <Route path="/reset-password-confirm" element={<ResetPasswordPage />} />

      {/* Dashboard Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="events/:eventId" element={<EventDetail />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="events" element={<Events />} />
        <Route path="directors" element={<Directors />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<HelpSupport />} />
        <Route path="create-club" element={<CreateClub />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}