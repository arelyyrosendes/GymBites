import { useState, type JSX } from "react";
import { useLocalDB } from "../hooks/useLocalDB";

export default function AccountPage(): JSX.Element {
  const { db, setDb } = useLocalDB();
  const [displayName, setDisplayName] = useState(db.account.displayName ?? "");
  const [goal, setGoal] = useState(db.account.goal ?? "");

  const save = () => {
    setDb((prev) => ({
      ...prev,
      account: {
        ...prev.account,
        displayName: displayName.trim() || "User",
        goal: goal.trim() || undefined,
      },
    }));
  };

  const resetAll = () => {
    const ok = confirm("Reset all GymBites data? This cannot be undone.");
    if (!ok) return;
    localStorage.removeItem("gymbites_db_v1");
    window.location.reload();
  };

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>Account</h1>
        <p className="muted">Settings + profile (local-only for now)</p>
      </header>

      <section className="card stack">
        <div className="field">
          <label className="label">Display name</label>
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div className="field">
          <label className="label">Goal</label>
          <input className="input" placeholder="e.g., cut, lean bulk, maintain" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>

        <button className="btn" onClick={save}>Save</button>
      </section>

      <section className="card">
        <h2>Data</h2>
        <p className="muted small">Everything is stored in your browser (localStorage).</p>
        <button className="btnDanger" onClick={resetAll}>Reset All Data</button>
      </section>
    </div>
  );
}
