import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DataMessage } from "../lib/signaling";
import type { SignLabel } from "../lib/constants";

export interface CallParticipant {
  id: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
}

export interface CallSession {
  roomId: string;
  localName: string;
  participants: CallParticipant[];
  isConnected: boolean;
  connectionCode: string | null;
  isInitiator: boolean;
}

export interface DialogueMessage {
  id: string;
  senderId: string;
  senderName: string;
  type: "sign" | "speech" | "system";
  text: string;
  confidence?: number;
  isFinal: boolean;
  timestamp: number;
  gloss?: string;
}

interface CallState {
  session: CallSession | null;
  messages: DialogueMessage[];
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  isScreenSharing: boolean;
  showDialoguePanel: boolean;
  showSettings: boolean;
  activeTab: "video" | "dialogue" | "participants";

  setSession: (session: CallSession | null) => void;
  updateSession: (updates: Partial<CallSession>) => void;
  addParticipant: (participant: CallParticipant) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, updates: Partial<CallParticipant>) => void;
  setConnected: (connected: boolean) => void;
  setConnectionCode: (code: string | null) => void;
  setInitiator: (isInitiator: boolean) => void;

  addMessage: (message: Omit<DialogueMessage, "id">) => void;
  updateMessage: (id: string, updates: Partial<DialogueMessage>) => void;
  clearMessages: () => void;
  setMessages: (messages: DialogueMessage[]) => void;

  toggleLocalVideo: () => void;
  setLocalVideo: (enabled: boolean) => void;
  toggleLocalAudio: () => void;
  setLocalAudio: (enabled: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;

  toggleDialoguePanel: () => void;
  setDialoguePanel: (show: boolean) => void;
  toggleSettings: () => void;
  setSettings: (show: boolean) => void;
  setActiveTab: (tab: "video" | "dialogue" | "participants") => void;

  reset: () => void;
}

const initialState = {
  session: null,
  messages: [],
  localVideoEnabled: true,
  localAudioEnabled: true,
  isScreenSharing: false,
  showDialoguePanel: true,
  showSettings: false,
  activeTab: "video" as const,
};

export const useCallStore = create<CallState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSession: (session) => set({ session }),
      updateSession: (updates) =>
        set((state) => ({
          session: state.session ? { ...state.session, ...updates } : null,
        })),
      addParticipant: (participant) =>
        set((state) => ({
          session: state.session
            ? { ...state.session, participants: [...state.session.participants, participant] }
            : null,
        })),
      removeParticipant: (id) =>
        set((state) => ({
          session: state.session
            ? {
                ...state.session,
                participants: state.session.participants.filter((p) => p.id !== id),
              }
            : null,
        })),
      updateParticipant: (id, updates) =>
        set((state) => ({
          session: state.session
            ? {
                ...state.session,
                participants: state.session.participants.map((p) =>
                  p.id === id ? { ...p, ...updates } : p,
                ),
              }
            : null,
        })),
      setConnected: (connected) =>
        set((state) => ({
          session: state.session ? { ...state.session, isConnected: connected } : null,
        })),
      setConnectionCode: (code) =>
        set((state) => ({
          session: state.session ? { ...state.session, connectionCode: code } : null,
        })),
      setInitiator: (isInitiator) =>
        set((state) => ({
          session: state.session ? { ...state.session, isInitiator } : null,
        })),

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...message, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` },
          ].slice(-200),
        })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      clearMessages: () => set({ messages: [] }),
      setMessages: (messages) => set({ messages }),

      toggleLocalVideo: () => set((state) => ({ localVideoEnabled: !state.localVideoEnabled })),
      setLocalVideo: (enabled) => set({ localVideoEnabled: enabled }),
      toggleLocalAudio: () => set((state) => ({ localAudioEnabled: !state.localAudioEnabled })),
      setLocalAudio: (enabled) => set({ localAudioEnabled: enabled }),
      setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),

      toggleDialoguePanel: () => set((state) => ({ showDialoguePanel: !state.showDialoguePanel })),
      setDialoguePanel: (show) => set({ showDialoguePanel: show }),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      setSettings: (show) => set({ showSettings: show }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      reset: () => set(initialState),
    }),
    {
      name: "ishara-call-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        localVideoEnabled: state.localVideoEnabled,
        localAudioEnabled: state.localAudioEnabled,
        showDialoguePanel: state.showDialoguePanel,
        activeTab: state.activeTab,
      }),
    },
  ),
);

export function useCallActions() {
  const {
    session,
    messages,
    localVideoEnabled,
    localAudioEnabled,
    isScreenSharing,
    showDialoguePanel,
    showSettings,
    activeTab,
    setSession,
    updateSession,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setConnected,
    setConnectionCode,
    setInitiator,
    addMessage,
    updateMessage,
    clearMessages,
    toggleLocalVideo,
    setLocalVideo,
    toggleLocalAudio,
    setLocalAudio,
    setScreenSharing,
    toggleDialoguePanel,
    setDialoguePanel,
    toggleSettings,
    setSettings,
    setActiveTab,
    reset,
  } = useCallStore();

  return {
    session,
    messages,
    localVideoEnabled,
    localAudioEnabled,
    isScreenSharing,
    showDialoguePanel,
    showSettings,
    activeTab,
    setSession,
    updateSession,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setConnected,
    setConnectionCode,
    setInitiator,
    addMessage,
    updateMessage,
    clearMessages,
    toggleLocalVideo,
    setLocalVideo,
    toggleLocalAudio,
    setLocalAudio,
    setScreenSharing,
    toggleDialoguePanel,
    setDialoguePanel,
    toggleSettings,
    setSettings,
    setActiveTab,
    reset,
  };
}
