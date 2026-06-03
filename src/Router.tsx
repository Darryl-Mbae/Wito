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
import Calendar from "./pages/dashboard/Calendar";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Website />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />

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
        <Route path="calendar" element={<Calendar />} />
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