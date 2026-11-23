import { create } from "zustand";
import { FloatingWindowState, ToolType, WindowBounds } from "../types";

interface WindowStoreState {
  windows: Record<ToolType, FloatingWindowState>;
  activeWindowId: ToolType | null;
  highestZIndex: number;

  openWindow: (id: ToolType) => void;
  closeWindow: (id: ToolType) => void;
  minimizeWindow: (id: ToolType) => void;
  maximizeWindow: (id: ToolType) => void;
  bringToFront: (id: ToolType) => void;
  updatePosition: (id: ToolType, x: number, y: number) => void;
  updateSize: (id: ToolType, width: number, height: number) => void;
}

const DEFAULT_WINDOWS: Record<ToolType, FloatingWindowState> = {
  calculator: {
    id: "calculator",
    title: "Scientific Calculator",
    icon: "Calculator",
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    bounds: { x: 120, y: 80, width: 340, height: 480 },
    zIndex: 10,
  },
  clock: {
    id: "clock",
    title: "World Clock & Stopwatch",
    icon: "Clock",
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    bounds: { x: 180, y: 100, width: 440, height: 420 },
    zIndex: 10,
  },
  calendar: {
    id: "calendar",
    title: "Calendar & Event Scheduler",
    icon: "Calendar",
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    bounds: { x: 220, y: 90, width: 480, height: 520 },
    zIndex: 10,
  },
  spreadsheet: {
    id: "spreadsheet",
    title: "Spreadsheet Data Studio",
    icon: "Table",
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    bounds: { x: 160, y: 70, width: 780, height: 560 },
    zIndex: 10,
  },
  "character-art": {
    id: "character-art",
    title: "3D Character & Wireframe Studio",
    icon: "Layers",
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    bounds: { x: 200, y: 80, width: 740, height: 540 },
    zIndex: 10,
  },
  "code-orchestrator": {
    id: "code-orchestrator",
    title: "Multi-Agent DAG Orchestrator",
    icon: "Terminal",
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    bounds: { x: 140, y: 60, width: 820, height: 580 },
    zIndex: 10,
  },
  settings: {
    id: "settings",
    title: "System Settings",
    icon: "Settings",
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    bounds: { x: 260, y: 120, width: 480, height: 460 },
    zIndex: 10,
  },
};

export const useWindowStore = create<WindowStoreState>((set, get) => ({
  windows: DEFAULT_WINDOWS,
  activeWindowId: null,
  highestZIndex: 20,

  openWindow: (id: ToolType) => {
    const nextZ = get().highestZIndex + 1;
    set((state) => ({
      highestZIndex: nextZ,
      activeWindowId: id,
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          isOpen: true,
          isMinimized: false,
          zIndex: nextZ,
        },
      },
    }));
  },

  closeWindow: (id: ToolType) => {
    set((state) => ({
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          isOpen: false,
          isMinimized: false,
          isMaximized: false,
        },
      },
    }));
  },

  minimizeWindow: (id: ToolType) => {
    set((state) => ({
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          isMinimized: true,
        },
      },
    }));
  },

  maximizeWindow: (id: ToolType) => {
    set((state) => {
      const win = state.windows[id];
      const isMax = win.isMaximized;
      const nextZ = state.highestZIndex + 1;

      return {
        highestZIndex: nextZ,
        activeWindowId: id,
        windows: {
          ...state.windows,
          [id]: {
            ...win,
            isMaximized: !isMax,
            isMinimized: false,
            zIndex: nextZ,
            prevBounds: !isMax ? { ...win.bounds } : win.prevBounds,
            bounds: !isMax
              ? { x: 20, y: 20, width: window.innerWidth - 40, height: window.innerHeight - 80 }
              : win.prevBounds || win.bounds,
          },
        },
      };
    });
  },

  bringToFront: (id: ToolType) => {
    const nextZ = get().highestZIndex + 1;
    set((state) => ({
      highestZIndex: nextZ,
      activeWindowId: id,
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          isMinimized: false,
          zIndex: nextZ,
        },
      },
    }));
  },

  updatePosition: (id: ToolType, x: number, y: number) => {
    set((state) => ({
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          bounds: { ...state.windows[id].bounds, x: Math.max(0, x), y: Math.max(0, y) },
        },
      },
    }));
  },

  updateSize: (id: ToolType, width: number, height: number) => {
    set((state) => ({
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          bounds: {
            ...state.windows[id].bounds,
            width: Math.max(280, width),
            height: Math.max(200, height),
          },
        },
      },
    }));
  },
}));
