import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, type JSX } from "react";

import CalendarPage from "./pages/CalendarPage.tsx";
import WorkoutLogPage from "./pages/WorkoutLogPage";
import MealsPage from "./pages/MealsPage";
import AccountPage from "./pages/AccountPage";
import LoginPage from "./pages/LoginPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import BottomNav from "./components/BottomNav";
import { useAuth } from "./contexts/AuthContext";

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="appShell">
        <div className="appContent">
          <div className="page">
            <p className="muted">Checking your account…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PublicOnly({ children }: { children: JSX.Element }): JSX.Element {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="appShell">
        <div className="appContent">
          <div className="page">
            <p className="muted">Loading your app…</p>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/calendar" replace />;
  }

  return children;
}

export default function App(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, initializing } = useAuth();

  const tabs = [
    { label: "Dashboard", path: "/calendar" },
    { label: "Workouts", path: "/workouts" },
    { label: "Meals", path: "/meals" },
    { label: "Profile", path: "/account" },
  ];

  const mainAppPaths = ["/calendar", "/workouts", "/meals", "/account"];

  const showBottomNav =
    !!user && mainAppPaths.some((path) => location.pathname.startsWith(path));

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => location.pathname.startsWith(tab.path))
  );

  useEffect(() => {
    const titleMap: Record<string, string> = {
      "/calendar": "GymBites • Dashboard",
      "/workouts": "GymBites • Workouts",
      "/meals": "GymBites • Meals",
      "/account": "GymBites • Profile",
      "/login": "GymBites • Login",
      "/create-account": "GymBites • Create Account",
    };

    const matchedPath =
      Object.keys(titleMap).find((path) => location.pathname.startsWith(path)) ?? "";

    document.title = matchedPath ? titleMap[matchedPath] : "GymBites";
  }, [location.pathname]);

  if (initializing) {
    return (
      <div className="appShell">
        <div className="appContent">
          <div className="page">
            <p className="muted">Loading GymBites…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appShell">
      <div className="appContent">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={user ? "/calendar" : "/login"} replace />}
          />

          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />

          <Route
            path="/create-account"
            element={
              <PublicOnly>
                <CreateAccountPage />
              </PublicOnly>
            }
          />

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

          <Route
            path="*"
            element={<Navigate to={user ? "/calendar" : "/login"} replace />}
          />
        </Routes>
      </div>

      {showBottomNav ? (
        <BottomNav
          items={tabs}
          activeIndex={activeIndex}
          onChange={(idx) => navigate(tabs[idx]!.path)}
        />
      ) : null}
    </div>
  );
}