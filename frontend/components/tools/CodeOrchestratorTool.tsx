"use client";

import React, { useState } from "react";
import { Terminal, Play, CheckCircle2, AlertTriangle, Download, Code2 } from "lucide-react";
import { ApiService } from "../../services/api";

export const CodeOrchestratorTool: React.FC = () => {
  const [objective, setObjective] = useState(
    "Build an autonomous IoT telemetry ingestion pipeline with FastAPI, SQLite repository, and Streamlit monitoring interface."
  );
  const [healingBudget, setHealingBudget] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const handleDispatch = async () => {
    setLoading(true);
    try {
      const data = await ApiService.orchestrateCode(objective, healingBudget);
      setResult(data);
      if (data.artifacts && Object.keys(data.artifacts).length > 0) {
        setActiveFile(Object.keys(data.artifacts)[0]);
      }
    } catch (err: any) {
      alert("Orchestration Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 text-xs">
      {/* Input Header */}
      <div className="flex flex-col gap-2 bg-[#1E1D1B] border border-[#2D2B28] p-3 rounded-lg">
        <label className="text-[11px] font-semibold text-[#A19B90]">
          Target Architecture Objective:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="flex-1 bg-[#181615] border border-[#2D2B28] rounded px-2.5 py-1.5 text-[#F6F4EE] outline-none focus:border-[#C45532]"
            placeholder="e.g. Build an end-to-end user auth microservice with JWT and SQLite"
          />
          <button
            onClick={handleDispatch}
            disabled={loading}
            className="px-4 py-1.5 bg-[#C45532] text-white font-semibold rounded hover:bg-[#AA4424] flex items-center gap-1.5 transition-all shadow-md whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            {loading ? "Orchestrating..." : "Dispatch DAG"}
          </button>
        </div>
      </div>

      {/* Main Execution Result Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-[220px] overflow-hidden">
        {/* Left: Artifact Files List & Metrics */}
        <div className="flex flex-col bg-[#1E1D1B] border border-[#2D2B28] rounded-lg p-2.5">
          <div className="text-[11px] font-semibold text-[#A19B90] mb-2 flex items-center justify-between">
            <span>Delivered Artifacts</span>
            {result && (
              <span className="text-[#34D399] flex items-center gap-1 font-mono text-[10px]">
                <CheckCircle2 className="w-3 h-3" /> QA Passed
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {!result ? (
              <div className="text-[#A19B90]/60 italic p-3 text-center">
                Click "Dispatch DAG" to trigger Master Orchestrator.
              </div>
            ) : (
              Object.keys(result.artifacts || {}).map((fname) => (
                <button
                  key={fname}
                  onClick={() => setActiveFile(fname)}
                  className={`w-full text-left p-2 rounded border text-[11px] font-mono flex items-center justify-between transition-all ${
                    activeFile === fname
                      ? "bg-[#C45532]/20 border-[#C45532] text-[#F6F4EE]"
                      : "bg-[#181615] border-[#2D2B28] text-[#A19B90] hover:text-[#F6F4EE]"
                  }`}
                >
                  <span className="truncate">📄 {fname}</span>
                  <span className="text-[9px] text-[#A19B90]">Verified</span>
                </button>
              ))
            )}
          </div>

          {result && (
            <div className="mt-2 pt-2 border-t border-[#2D2B28] text-[10px] text-[#A19B90] font-mono flex justify-between">
              <span>Time: {result.duration_seconds?.toFixed(2)}s</span>
              <span>Heals: {result.healing_iterations}</span>
            </div>
          )}
        </div>

        {/* Right: Code Viewer (2 Cols) */}
        <div className="md:col-span-2 flex flex-col bg-[#1E1D1B] border border-[#2D2B28] rounded-lg p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#A19B90] mb-1.5 flex items-center justify-between">
            <span className="font-mono">{activeFile ? `Viewing: ${activeFile}` : "Code Buffer"}</span>
            {activeFile && result?.artifacts?.[activeFile] && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.artifacts[activeFile].content || "");
                  alert("Code copied!");
                }}
                className="text-[10px] text-[#C45532] hover:underline"
              >
                Copy Code
              </button>
            )}
          </div>

          <pre className="flex-1 bg-[#181615] border border-[#2D2B28] rounded p-2.5 font-mono text-[11px] text-[#F6F4EE] overflow-auto custom-scrollbar">
            {activeFile && result?.artifacts?.[activeFile]
              ? result.artifacts[activeFile].content
              : "// Code deliverables will render here once orchestration finishes."}
          </pre>
        </div>
      </div>
    </div>
  );
};
