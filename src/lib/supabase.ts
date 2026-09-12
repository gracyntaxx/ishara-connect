import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSettingsStore } from "@/stores/useSettingsStore";

let cachedClient: SupabaseClient | null = null;
let cachedUrl: string | null = null;
let cachedKey: string | null = null;

export function getSupabaseCredentials(): { url: string; key: string } {
  let storeUrl = "";
  let storeKey = "";
  try {
    const store = useSettingsStore.getState();
    storeUrl = store.supabaseUrl || "";
    storeKey = store.supabaseAnonKey || "";
  } catch {
    // store not ready yet
  }

  const envUrl = (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : "") || "";
  const envKey = (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_ANON_KEY : "") || "";

  // Clean URL in case /rest/v1 or trailing slash was appended
  let url = (storeUrl || envUrl || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  let key = (storeKey || envKey || "").trim();

  return { url, key };
}

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.warn("Failed to initialize Supabase client:", err);
    return null;
  }
}

/**
 * Pings Supabase to verify connectivity and measure latency
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
}> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return {
      success: false,
      message: "Supabase URL and Anon Key are not configured.",
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: "Could not create Supabase client with current credentials.",
    };
  }

  const start = performance.now();
  try {
    const { error } = await supabase.auth.getSession();
    const latencyMs = Math.round(performance.now() - start);

    if (error && error.status && error.status >= 500) {
      return {
        success: false,
        message: `Supabase returned server error: ${error.message}`,
        latencyMs,
      };
    }

    return {
      success: true,
      message: `Connected to Supabase PostgreSQL Database (${latencyMs}ms)`,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      message: err?.message || "Failed to reach Supabase project.",
      latencyMs,
    };
  }
}

/**
 * Complete SQL Schema Migration script for Supabase SQL editor
 */
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- Ishara Connect Database Schema for Supabase
-- Copy and run this in your Supabase SQL Editor:
-- ========================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  total_sessions INT DEFAULT 0,
  signs_practiced INT DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Practice Progress Table
CREATE TABLE IF NOT EXISTS public.progress (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  sign TEXT NOT NULL,
  attempts INT DEFAULT 0,
  correct_attempts INT DEFAULT 0,
  best_score NUMERIC DEFAULT 0,
  mastered BOOLEAN DEFAULT FALSE,
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sign)
);

-- 3. Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

-- 4. Video Call Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL,
  host_name TEXT NOT NULL,
  engine TEXT DEFAULT 'zego',
  mode TEXT DEFAULT 'gestures',
  status TEXT DEFAULT 'active',
  participants JSONB DEFAULT '[]'::JSONB,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. General Awareness Likes Table
CREATE TABLE IF NOT EXISTS public.awareness_likes (
  id BIGSERIAL PRIMARY KEY,
  article_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awareness_likes ENABLE ROW LEVEL SECURITY;

-- 7. Grant Permissive Policies for Web Access
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Public access progress" ON public.progress;
  DROP POLICY IF EXISTS "Public access badges" ON public.badges;
  DROP POLICY IF EXISTS "Public access rooms" ON public.rooms;
  DROP POLICY IF EXISTS "Public access awareness_likes" ON public.awareness_likes;
END $$;

CREATE POLICY "Public access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access progress" ON public.progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access badges" ON public.badges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access awareness_likes" ON public.awareness_likes FOR ALL USING (true) WITH CHECK (true);

-- 8. Grant Table Privileges to anon & authenticated roles
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.progress TO anon, authenticated;
GRANT ALL ON public.badges TO anon, authenticated;
GRANT ALL ON public.rooms TO anon, authenticated;
GRANT ALL ON public.awareness_likes TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
`;

// ─── Data Access Helpers ─────────────────────────────────────

// Helper: Sync Practice Progress
export async function syncProgressToSupabase(
  userId: string,
  sign: string,
  score: number,
  correct: boolean
) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: existing } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .eq("sign", sign)
      .maybeSingle();

    if (existing) {
      const attempts = (existing.attempts || 0) + 1;
      const correctAttempts = (existing.correct_attempts || 0) + (correct ? 1 : 0);
      const bestScore = Math.max(existing.best_score || 0, score);
      const mastered = bestScore >= 0.85;

      const { data } = await supabase
        .from("progress")
        .update({
          attempts,
          correct_attempts: correctAttempts,
          best_score: bestScore,
          mastered,
          last_practiced_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      return data;
    } else {
      const { data } = await supabase
        .from("progress")
        .insert({
          user_id: userId,
          sign,
          attempts: 1,
          correct_attempts: correct ? 1 : 0,
          best_score: score,
          mastered: score >= 0.85,
          last_practiced_at: new Date().toISOString(),
        })
        .select()
        .single();

      return data;
    }
  } catch (e) {
    console.warn("Supabase progress sync note:", e);
    return null;
  }
}

// Helper: Unlock and Save a Badge
export async function unlockSupabaseBadge(
  userId: string,
  badgeKey: string,
  badgeName: string
) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from("badges")
      .upsert(
        {
          user_id: userId,
          badge_key: badgeKey,
          badge_name: badgeName,
          earned_at: new Date().toISOString(),
        },
        { onConflict: "user_id,badge_key" }
      )
      .select()
      .single();

    return data;
  } catch (e) {
    console.warn("Supabase badge unlock note:", e);
    return null;
  }
}

// Helper: Get Badges for User
export async function getSupabaseBadges(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data } = await supabase
      .from("badges")
      .select("*")
      .eq("user_id", userId);

    return data || [];
  } catch (e) {
    console.warn("Supabase badges read note:", e);
    return [];
  }
}

// Helper: Fetch Leaderboard from Supabase
export async function getSupabaseLeaderboard() {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from("progress")
      .select("user_id, sign, best_score, mastered")
      .order("best_score", { ascending: false });

    if (!data || data.length === 0) return null;

    // Aggregate by user
    const userMap = new Map<string, { totalScore: number; masteredCount: number }>();
    data.forEach((item) => {
      const current = userMap.get(item.user_id) || { totalScore: 0, masteredCount: 0 };
      current.totalScore += Number(item.best_score || 0);
      if (item.mastered) current.masteredCount += 1;
      userMap.set(item.user_id, current);
    });

    const entries = Array.from(userMap.entries()).map(([userId, stats], index) => ({
      rank: index + 1,
      name: userId.length > 12 ? `User ${userId.slice(0, 6)}` : userId,
      score: Math.min(100, Math.round((stats.totalScore / 8) * 100)),
      masteredSigns: stats.masteredCount,
    }));

    return entries.sort((a, b) => b.score - a.score);
  } catch (e) {
    console.warn("Supabase leaderboard note:", e);
    return null;
  }
}
