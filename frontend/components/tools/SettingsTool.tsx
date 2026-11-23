"use client";

import React, { useState } from "react";
import { Settings, Shield, Cpu, RefreshCw, Moon, Sun } from "lucide-react";
import { useChatStore } from "../../store/chatStore";

export const SettingsTool: React.FC = () => {
  const { selectedModel, setSelectedModel, healingBudget, setHealingBudget } = useChatStore();
  const [simulateDefect, setSimulateDefect] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 text-xs select-none">
      {/* Engine Selection */}
      <div className="bg-[#1E1D1B] border border-[#2D2B28] p-3 rounded-lg flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#F6F4EE]">
          <Cpu className="w-4 h-4 text-[#C45532]" />
          <span>Execution Engine &amp; LLM Router</span>
        </div>
        <p className="text-[11px] text-[#A19B90]">
          Select active AI intelligence router for autonomous code decomposition and reasoning.
        </p>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full bg-[#181615] border border-[#2D2B28] rounded p-2 text-[#F6F4EE] outline-none focus:border-[#C45532]"
        >
          <option value="Hybrid / Auto-Detect">Hybrid / Auto-Detect (Optimal Performance)</option>
          <option value="Groq Llama 3.3 (High Speed)">Groq Llama 3.3 (Ultra Low Latency)</option>
          <option value="Google Gemini">Google Gemini Pro (Deep Context Reasoning)</option>
          <option value="Offline Deterministic Engine">Offline Deterministic Standard-Library</option>
        </select>
      </div>

      {/* Self-Healing Budget */}
      <div className="bg-[#1E1D1B] border border-[#2D2B28] p-3 rounded-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F6F4EE]">
            <RefreshCw className="w-4 h-4 text-[#C45532]" />
            <span>Closed-Loop Self-Healing Budget</span>
          </div>
          <span className="font-mono font-bold text-[#E07A5F] px-2 py-0.5 bg-[#C45532]/20 rounded">
            {healingBudget} Loops
          </span>
        </div>
        <p className="text-[11px] text-[#A19B90]">
          Maximum autonomous bug-fix and AST code-remediation cycles allowed before aborting.
        </p>
        <input
          type="range"
          min={1}
          max={5}
          value={healingBudget}
          onChange={(e) => setHealingBudget(Number(e.target.value))}
          className="w-full accent-[#C45532] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#A19B90] font-mono">
          <span>1 Loop (Strict)</span>
          <span>3 Loops (Recommended)</span>
          <span>5 Loops (Deep Healing)</span>
        </div>
      </div>

      {/* Showcase Defect Injection */}
      <div className="bg-[#1E1D1B] border border-[#2D2B28] p-3 rounded-lg flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[#F6F4EE] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#C45532]" />
            <span>Simulate AST Defect Injection</span>
          </div>
          <div className="text-[11px] text-[#A19B90] mt-0.5">
            Injects deliberate syntax defects to showcase QA detection and automated self-healing.
          </div>
        </div>
        <input
          type="checkbox"
          checked={simulateDefect}
          onChange={(e) => setSimulateDefect(e.target.checked)}
          className="w-4 h-4 accent-[#C45532] cursor-pointer"
        />
      </div>

      {/* Theme Appearance */}
      <div className="bg-[#1E1D1B] border border-[#2D2B28] p-3 rounded-lg flex items-center justify-between mt-auto">
        <div>
          <div className="text-sm font-semibold text-[#F6F4EE]">Desktop Interface Theme</div>
          <div className="text-[11px] text-[#A19B90]">Velvet Obsidian (Dark) / Warm Parchment (Light)</div>
        </div>
        <button
          onClick={toggleTheme}
          className="px-3 py-1.5 rounded-lg bg-[#242220] border border-[#2D2B28] text-[#F6F4EE] hover:bg-[#2D2B28] flex items-center gap-1.5 transition-colors"
        >
          {theme === "dark" ? <Moon className="w-3.5 h-3.5 text-[#E07A5F]" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          <span>{theme === "dark" ? "Velvet Dark" : "Parchment Light"}</span>
        </button>
      </div>
    </div>
  );
};
