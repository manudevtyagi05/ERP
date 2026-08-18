import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import GuestRoute from '../components/GuestRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Board from '../pages/Board';
import Backlog from '../pages/Backlog';
import Roadmap from '../pages/Roadmap';
import ReleasesView from '../pages/ReleasesView';
import ComponentsView from '../pages/ComponentsView';
import FiltersView from '../pages/FiltersView';
import AutomationView from '../pages/AutomationView';
import AdminView from '../pages/AdminView';
import AdminRoute from '../components/AdminRoute';
import Projects from '../pages/Projects';
import Work from '../pages/Work';
import Issues from '../pages/Issues';
import Team from '../pages/Team';
import Reports from '../pages/Reports';
import CalendarView from '../pages/CalendarView';
import NotificationsView from '../pages/NotificationsView';
import SettingsView from '../pages/SettingsView';
import NotFound from '../pages/NotFound';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/board" element={<Board />} />
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/releases" element={<ReleasesView />} />
          <Route path="/components" element={<ComponentsView />} />
          <Route path="/filters" element={<FiltersView />} />
          <Route path="/automation" element={<AutomationView />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminView />
              </AdminRoute>
            }
          />
          <Route path="/projects" element={<Projects />} />
          <Route path="/work" element={<Work />} />
          <Route path="/work/:filter" element={<Work />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/teams" element={<Team />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/notifications" element={<NotificationsView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
