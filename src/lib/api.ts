/**
 * Lightweight API client for the Ishara backend and database.
 *
 * Reads base URL dynamically from useSettingsStore or VITE_API_URL.
 * When the backend is unreachable, methods gracefully return null so the
 * frontend seamlessly falls back to 100% client-side local recognition.
 */

import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

function getBaseUrl(): string {
  try {
    const storeUrl = useSettingsStore.getState().apiUrl;
    if (storeUrl && storeUrl.trim()) return storeUrl.trim().replace(/\/$/, "");
  } catch {
    // fallback if store not yet initialized
  }
  return (
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000"
  ).replace(/\/$/, "");
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; details?: unknown };
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T> | null> {
  const token = useAuthStore.getState().token;
  const baseUrl = getBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = (await res.json()) as ApiResponse<T>;
    return json;
  } catch {
    // Backend is unreachable or timed out — graceful client-side fallback
    return null;
  }
}

// ─── Auth ──────────────────────────────────────────────────

import { getSupabase } from "./supabase";

export async function apiRegister(name: string, email: string, password: string): Promise<ApiResponse<{ user: { id: string; name: string; email: string }; token: string }> | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        return {
          success: false,
          message: error.message || "Registration failed",
        };
      }

      if (data.user) {
        // If session exists (email confirmation disabled or auto-confirmed)
        const token = data.session?.access_token || "supabase_auth_session";
        return {
          success: true,
          data: {
            user: {
              id: data.user.id,
              name: data.user.user_metadata?.name || name || "User",
              email: data.user.email || email,
            },
            token,
          },
          message: data.session
            ? "Account created successfully!"
            : "Account created! You can now sign in with your credentials.",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Failed to connect to authentication service.",
      };
    }
  }

  // Fallback to custom HTTP backend if configured
  return request<{ user: { id: string; name: string; email: string }; token: string }>(
    "/api/auth/register",
    { method: "POST", body: JSON.stringify({ name, email, password }) },
  );
}

export async function apiLogin(email: string, password: string): Promise<ApiResponse<{ user: { id: string; name: string; email: string }; token: string }> | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.toLowerCase().includes("invalid login credentials")) {
          msg = "Invalid email or password. If you don't have an account yet, click 'Register' above to create one!";
        }
        return {
          success: false,
          message: msg,
        };
      }

      if (data.user) {
        const token = data.session?.access_token || "supabase_auth_session";
        return {
          success: true,
          data: {
            user: {
              id: data.user.id,
              name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
              email: data.user.email || email,
            },
            token,
          },
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Authentication service error. Please try again.",
      };
    }
  }

  // Fallback to custom HTTP backend if configured
  return request<{ user: { id: string; name: string; email: string }; token: string }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
}

export async function apiGetMe() {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        return {
          success: true,
          data: {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
            email: data.user.email || "",
          },
        };
      }
    } catch {
      // ignore
    }
  }
  return request<{ id: string; name: string; email: string }>("/api/auth/me");
}

// ─── Rooms ─────────────────────────────────────────────────

export async function apiCreateRoom(displayName: string) {
  return request<{ roomId: string; expiresAt: string }>(
    "/api/rooms",
    { method: "POST", body: JSON.stringify({ displayName }) },
  );
}

export async function apiJoinRoom(roomId: string, displayName: string) {
  return request<{ roomId: string; status: string }>(
    `/api/rooms/${roomId}/join`,
    { method: "POST", body: JSON.stringify({ displayName }) },
  );
}

export async function apiGetRoom(roomId: string) {
  return request<{ roomId: string; status: string; participants: unknown[] }>(
    `/api/rooms/${roomId}`,
  );
}

// ─── Progress & Practice ───────────────────────────────────

import { syncProgressToSupabase, getSupabaseLeaderboard, testSupabaseConnection } from "./supabase";

export async function apiSaveProgress(sign: string, score: number, correct: boolean) {
  const userId = useAuthStore.getState().user?.id || "guest";
  const supabase = getSupabase();
  if (supabase) {
    try {
      const data = await syncProgressToSupabase(userId, sign, score, correct);
      if (data) return { success: true, data };
    } catch {
      // fallback
    }
  }
  return request<{ sign: string; attempts: number; correctAttempts: number }>(
    "/api/progress",
    { method: "POST", body: JSON.stringify({ sign, score, correct }) },
  );
}

export async function apiGetProgress() {
  const userId = useAuthStore.getState().user?.id;
  const supabase = getSupabase();
  if (supabase && userId) {
    try {
      const { data } = await supabase.from("progress").select("*").eq("user_id", userId);
      if (data) {
        return {
          success: true,
          data: data.map((item: any) => ({
            sign: item.sign,
            attempts: item.attempts || 0,
            correctAttempts: item.correct_attempts || 0,
            bestScore: Number(item.best_score || 0),
            mastered: Boolean(item.mastered),
          })),
        };
      }
    } catch {
      // fallback
    }
  }
  return request<
    Array<{
      sign: string;
      attempts: number;
      correctAttempts: number;
      bestScore: number;
      mastered: boolean;
    }>
  >("/api/progress");
}

// ─── Badges ────────────────────────────────────────────────

export async function apiGetBadges() {
  return request<Array<{ key: string; name: string; description: string }>>("/api/badges");
}

export async function apiGetMyBadges() {
  const userId = useAuthStore.getState().user?.id;
  const supabase = getSupabase();
  if (supabase && userId) {
    try {
      const { data } = await supabase.from("badges").select("*").eq("user_id", userId);
      if (data) {
        return {
          success: true,
          data: data.map((item: any) => ({
            badgeKey: item.badge_key,
            earnedAt: item.earned_at,
          })),
        };
      }
    } catch {
      // fallback
    }
  }
  return request<Array<{ badgeKey: string; earnedAt: string }>>("/api/badges/me");
}

// ─── Leaderboard ───────────────────────────────────────────

export async function apiGetLeaderboard() {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const lb = await getSupabaseLeaderboard();
      if (lb) {
        return { success: true, data: lb };
      }
    } catch {
      // fallback
    }
  }
  return request<Array<{ rank: number; name: string; score: number; masteredSigns: number }>>(
    "/api/leaderboard",
  );
}

// ─── Database & Server Health ──────────────────────────────

export async function apiHealthCheck(): Promise<{
  success: boolean;
  status: string;
  database: string;
  uptime?: number;
  latencyMs: number;
}> {
  const supabase = getSupabase();
  if (supabase) {
    const check = await testSupabaseConnection();
    return {
      success: check.success,
      status: check.success ? "ok" : "error",
      database: check.success ? "Supabase (connected)" : "disconnected",
      latencyMs: check.latencyMs || 0,
    };
  }

  const start = performance.now();
  const res = await request<{ status: string; database: string; uptime?: number }>("/api/health");
  const latencyMs = Math.round(performance.now() - start);

  if (!res || !res.success) {
    return {
      success: false,
      status: "unreachable",
      database: "disconnected",
      latencyMs,
    };
  }

  return {
    success: true,
    status: res.data?.status ?? "ok",
    database: res.data?.database ?? "connected",
    uptime: res.data?.uptime,
    latencyMs,
  };
}
