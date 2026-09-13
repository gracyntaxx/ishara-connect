import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SUPPORTED_SIGNS, type SignLabel } from "../lib/constants";

export interface PracticeAttempt {
  id: string;
  sign: SignLabel;
  isCorrect: boolean;
  confidence: number;
  timestamp: number;
}

export interface PracticeSignStats {
  sign: SignLabel;
  attempts: number;
  correct: number;
  bestConfidence: number;
  lastPracticed: number | null;
}

interface PracticeState {
  targetSign: SignLabel | null;
  attempts: PracticeAttempt[];
  signStats: Record<SignLabel, PracticeSignStats>;
  currentStreak: number;
  bestStreak: number;
  sessionStartTime: number | null;
  isActive: boolean;

  setTargetSign: (sign: SignLabel | null) => void;
  addAttempt: (attempt: Omit<PracticeAttempt, "id">) => void;
  clearAttempts: () => void;
  startSession: () => void;
  endSession: () => void;
  setActive: (active: boolean) => void;
  reset: () => void;
  getAccuracy: (sign: SignLabel) => number;
  getOverallAccuracy: () => number;
}

const initialSignStats = SUPPORTED_SIGNS.reduce(
  (acc, sign) => {
    acc[sign] = {
      sign,
      attempts: 0,
      correct: 0,
      bestConfidence: 0,
      lastPracticed: null,
    };
    return acc;
  },
  {} as Record<SignLabel, PracticeSignStats>,
);

const initialState = {
  targetSign: null,
  attempts: [],
  signStats: initialSignStats,
  currentStreak: 0,
  bestStreak: 0,
  sessionStartTime: null,
  isActive: false,
};

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTargetSign: (sign) => set({ targetSign: sign }),
      addAttempt: (attempt) =>
        set((state) => {
          const newAttempt = {
            ...attempt,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          };
          const newStreak = attempt.isCorrect ? state.currentStreak + 1 : 0;
          const signStat = state.signStats[attempt.sign];
          const updatedStat: PracticeSignStats = {
            ...signStat,
            attempts: signStat.attempts + 1,
            correct: signStat.correct + (attempt.isCorrect ? 1 : 0),
            bestConfidence: Math.max(signStat.bestConfidence, attempt.confidence),
            lastPracticed: Date.now(),
          };
          return {
            attempts: [...state.attempts, newAttempt].slice(-100),
            signStats: { ...state.signStats, [attempt.sign]: updatedStat },
            currentStreak: newStreak,
            bestStreak: Math.max(state.bestStreak, newStreak),
          };
        }),
      clearAttempts: () => set({ attempts: [] }),
      startSession: () => set({ sessionStartTime: Date.now(), isActive: true }),
      endSession: () => set({ sessionStartTime: null, isActive: false }),
      setActive: (active) => set({ isActive: active }),
      reset: () => set(initialState),

      getAccuracy: (sign: SignLabel) => {
        const stat = get().signStats[sign];
        if (stat.attempts === 0) return 0;
        return (stat.correct / stat.attempts) * 100;
      },
      getOverallAccuracy: () => {
        const stats = get().signStats;
        const totalAttempts = Object.values(stats).reduce((sum, s) => sum + s.attempts, 0);
        const totalCorrect = Object.values(stats).reduce((sum, s) => sum + s.correct, 0);
        if (totalAttempts === 0) return 0;
        return (totalCorrect / totalAttempts) * 100;
      },
    }),
    {
      name: "ishara-practice-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        signStats: state.signStats,
        bestStreak: state.bestStreak,
      }),
    },
  ),
);

export function usePracticeActions() {
  const {
    targetSign,
    attempts,
    signStats,
    currentStreak,
    bestStreak,
    sessionStartTime,
    isActive,
    setTargetSign,
    addAttempt,
    clearAttempts,
    startSession,
    endSession,
    setActive,
    reset,
  } = usePracticeStore();

  const getAccuracy = (sign: SignLabel) => {
    const stat = signStats[sign];
    if (stat.attempts === 0) return 0;
    return (stat.correct / stat.attempts) * 100;
  };

  const getOverallAccuracy = () => {
    const totalAttempts = Object.values(signStats).reduce((sum, s) => sum + s.attempts, 0);
    const totalCorrect = Object.values(signStats).reduce((sum, s) => sum + s.correct, 0);
    if (totalAttempts === 0) return 0;
    return (totalCorrect / totalAttempts) * 100;
  };

  return {
    targetSign,
    attempts,
    signStats,
    currentStreak,
    bestStreak,
    sessionStartTime,
    isActive,
    setTargetSign,
    addAttempt,
    clearAttempts,
    startSession,
    endSession,
    setActive,
    reset,
    getAccuracy,
    getOverallAccuracy,
  };
}
