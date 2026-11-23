"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Sparkles, Paperclip, Wrench } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useWindowStore } from "../../store/windowStore";
import { ApiService } from "../../services/api";

export const ChatInput: React.FC = () => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { addMessage, updateMessageContent, isStreaming, setStreaming, stopStreaming, selectedModel } =
    useChatStore();
  const { openWindow } = useWindowStore();

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // 1. Add User Message
    addMessage({
      role: "user",
      content: text,
    });

    // 2. Prepare Assistant Message Placeholder
    const assistantMsgId = addMessage({
      role: "assistant",
      content: "Analyzing objective and coordinating specialist leads...",
    });

    setStreaming(true);

    try {
      const startTime = performance.now();
      const res = await ApiService.executeUniversal(text);
      const elapsed = Math.round(performance.now() - startTime);

      updateMessageContent(assistantMsgId, res.solution_content);
    } catch (err: any) {
      updateMessageContent(
        assistantMsgId,
        `⚠️ Execution alert encountered:\n\n${err.message || "Failed to reach backend service."}`
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-[#181615] border-t border-[#2D2B28] relative z-20">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        {/* Quick Tool Launch Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono text-[#A19B90] custom-scrollbar">
          <span className="text-[#A19B90]/70 flex items-center gap-1 mr-1">
            <Wrench className="w-3 h-3 text-[#C45532]" /> Launch Tools:
          </span>
          <button
            onClick={() => openWindow("calculator")}
            className="px-2 py-0.5 rounded bg-[#1E1D1B] border border-[#2D2B28] hover:border-[#C45532] text-[#F6F4EE] whitespace-nowrap"
          >
            🧮 Calculator
          </button>
          <button
            onClick={() => openWindow("spreadsheet")}
            className="px-2 py-0.5 rounded bg-[#1E1D1B] border border-[#2D2B28] hover:border-[#C45532] text-[#F6F4EE] whitespace-nowrap"
          >
            📊 Spreadsheet
          </button>
          <button
            onClick={() => openWindow("character-art")}
            className="px-2 py-0.5 rounded bg-[#1E1D1B] border border-[#2D2B28] hover:border-[#C45532] text-[#F6F4EE] whitespace-nowrap"
          >
            🎭 3D Art
          </button>
          <button
            onClick={() => openWindow("code-orchestrator")}
            className="px-2 py-0.5 rounded bg-[#1E1D1B] border border-[#2D2B28] hover:border-[#C45532] text-[#F6F4EE] whitespace-nowrap"
          >
            💻 Code DAG
          </button>
          <button
            onClick={() => openWindow("clock")}
            className="px-2 py-0.5 rounded bg-[#1E1D1B] border border-[#2D2B28] hover:border-[#C45532] text-[#F6F4EE] whitespace-nowrap"
          >
            ⏰ World Clock
          </button>
        </div>

        {/* Text Input Box */}
        <div className="flex items-end gap-2 bg-[#1E1D1B] border border-[#2D2B28] focus-within:border-[#C45532] rounded-2xl p-2.5 transition-colors shadow-lg">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or software objective... (Shift + Enter for newline)"
            className="flex-1 bg-transparent border-0 outline-none resize-none text-xs md:text-sm text-[#F6F4EE] placeholder-[#A19B90]/60 max-h-44 custom-scrollbar py-1 px-1.5"
          />

          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
              title="Stop Generation"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                input.trim()
                  ? "bg-[#C45532] text-white hover:bg-[#AA4424] shadow-md active:scale-95"
                  : "bg-[#242220] text-[#A19B90]/40 cursor-not-allowed"
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input Footer Metadata */}
        <div className="flex items-center justify-between text-[10px] text-[#A19B90] px-1 font-mono">
          <span>Engine: {selectedModel}</span>
          <span>Shift + Enter for newline • Enter to send</span>
        </div>
      </div>
    </div>
  );
};
