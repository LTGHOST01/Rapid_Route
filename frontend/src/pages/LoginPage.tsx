import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button, Field, inputClass } from "../components/ui";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const { user, ready, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
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
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-full bg-white">
      <div className="relative hidden w-[46%] overflow-hidden border-r border-line bg-soft lg:block">
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-critical text-white">+</span>
              <span className="text-[20px] font-semibold">RapidRoute</span>
            </div>
            <h1 className="mt-10 max-w-sm text-[34px] font-semibold leading-tight tracking-tight">
              Emergency routing that stays accountable.
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
              Google supplies the roads. RapidRoute chooses the vehicle, scores the
              candidates, and records why the route changed.
            </p>
          </div>
          <p className="text-[13px] text-muted">A dispatch decision layer — not a maps replacement.</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <div className="text-[13px] font-medium text-muted">RapidRoute</div>
            <h2 className="mt-1 text-[24px] font-semibold">
              {mode === "login" ? "Sign in to dispatch" : "Create a dispatcher account"}
            </h2>
          </div>
          {mode === "register" && (
            <Field label="Name">
              <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          )}
          <Field label="Email">
            <input className={inputClass()} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass()}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && <p className="text-[13px] text-critical">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Working…" : mode === "login" ? "Enter console" : "Create account"}
          </Button>
          <button
            type="button"
            className="text-[13px] text-nav"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
          </button>
          <p className="text-[12px] leading-relaxed text-muted">
            Demo: dispatcher@rapidroute.local / RapidRoute!dispatch
          </p>
        </form>
      </div>
    </div>
  );
}
