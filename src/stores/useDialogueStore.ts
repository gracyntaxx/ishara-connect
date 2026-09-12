import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SignLabel } from "../lib/constants";

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

interface DialogueState {
  messages: DialogueMessage[];
  showGloss: boolean;
  autoScroll: boolean;
  maxMessages: number;

  addMessage: (message: Omit<DialogueMessage, "id"> & { id?: string }) => void;
  updateMessage: (id: string, updates: Partial<DialogueMessage>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setMessages: (messages: DialogueMessage[]) => void;
  setShowGloss: (show: boolean) => void;
  toggleShowGloss: () => void;
  setAutoScroll: (auto: boolean) => void;
  setMaxMessages: (max: number) => void;
  reset: () => void;
}

const initialState = {
  messages: [],
  showGloss: false,
  autoScroll: true,
  maxMessages: 200,
};

export const useDialogueStore = create<DialogueState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addMessage: (message) =>
        set((state) => {
          const id = message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          // Deduplicate: ignore if same id or same sender + text within 2000ms
          const isDuplicate = state.messages.some(
            (m) =>
              m.id === id ||
              (m.senderId === message.senderId &&
                m.text === message.text &&
                Math.abs((m.timestamp || 0) - (message.timestamp || 0)) < 2000),
          );
          if (isDuplicate) return state;

          return {
            messages: [...state.messages, { ...message, id }].slice(-state.maxMessages),
          };
        }),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      removeMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== id),
        })),
      clearMessages: () => set({ messages: [] }),
      setMessages: (messages) => set({ messages }),
      setShowGloss: (show) => set({ showGloss: show }),
      toggleShowGloss: () => set((state) => ({ showGloss: !state.showGloss })),
      setAutoScroll: (auto) => set({ autoScroll: auto }),
      setMaxMessages: (max) => set({ maxMessages: max }),
      reset: () => set(initialState),
    }),
    {
      name: "ishara-dialogue-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        showGloss: state.showGloss,
        autoScroll: state.autoScroll,
      }),
    },
  ),
);

export function useDialogueActions() {
  const {
    messages,
    showGloss,
    autoScroll,
    maxMessages,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    setMessages,
    setShowGloss,
    toggleShowGloss,
    setAutoScroll,
    setMaxMessages,
    reset,
  } = useDialogueStore();

  return {
    messages,
    showGloss,
    autoScroll,
    maxMessages,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    setMessages,
    setShowGloss,
    toggleShowGloss,
    setAutoScroll,
    setMaxMessages,
    reset,
  };
}
