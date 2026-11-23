"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar/Sidebar";
import { ChatContainer } from "../components/chat/ChatContainer";
import { ChatInput } from "../components/chat/ChatInput";
import { FloatingWindowManager } from "../components/windows/FloatingWindowManager";
import { TaskbarDock } from "../components/layout/TaskbarDock";
import { ApiService } from "../services/api";

export default function DesktopAssistantPage() {
  const [backendStatus, setBackendStatus] = useState<"connecting" | "online" | "offline">("connecting");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await ApiService.checkHealth();
        setBackendStatus("online");
      } catch {
        setBackendStatus("offline");
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#121110] text-[#F6F4EE] select-none font-sans relative">
      {/* Collapsible Modern Sidebar */}
      <Sidebar />

      {/* Primary Chat & Assistant Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Connection Telemetry Bar */}
        <header className="h-10 border-b border-[#2D2B28] bg-[#181615]/80 backdrop-blur px-4 flex items-center justify-between text-xs font-mono text-[#A19B90] select-none">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === "online"
                  ? "bg-emerald-500 shadow-[0_0_8px_#10B981]"
                  : backendStatus === "connecting"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-[11px] font-semibold text-[#F6F4EE]">
              {backendStatus === "online"
                ? "Aegis Python Backend Online"
                : backendStatus === "connecting"
                ? "Connecting to Aegis Engine..."
                : "Backend Offline (Retrying on http://localhost:8080)"}
            </span>
          </div>

          <div className="text-[11px] text-[#A19B90]/70 hidden sm:block">
            Next.js Desktop Architecture • Drag, Resize &amp; Minimize Windows
          </div>
        </header>

        {/* Chat Conversation Stream */}
        <ChatContainer />

        {/* Chat Input */}
        <ChatInput />
      </div>

      {/* Floating Window System Container (Draggable & Resizable Desktop Tools) */}
      <FloatingWindowManager />

      {/* Minimized Windows Taskbar Dock */}
      <TaskbarDock />
    </main>
  );
}
