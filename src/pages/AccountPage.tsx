import { useState, type JSX } from "react";
import { useRemoteDB } from "../hooks/useRemoteDB";
import { useAuth } from "../contexts/AuthContext";

export default function AccountPage(): JSX.Element {
  const { db, setDb } = useRemoteDB();
  const { user, signOutUser } = useAuth();

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

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h1>Account</h1>
          <p className="muted">
            Signed in as {user?.email ?? "unknown"} • Profile Settings
          </p>
        </div>
      </header>

      <section className="card stack">
        <div className="field">
          <label className="label">Display name</label>
          <input
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label">Goal</label>
          <input
            className="input"
            placeholder="e.g., cut, lean bulk, maintain"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        <button className="btn" onClick={save}>
          Save
        </button>
      </section>

      <section className="card">
        <div className="rowBetween">
          <div>
            <h2>Log out</h2>
            <p className="muted small">Sign out of your GymBites account.</p>
          </div>

          <button className="btnGhost" onClick={() => void signOutUser()}>
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}