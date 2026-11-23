"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquarePlus,
  Search,
  Calculator,
  Clock,
  Calendar,
  Table,
  Layers,
  Terminal,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Shield,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useWindowStore } from "../../store/windowStore";
import { useChatStore } from "../../store/chatStore";
import { ToolType } from "../../types";

export const Sidebar: React.FC = () => {
  const { openWindow, activeWindowId } = useWindowStore();
  const { sidebarOpen, toggleSidebar, clearMessages, selectedModel } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");

  const toolItems: Array<{ id: ToolType; label: string; icon: React.ReactNode; desc: string }> = [
    {
      id: "calculator",
      label: "Calculator",
      icon: <Calculator className="w-4 h-4 text-[#E07A5F]" />,
      desc: "Scientific & arithmetic computation",
    },
    {
      id: "clock",
      label: "World Clock",
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      desc: "Timezones & live stopwatch",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <Calendar className="w-4 h-4 text-emerald-400" />,
      desc: "Milestones & task agenda",
    },
    {
      id: "spreadsheet",
      label: "Spreadsheet Studio",
      icon: <Table className="w-4 h-4 text-cyan-400" />,
      desc: "Column drops & XLSX exports",
    },
    {
      id: "character-art",
      label: "3D Character Art",
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      desc: "Wireframe mesh & render prompts",
    },
    {
      id: "code-orchestrator",
      label: "DAG Orchestrator",
      icon: <Terminal className="w-4 h-4 text-rose-400" />,
      desc: "Multi-agent code decomposition",
    },
    {
      id: "settings",
      label: "System Settings",
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      desc: "Healing budget & LLM router",
    },
  ];

  const filteredTools = toolItems.filter((t) =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 260 : 64 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="h-screen bg-[#181615] border-r border-[#2D2B28] flex flex-col select-none relative z-40 overflow-hidden"
    >
      {/* Brand & Toggle Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#2D2B28]">
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-[#C45532] text-white flex items-center justify-center font-bold text-sm shadow-md">
              Æ
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-[#F6F4EE] tracking-wide truncate">
                AEGIS ASSISTANT
              </span>
              <span className="text-[10px] text-[#A19B90] font-mono truncate">
                v2.5 Desktop Next.js
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-[#C45532] text-white flex items-center justify-center font-bold text-sm mx-auto shadow-md">
            Æ
          </div>
        )}

        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#242220] transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {!sidebarOpen && (
        <div className="p-2 flex justify-center border-b border-[#2D2B28]">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#242220] transition-colors"
            title="Expand Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={clearMessages}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#C45532]/15 border border-[#C45532]/30 text-[#E07A5F] hover:bg-[#C45532]/25 font-semibold text-xs transition-all active:scale-95 shadow-sm ${
            !sidebarOpen ? "px-0" : ""
          }`}
          title="New Chat Session"
        >
          <MessageSquarePlus className="w-4 h-4" />
          {sidebarOpen && <span>New Session</span>}
        </button>
      </div>

      {/* Search Input (When open) */}
      {sidebarOpen && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 bg-[#1E1D1B] border border-[#2D2B28] rounded-md px-2.5 py-1.5 text-xs text-[#F6F4EE]">
            <Search className="w-3.5 h-3.5 text-[#A19B90]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools &amp; history..."
              className="w-full bg-transparent outline-none placeholder-[#A19B90]/60 text-xs"
            />
          </div>
        </div>
      )}

      {/* Tools Section */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 custom-scrollbar">
        {sidebarOpen && (
          <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#A19B90]/70">
            System Tools &amp; Studios
          </div>
        )}

        {filteredTools.map((tool) => {
          return (
            <button
              key={tool.id}
              onClick={() => openWindow(tool.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group ${
                activeWindowId === tool.id
                  ? "bg-[#242220] text-[#F6F4EE] border border-[#3E3C39]"
                  : "text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#1E1D1B]"
              } ${!sidebarOpen ? "justify-center px-0" : ""}`}
              title={tool.label}
            >
              <div className="p-1 rounded bg-[#181615] group-hover:scale-110 transition-transform">
                {tool.icon}
              </div>
              {sidebarOpen && (
                <div className="flex flex-col text-left truncate">
                  <span className="truncate">{tool.label}</span>
                  <span className="text-[10px] text-[#A19B90]/60 truncate font-normal">
                    {tool.desc}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Pill */}
      {sidebarOpen ? (
        <div className="p-3 border-t border-[#2D2B28] bg-[#141312] text-[11px] text-[#A19B90]">
          <div className="flex items-center gap-1.5 font-semibold text-[#F6F4EE] mb-0.5">
            <Shield className="w-3.5 h-3.5 text-[#34D399]" />
            <span className="truncate">Active Mode: {selectedModel.split(" ")[0]}</span>
          </div>
          <div className="text-[10px] text-[#A19B90]/70 italic truncate">
            “Crafted with care, not wires.”
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-[#2D2B28] flex justify-center text-[#34D399]">
          <Shield className="w-4 h-4" />
        </div>
      )}
    </motion.aside>
  );
};
