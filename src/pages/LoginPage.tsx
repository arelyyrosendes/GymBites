import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type LocationState = { from?: string };

export default function LoginPage(): JSX.Element {
  const { signInWithEmail, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | undefined)?.from ?? "/calendar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await signInWithEmail(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not sign in.";
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
        <h1>Welcome back</h1>
        <p className="muted">Sign in to continue tracking your training.</p>
      </header>

      <form className="card stack" onSubmit={submit}>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? <p className="muted" style={{ color: "#ffb4b4" }}>{error}</p> : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <button className="btnGhost" type="button" disabled={loading} onClick={handleGoogle}>
          Continue with Google
        </button>
      </form>

      <div className="card">
        <p className="muted">
          New here? <Link to="/create-account">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
