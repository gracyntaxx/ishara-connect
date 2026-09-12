import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar, Footer } from "../components";
import { useAuthStore } from "../stores";
import { apiLogin, apiRegister } from "../lib/api";
import { AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser, setToken, setGuest } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        if (!email.trim()) {
          setError("Email is required");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const res = await apiRegister(name.trim(), email.trim(), password);
        if (!res) {
          setError("Authentication service is temporarily unavailable. You can continue as Guest.");
          setLoading(false);
          return;
        }
        if (!res.success || !res.data) {
          setError(res.message || "Registration failed. Please check your details.");
          setLoading(false);
          return;
        }

        setUser({ id: res.data.user.id, name: res.data.user.name, email: res.data.user.email });
        setToken(res.data.token);
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => {
          navigate({ to: "/room" });
        }, 800);
      } else {
        if (!email.trim() || !password) {
          setError("Email and password are required");
          setLoading(false);
          return;
        }

        const res = await apiLogin(email.trim(), password);
        if (!res) {
          setError("Authentication service is temporarily unreachable. You can continue as Guest.");
          setLoading(false);
          return;
        }
        if (!res.success || !res.data) {
          setError(res.message || "Invalid email or password");
          setLoading(false);
          return;
        }
        setUser({ id: res.data.user.id, name: res.data.user.name, email: res.data.user.email });
        setToken(res.data.token);
        setSuccessMessage("Signed in successfully! Redirecting...");
        setTimeout(() => {
          navigate({ to: "/room" });
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setGuest("Guest");
    navigate({ to: "/room" });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#e8eaed] p-8 shadow-sm">
            <div className="text-center mb-8">
              <img src="/ishara-mark.svg" alt="" className="h-10 w-10 mx-auto mb-4" />
              <h1 className="text-2xl font-normal text-[#202124]">
                {mode === "login" ? "Sign in to Ishara" : "Create your account"}
              </h1>
              <p className="mt-2 text-sm text-[#5f6368]">
                {mode === "login"
                  ? "Track your practice progress and earn badges"
                  : "Start practicing sign language today"}
              </p>
            </div>

            {/* Tab toggle */}
            <div className="flex rounded-full bg-[#f1f3f4] p-1 mb-6">
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
                  mode === "login" ? "bg-white text-[#202124] shadow-sm" : "text-[#5f6368]"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
                  mode === "register" ? "bg-white text-[#202124] shadow-sm" : "text-[#5f6368]"
                }`}
              >
                Register
              </button>
            </div>

            {successMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 mb-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-800">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-[#fef2f2] border border-[#fecaca] px-4 py-3 mb-4">
                <AlertCircle className="h-4 w-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[#dc2626]">
                  <p>{error}</p>
                  {error.includes("Register") && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setError("");
                      }}
                      className="mt-1.5 font-medium underline hover:text-[#b91c1c] block"
                    >
                      Click here to Register an account →
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#202124] mb-1.5">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-[#dadce0] px-4 py-2.5 text-sm text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#202124] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#dadce0] px-4 py-2.5 text-sm text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#202124] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                  className="w-full rounded-lg border border-[#dadce0] px-4 py-2.5 text-sm text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#3b82f6] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2563eb] disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign in" : "Create account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Google placeholder */}
            <div className="mt-4">
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e8eaed]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[#80868b]">or</span>
                </div>
              </div>

              <button
                disabled
                className="w-full flex items-center justify-center gap-3 rounded-full border border-[#dadce0] px-6 py-2.5 text-sm font-medium text-[#80868b] cursor-not-allowed"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285f4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google — coming soon
              </button>
            </div>
          </div>

          {/* Guest mode */}
          <div className="text-center mt-6">
            <button
              onClick={handleGuest}
              className="text-sm text-[#5f6368] hover:text-[#3b82f6] transition-colors"
            >
              Continue as guest →
            </button>
            <p className="mt-2 text-xs text-[#80868b]">
              No account needed for calls and practice. Progress won't be saved to your profile.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
