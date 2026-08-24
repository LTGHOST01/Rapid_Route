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
    <div className="flex min-h-full flex-col bg-soft">
      <div className="bg-header px-4 py-3 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <div className="text-[18px] font-bold">RapidRoute</div>
            <div className="text-[12px] text-white/80">Emergency Vehicle Dispatch &amp; Routing System</div>
          </div>
          <div className="text-right text-[11px] text-white/75">
            <div>Problem statement RIH-PS-011</div>
            <div>Academic prototype · v1.0</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 py-10">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-3 border border-line bg-white p-5">
          <h1 className="border-b border-line pb-2 text-[18px] font-bold">
            {mode === "login" ? "User Login" : "Register"}
          </h1>
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
            {pending ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
          </Button>
          <button
            type="button"
            className="text-[13px] text-nav underline"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "New user? Register" : "Already registered? Login"}
          </button>

          <div className="border border-line bg-soft p-3 text-[12px]">
            <div className="mb-1 font-bold">Test accounts (for demo)</div>
            <table className="w-full text-left">
              <tbody>
                <tr>
                  <td className="py-0.5 pr-2 font-medium">Dispatcher</td>
                  <td className="py-0.5 font-mono text-[11px]">dispatcher@rapidroute.local</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-2 font-medium">Admin</td>
                  <td className="py-0.5 font-mono text-[11px]">admin@rapidroute.local</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-2 font-medium">Password</td>
                  <td className="py-0.5 font-mono text-[11px]">RapidRoute!dispatch / RapidRoute!admin</td>
                </tr>
              </tbody>
            </table>
          </div>
        </form>
      </div>

      <footer className="border-t border-line bg-white px-4 py-2 text-center text-[11px] text-muted">
        RapidRoute v1.0 · RIH-PS-011 · Google Routes + local scoring · not a commercial product
      </footer>
    </div>
  );
}
