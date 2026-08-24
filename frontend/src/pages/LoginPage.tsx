import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button, Field, inputClass } from "../components/ui";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const { user, ready, login } = useAuth();
  const [email, setEmail] = useState("dispatcher@rapidroute.local");
  const [password, setPassword] = useState("RapidRoute!dispatch");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-full bg-ink-950">
      <div className="relative hidden w-[46%] overflow-hidden border-r border-ink-700 lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#14171c_0%,#0c0e11_55%,#1c2128_100%)]" />
        <div className="absolute inset-8 border border-ink-700/80" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-brass">
              Operations console
            </div>
            <h1 className="mt-6 max-w-sm text-4xl font-semibold leading-tight tracking-tight">
              Route decisions for emergency dispatch.
            </h1>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ash-300">
              Google supplies the roads. RapidRoute chooses the vehicle, scores
              the candidates, and keeps an accountable record when the corridor
              changes.
            </p>
          </div>
          <p className="text-[12px] text-ash-400">
            Not a replacement for Maps. A decision layer on top of it.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-brass">
              RapidRoute
            </div>
            <h2 className="mt-2 text-2xl font-semibold">Sign in to dispatch</h2>
          </div>
          <Field label="Email">
            <input
              className={inputClass()}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass()}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          {error && <p className="text-[13px] text-red-300">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Enter console"}
          </Button>
          <p className="text-[12px] leading-relaxed text-ash-400">
            Demo: <span className="text-ash-300">dispatcher@rapidroute.local</span> /{" "}
            RapidRoute!dispatch
            <br />
            Admin: <span className="text-ash-300">admin@rapidroute.local</span> /{" "}
            RapidRoute!admin
          </p>
        </form>
      </div>
    </div>
  );
}
