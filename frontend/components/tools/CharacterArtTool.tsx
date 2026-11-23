"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Layers, Box, Copy, Check } from "lucide-react";
import { ApiService } from "../../services/api";

export const CharacterArtTool: React.FC = () => {
  const [concept, setConcept] = useState("Cyberpunk Ronin with Obsidian Armor and Neon Katana");
  const [topologyMode, setTopologyMode] = useState("quad_subd");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await ApiService.generateCharacterArt({
        concept,
        topology_mode: topologyMode,
      });
      setResult(data);
    } catch (err: any) {
      alert("Character art generation error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Interactive 3D Wireframe Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 65;

      angle += 0.02;

      ctx.save();
      ctx.strokeStyle = "rgba(196, 85, 50, 0.4)";
      ctx.lineWidth = 1.2;

      // Draw wireframe rings
      for (let r = 20; r <= radius; r += 15) {
        ctx.beginPath();
        const yOffset = Math.sin(angle + r * 0.05) * 8;
        ctx.ellipse(cx, cy + yOffset, r, r * 0.45, angle * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw cross contour quad lines
      for (let i = 0; i < 8; i++) {
        const theta = (i * Math.PI) / 4 + angle * 0.5;
        const x = cx + Math.cos(theta) * radius;
        const y = cy + Math.sin(theta) * (radius * 0.45);

        ctx.beginPath();
        ctx.moveTo(cx, cy - 50);
        ctx.quadraticCurveTo(x, cy, cx, cy + 50);
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleCopyPrompt = () => {
    if (!result?.cinematic_render_prompt) return;
    navigator.clipboard.writeText(result.cinematic_render_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-3 text-xs">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-[#1E1D1B] border border-[#2D2B28] p-3 rounded-lg">
        <div className="md:col-span-2">
          <label className="text-[11px] font-semibold text-[#A19B90] block mb-1">
            Character Concept or Archetype:
          </label>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            className="w-full bg-[#181615] border border-[#2D2B28] rounded px-2.5 py-1.5 text-[#F6F4EE] outline-none focus:border-[#C45532]"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#A19B90] block mb-1">
            Topology Model:
          </label>
          <select
            value={topologyMode}
            onChange={(e) => setTopologyMode(e.target.value)}
            className="w-full bg-[#181615] border border-[#2D2B28] rounded px-2 py-1.5 text-[#F6F4EE] outline-none focus:border-[#C45532]"
          >
            <option value="quad_subd">Production Quad SubD</option>
            <option value="realtime_lowpoly">Game Engine Low-Poly</option>
            <option value="sculpt_dynamesh">High-Res Voxel DynaMesh</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-1.5 bg-[#C45532] text-white font-semibold rounded hover:bg-[#AA4424] flex items-center justify-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loading ? "Generating..." : "Generate Mesh"}
          </button>
        </div>
      </div>

      {/* Main Grid: 3D Viewport & Specification Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[220px]">
        {/* 3D Wireframe Viewport */}
        <div className="flex flex-col bg-[#1E1D1B] border border-[#2D2B28] rounded-lg p-2.5 relative items-center justify-center overflow-hidden">
          <div className="absolute top-2 left-2.5 text-[10px] font-mono text-[#A19B90] bg-[#181615]/80 px-2 py-0.5 rounded border border-[#2D2B28]">
            Interactive Kinetic Wireframe
          </div>
          <canvas
            ref={canvasRef}
            width={320}
            height={200}
            className="w-full h-auto max-w-[320px] rounded"
          />
          <div className="text-[11px] text-[#A19B90] mt-2 font-mono text-center">
            Mode: {topologyMode.toUpperCase()} • Quad Edge Loops Active
          </div>
        </div>

        {/* Specifications & Prompt Output */}
        <div className="flex flex-col bg-[#1E1D1B] border border-[#2D2B28] rounded-lg p-3 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#A19B90] mb-2 flex items-center justify-between">
            <span>Production Specifications</span>
            {result?.cinematic_render_prompt && (
              <button
                onClick={handleCopyPrompt}
                className="text-[11px] text-[#C45532] hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy Prompt"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] pr-1 custom-scrollbar">
            {!result ? (
              <div className="text-xs text-[#A19B90]/60 italic py-8 text-center">
                Configure your concept above and click "Generate Mesh".
              </div>
            ) : (
              <>
                <div className="bg-[#181615] border border-[#2D2B28] p-2 rounded">
                  <div className="text-[#E07A5F] font-bold mb-0.5">Silhouette &amp; Mood:</div>
                  <div className="text-[#F6F4EE]/90">
                    {result.character_breakdown?.visual_silhouette || "Streamlined cyber-armor with sleek kinetic edge loops."}
                  </div>
                </div>

                <div className="bg-[#181615] border border-[#2D2B28] p-2 rounded">
                  <div className="text-[#E07A5F] font-bold mb-0.5">Octane &amp; Midjourney Prompt:</div>
                  <div className="text-[#A19B90] break-words text-[10px]">
                    {result.cinematic_render_prompt}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
