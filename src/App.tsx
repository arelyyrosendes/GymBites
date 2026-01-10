import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import CalendarPage from "./pages/CalendarPage.tsx";
import WorkoutLogPage from "./pages/WorkoutLogPage";
import MealsPage from "./pages/MealsPage";
import AccountPage from "./pages/AccountPage";
import BottomNav from "./components/BottomNav";
import type { JSX } from "react";

export default function App(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <div className="appShell">
      <div className="appContent">
        <Routes>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/workouts" element={<WorkoutLogPage />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </div>

      <BottomNav
        items={tabs}
        activeIndex={activeIndex}
        onChange={(idx) => navigate(tabs[idx]!.path)}
      />
    </div>
  );
}
