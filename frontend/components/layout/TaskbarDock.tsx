"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowStore } from "../../store/windowStore";
import { ToolType } from "../../types";
import {
  Calculator,
  Clock,
  Calendar,
  Table,
  Layers,
  Terminal,
  Settings,
} from "lucide-react";

const TOOL_ICONS: Record<ToolType, React.ReactNode> = {
  calculator: <Calculator className="w-3.5 h-3.5" />,
  clock: <Clock className="w-3.5 h-3.5" />,
  calendar: <Calendar className="w-3.5 h-3.5" />,
  spreadsheet: <Table className="w-3.5 h-3.5" />,
  "character-art": <Layers className="w-3.5 h-3.5" />,
  "code-orchestrator": <Terminal className="w-3.5 h-3.5" />,
  settings: <Settings className="w-3.5 h-3.5" />,
};

export const TaskbarDock: React.FC = () => {
  const { windows, bringToFront, activeWindowId } = useWindowStore();

  const openOrMinimizedWindows = (Object.keys(windows) as ToolType[]).filter(
    (id) => windows[id].isOpen
  );

  if (openOrMinimizedWindows.length === 0) return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 bg-[#181615]/80 dark:bg-[#121110]/80 backdrop-blur-xl border border-[#2D2B28] rounded-full shadow-2xl">
      <AnimatePresence>
        {openOrMinimizedWindows.map((id) => {
          const win = windows[id];
          const isActive = activeWindowId === id && !win.isMinimized;

          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => bringToFront(id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#C45532] text-white shadow-md"
                  : win.isMinimized
                  ? "bg-[#242220] text-[#A19B90] border border-dashed border-[#3E3C39] hover:text-[#F6F4EE]"
                  : "bg-[#1E1D1B] text-[#F6F4EE] hover:bg-[#242220]"
              }`}
            >
              <span>{TOOL_ICONS[id]}</span>
              <span className="truncate max-w-[110px]">{win.title}</span>
              {win.isMinimized && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Minimized" />
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
