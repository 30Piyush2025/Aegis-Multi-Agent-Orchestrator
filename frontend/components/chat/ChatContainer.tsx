"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Sparkles, Terminal, ArrowDown, Bot, User } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useWindowStore } from "../../store/windowStore";
import { ChatMessage } from "../../types";

export const ChatContainer: React.FC = () => {
  const { messages, isStreaming } = useChatStore();
  const { openWindow } = useWindowStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    {
      title: "Clean Spreadsheet Data",
      desc: "Drop columns & export to Excel format",
      action: () => openWindow("spreadsheet"),
    },
    {
      title: "3D Character Wireframe",
      desc: "Generate quad topology & Octane prompts",
      action: () => openWindow("character-art"),
    },
    {
      title: "Full Code Orchestration",
      desc: "Decompose DAG and self-heal defects",
      action: () => openWindow("code-orchestrator"),
    },
  ];

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 custom-scrollbar relative"
    >
      {/* Welcome Hero (Shown on initial session) */}
      {messages.length <= 1 && (
        <div className="max-w-2xl mx-auto my-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex p-3 rounded-2xl bg-[#C45532]/10 border border-[#C45532]/25 mb-4 shadow-sm"
          >
            <Sparkles className="w-6 h-6 text-[#E07A5F]" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-extrabold text-[#F6F4EE] mb-2 tracking-tight"
          >
            Aegis Desktop Multi-Agent Assistant
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs md:text-sm text-[#A19B90] max-w-lg mx-auto mb-6"
          >
            Experience a modern Next.js desktop workspace powered by hierarchical agents,
            interactive floating window tools, and automated closed-loop self-healing.
          </motion.p>

          {/* Quick Launch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 max-w-xl mx-auto text-left">
            {samplePrompts.map((p, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + idx * 0.08 }}
                onClick={p.action}
                className="p-3 rounded-xl bg-[#1E1D1B] border border-[#2D2B28] hover:border-[#C45532]/60 hover:bg-[#242220] transition-all text-xs group"
              >
                <div className="font-semibold text-[#F6F4EE] group-hover:text-[#E07A5F] mb-1">
                  {p.title}
                </div>
                <div className="text-[11px] text-[#A19B90] leading-snug">{p.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="max-w-3xl mx-auto space-y-5">
        <AnimatePresence>
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#C45532] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-md mt-1">
                    Æ
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col max-w-[85%] md:max-w-[78%] ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm transition-all ${
                      isUser
                        ? "bg-[#C45532] text-white rounded-tr-sm font-medium"
                        : "bg-[#1E1D1B] border border-[#2D2B28] text-[#F6F4EE] rounded-tl-sm"
                    }`}
                  >
                    {/* Tool Execution Timeline Badges */}
                    {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                      <div className="mb-3 space-y-1.5 pb-2 border-b border-[#2D2B28]">
                        {msg.toolExecutions.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center gap-1.5 text-[11px] font-mono text-[#34D399] bg-[#064E3B]/20 border border-[#059669]/30 px-2 py-0.5 rounded-md"
                          >
                            <Terminal className="w-3 h-3 text-[#34D399]" />
                            <span>Tool Executed: {t.tool}</span>
                            {t.durationMs && (
                              <span className="text-[#A19B90] ml-auto">({t.durationMs}ms)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content Body */}
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                    {/* Bottom Metadata & Copy */}
                    <div
                      className={`flex items-center gap-2 mt-2 pt-1 text-[10px] ${
                        isUser ? "text-white/80 justify-end" : "text-[#A19B90] justify-between"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-[#F6F4EE] transition-colors flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#242220] border border-[#2D2B28] text-[#F6F4EE] flex-shrink-0 flex items-center justify-center font-bold text-xs mt-1">
                    <User className="w-4 h-4 text-[#A19B90]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Live Streaming Indicator */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-[#E07A5F] font-mono pl-11"
          >
            <span className="w-2 h-2 rounded-full bg-[#C45532] animate-ping" />
            <span>Aegis Multi-Agent Orchestrator is synthesizing response...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};
