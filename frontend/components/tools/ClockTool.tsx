"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Flag, Globe, Watch } from "lucide-react";

export const ClockTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"clock" | "stopwatch" | "timer">("clock");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedTz, setSelectedTz] = useState("local");

  // Stopwatch State
  const [swRunning, setSwRunning] = useState(false);
  const [swTime, setSwTime] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerLeft, setTimerLeft] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);

  // Live Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stopwatch Ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (swRunning) {
      interval = setInterval(() => setSwTime((prev) => prev + 10), 10);
    }
    return () => clearInterval(interval);
  }, [swRunning]);

  // Timer Ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerLeft > 0) {
      interval = setInterval(() => setTimerLeft((prev) => Math.max(0, prev - 1)), 1000);
    } else if (timerLeft === 0 && timerRunning) {
      setTimerRunning(false);
      alert("⏰ Timer completed!");
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerLeft]);

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(
      centis
    ).padStart(2, "0")}`;
  };

  const getTimeInTz = (tz: string) => {
    if (tz === "local") {
      return currentTime.toLocaleTimeString();
    }
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(currentTime);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Tabs */}
      <div className="flex border-b border-[#2D2B28] gap-2 pb-2">
        <button
          onClick={() => setActiveTab("clock")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "clock"
              ? "bg-[#C45532]/20 text-[#E07A5F]"
              : "text-[#A19B90] hover:text-[#F6F4EE]"
          }`}
        >
          World Clock
        </button>
        <button
          onClick={() => setActiveTab("stopwatch")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "stopwatch"
              ? "bg-[#C45532]/20 text-[#E07A5F]"
              : "text-[#A19B90] hover:text-[#F6F4EE]"
          }`}
        >
          Stopwatch
        </button>
        <button
          onClick={() => setActiveTab("timer")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "timer"
              ? "bg-[#C45532]/20 text-[#E07A5F]"
              : "text-[#A19B90] hover:text-[#F6F4EE]"
          }`}
        >
          Timer
        </button>
      </div>

      {/* Clock View */}
      {activeTab === "clock" && (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-4">
          <div className="text-4xl font-mono font-bold text-[#F6F4EE] tracking-widest mb-1">
            {getTimeInTz(selectedTz)}
          </div>
          <div className="text-xs text-[#A19B90] font-sans mb-6">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>

          {/* Timezone Switcher Pills */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs text-xs font-mono">
            {[
              { label: "Local Time", tz: "local" },
              { label: "UTC / GMT", tz: "UTC" },
              { label: "New York (EST)", tz: "America/New_York" },
              { label: "Tokyo (JST)", tz: "Asia/Tokyo" },
              { label: "India (IST)", tz: "Asia/Kolkata" },
              { label: "London (BST)", tz: "Europe/London" },
            ].map((item) => (
              <button
                key={item.tz}
                onClick={() => setSelectedTz(item.tz)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedTz === item.tz
                    ? "border-[#C45532] bg-[#C45532]/10 text-[#F6F4EE]"
                    : "border-[#2D2B28] bg-[#1E1D1B] text-[#A19B90] hover:border-[#3E3C39]"
                }`}
              >
                <div className="font-semibold">{item.label}</div>
                <div className="text-[11px] text-[#A19B90]">{getTimeInTz(item.tz)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stopwatch View */}
      {activeTab === "stopwatch" && (
        <div className="flex flex-col items-center justify-center flex-1 py-2">
          <div className="text-4xl font-mono font-bold text-[#F6F4EE] mb-6">
            {formatStopwatch(swTime)}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setSwRunning(!swRunning)}
              className={`px-5 py-2.5 rounded-full font-semibold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                swRunning
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-[#C45532] text-white hover:bg-[#AA4424]"
              }`}
            >
              {swRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {swRunning ? "Pause" : "Start"}
            </button>

            {swRunning && (
              <button
                onClick={() => setLaps((prev) => [swTime, ...prev.slice(0, 5)])}
                className="px-4 py-2.5 rounded-full bg-[#242220] border border-[#2D2B28] text-[#F6F4EE] text-xs font-semibold hover:bg-[#2D2B28] flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" /> Lap
              </button>
            )}

            <button
              onClick={() => {
                setSwRunning(false);
                setSwTime(0);
                setLaps([]);
              }}
              className="p-2.5 rounded-full bg-[#1E1D1B] text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#2D2B28]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Laps List */}
          {laps.length > 0 && (
            <div className="w-full max-w-xs bg-[#1E1D1B] border border-[#2D2B28] rounded-lg p-2.5 max-h-28 overflow-y-auto font-mono text-xs text-[#A19B90]">
              {laps.map((lap, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-[#2D2B28]/60 last:border-0">
                  <span>Lap {laps.length - i}</span>
                  <span className="text-[#F6F4EE]">{formatStopwatch(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timer View */}
      {activeTab === "timer" && (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-2">
          <div className="text-4xl font-mono font-bold text-[#F6F4EE] mb-6">
            {String(Math.floor(timerLeft / 60)).padStart(2, "0")}:
            {String(timerLeft % 60).padStart(2, "0")}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`px-5 py-2.5 rounded-full font-semibold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                timerRunning
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-[#C45532] text-white hover:bg-[#AA4424]"
              }`}
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {timerRunning ? "Pause" : "Start"}
            </button>

            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerLeft(timerSeconds);
              }}
              className="p-2.5 rounded-full bg-[#1E1D1B] text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#2D2B28]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Presets */}
          <div className="flex gap-2">
            {[60, 300, 600, 1500].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(s);
                  setTimerLeft(s);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#242220] border border-[#2D2B28] text-xs font-mono text-[#A19B90] hover:text-[#F6F4EE]"
              >
                {s / 60}m
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
