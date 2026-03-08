import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import CalendarPage from "./pages/CalendarPage.tsx";
import WorkoutLogPage from "./pages/WorkoutLogPage";
import MealsPage from "./pages/MealsPage";
import AccountPage from "./pages/AccountPage";
import LoginPage from "./pages/LoginPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import BottomNav from "./components/BottomNav";
import { useAuth } from "./contexts/AuthContext";
import type { JSX } from "react";

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="page">
        <p className="muted">Checking your session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default function App(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, initializing } = useAuth();

  const tabs = [
    { label: "Today", path: "/calendar" },
    { label: "Workouts", path: "/workouts" },
    { label: "Meals", path: "/meals" },
    { label: "Account", path: "/account" },
  ];

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => location.pathname.startsWith(t.path))
  );

  if (initializing) {
    return (
      <div className="appShell">
        <div className="appContent">
          <div className="page">
            <p className="muted">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appShell">
      <div className="appContent">
        <Routes>
          <Route path="/" element={<Navigate to={user ? "/calendar" : "/login"} replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-account" element={<CreateAccountPage />} />
          <Route
            path="/calendar"
            element={
              <RequireAuth>
                <CalendarPage />
              </RequireAuth>
            }
          />
          <Route
            path="/workouts"
            element={
              <RequireAuth>
                <WorkoutLogPage />
              </RequireAuth>
            }
          />
          <Route
            path="/meals"
            element={
              <RequireAuth>
                <MealsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to={user ? "/calendar" : "/login"} replace />} />
        </Routes>
      </div>
      {user ? (
        <BottomNav
          items={tabs}
          activeIndex={activeIndex}
          onChange={(idx) => navigate(tabs[idx]!.path)}
        />
      ) : null}
    </div>
  );
}
