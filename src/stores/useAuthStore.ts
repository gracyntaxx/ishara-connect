import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isGuest: boolean;
  guestName: string;

  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setGuest: (name: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  getDisplayName: () => string;
}

const initialState = {
  user: null as AuthUser | null,
  token: null as string | null,
  isGuest: true,
  guestName: "Guest",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user, isGuest: !user }),
      setToken: (token) => set({ token }),

      setGuest: (name) =>
        set({ user: null, token: null, isGuest: true, guestName: name || "Guest" }),

      logout: () => set(initialState),

      isAuthenticated: () => Boolean(get().token && get().user),

      getDisplayName: () => {
        const state = get();
        return state.user?.name ?? state.guestName;
      },
    }),
    {
      name: "ishara-auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isGuest: state.isGuest,
        guestName: state.guestName,
      }),
    },
  ),
);
