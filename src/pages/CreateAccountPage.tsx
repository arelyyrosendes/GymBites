import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type LocationState = { from?: string };

export default function CreateAccountPage(): JSX.Element {
  const { signUpWithEmail, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | undefined)?.from ?? "/calendar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email.trim(), password, displayName.trim() || undefined);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create account.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="pageHeader">
        <h1>Create account</h1>
        <p className="muted">Set up your GymBites profile in seconds.</p>
      </header>

      <form className="card stack" onSubmit={submit}>
        <div className="field">
          <label className="label">Display name</label>
          <input
            className="input"
            placeholder="Optional"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? <p className="muted" style={{ color: "#ffb4b4" }}>{error}</p> : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
        <button className="btnGhost" type="button" disabled={loading} onClick={handleGoogle}>
          Continue with Google
        </button>
      </form>

      <div className="card">
        <p className="muted">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
