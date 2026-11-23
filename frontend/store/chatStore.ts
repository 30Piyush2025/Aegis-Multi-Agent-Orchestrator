import { create } from "zustand";
import { ChatMessage, ToolExecutionRecord } from "../types";

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  abortController: AbortController | null;
  selectedModel: string;
  healingBudget: number;
  sidebarOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSelectedModel: (model: string) => void;
  setHealingBudget: (budget: number) => void;

  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateMessageContent: (id: string, content: string) => void;
  appendMessageChunk: (id: string, chunk: string) => void;
  addToolExecution: (messageId: string, tool: ToolExecutionRecord) => void;
  updateToolExecution: (
    messageId: string,
    toolId: string,
    updates: Partial<ToolExecutionRecord>
  ) => void;
  setStreaming: (isStreaming: boolean, controller?: AbortController | null) => void;
  stopStreaming: () => void;
  clearMessages: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "Welcome to **Aegis Desktop Assistant**. I am backed by a 3-tier hierarchical multi-agent engine with automated self-healing, deterministic spreadsheet processing, 3D character wireframes, and production software orchestration.\n\nHow may I assist your engineering, data, or creative goals today?",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

export const useChatStore = create<ChatState>((set, get) => ({
  messages: INITIAL_MESSAGES,
  isStreaming: false,
  abortController: null,
  selectedModel: "Hybrid / Auto-Detect",
  healingBudget: 3,
  sidebarOpen: true,

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSelectedModel: (model: string) => set({ selectedModel: model }),
  setHealingBudget: (budget: number) => set({ healingBudget: budget }),

  addMessage: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessage: ChatMessage = {
      ...msg,
      id,
      timestamp,
      toolExecutions: msg.toolExecutions || [],
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
    return id;
  },

  updateMessageContent: (id: string, content: string) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, content } : m)),
    }));
  },

  appendMessageChunk: (id: string, chunk: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + chunk } : m
      ),
    }));
  },

  addToolExecution: (messageId: string, tool: ToolExecutionRecord) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, toolExecutions: [...(m.toolExecutions || []), tool] }
          : m
      ),
    }));
  },

  updateToolExecution: (messageId: string, toolId: string, updates: Partial<ToolExecutionRecord>) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              toolExecutions: (m.toolExecutions || []).map((t) =>
                t.id === toolId ? { ...t, ...updates } : t
              ),
            }
          : m
      ),
    }));
  },

  setStreaming: (isStreaming: boolean, controller: AbortController | null = null) => {
    set({ isStreaming, abortController: controller });
  },

  stopStreaming: () => {
    const controller = get().abortController;
    if (controller) {
      controller.abort();
    }
    set({ isStreaming: false, abortController: null });
  },

  clearMessages: () => {
    set({
      messages: [
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: "Conversation history cleared. Workspace ready for new objective.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    });
  },
}));
