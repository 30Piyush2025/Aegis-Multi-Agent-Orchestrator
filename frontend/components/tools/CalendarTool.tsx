"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalIcon } from "lucide-react";

interface CalendarEvent {
  id: string;
  dateKey: string; // YYYY-MM-DD
  title: string;
  category: "engineering" | "qa" | "design" | "milestone";
}

export const CalendarTool: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "ev-1",
      dateKey: new Date().toISOString().split("T")[0],
      title: "Orchestrator Architecture Release",
      category: "milestone",
    },
    {
      id: "ev-2",
      dateKey: new Date().toISOString().split("T")[0],
      title: "Automated Self-Healing QA Audit",
      category: "qa",
    },
  ]);
  const [newEventTitle, setNewEventTitle] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const selectedKey = selectedDate.toISOString().split("T")[0];
  const dayEvents = events.filter((e) => e.dateKey === selectedKey);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      dateKey: selectedKey,
      title: newEventTitle.trim(),
      category: "engineering",
    };

    setEvents((prev) => [...prev, newEv]);
    setNewEventTitle("");
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2D2B28]">
        <div className="flex items-center gap-2">
          <CalIcon className="w-4 h-4 text-[#C45532]" />
          <span className="font-semibold text-sm text-[#F6F4EE]">
            {monthNames[month]} {year}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-md text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#2D2B28]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              setSelectedDate(now);
            }}
            className="px-2 py-0.5 text-xs text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#2D2B28] rounded"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-md text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#2D2B28]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-[#A19B90]/70 font-semibold py-1">
            {d}
          </div>
        ))}

        {/* Empty cells before month start */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="p-1.5 opacity-0"></div>
        ))}

        {/* Month Day Cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const cellDate = new Date(year, month, dayNum);
          const cellKey = cellDate.toISOString().split("T")[0];
          const isSelected = cellKey === selectedKey;
          const isToday = cellKey === new Date().toISOString().split("T")[0];
          const hasEvents = events.some((e) => e.dateKey === cellKey);

          return (
            <button
              key={`day-${dayNum}`}
              onClick={() => setSelectedDate(cellDate)}
              className={`p-1.5 rounded-lg text-xs relative flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? "bg-[#C45532] text-white font-bold shadow"
                  : isToday
                  ? "border border-[#C45532] text-[#F6F4EE]"
                  : "text-[#A19B90] hover:bg-[#242220] hover:text-[#F6F4EE]"
              }`}
            >
              <span>{dayNum}</span>
              {hasEvents && (
                <span
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    isSelected ? "bg-white" : "bg-[#C45532]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Events for Selected Day */}
      <div className="flex-1 flex flex-col border-t border-[#2D2B28] pt-3 overflow-hidden">
        <div className="text-xs font-semibold text-[#A19B90] mb-2 flex items-center justify-between">
          <span>Agenda: {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          <span className="text-[11px] text-[#C45532]">{dayEvents.length} Tasks</span>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-32 custom-scrollbar">
          {dayEvents.length === 0 ? (
            <div className="text-xs text-[#A19B90]/60 italic py-2">No tasks scheduled for this date.</div>
          ) : (
            dayEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between bg-[#1E1D1B] border border-[#2D2B28] px-2.5 py-1.5 rounded-md text-xs text-[#F6F4EE]"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C45532]" />
                  <span className="truncate">{ev.title}</span>
                </div>
                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="text-[#A19B90] hover:text-red-400 ml-2"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Event Input */}
        <form onSubmit={handleAddEvent} className="flex gap-2 mt-2 pt-2 border-t border-[#2D2B28]">
          <input
            type="text"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="Add new task or milestone..."
            className="flex-1 bg-[#1E1D1B] border border-[#2D2B28] rounded-md px-2.5 py-1.5 text-xs text-[#F6F4EE] placeholder-[#A19B90]/60 outline-none focus:border-[#C45532]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md bg-[#C45532] text-white text-xs font-semibold hover:bg-[#AA4424] flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </div>
    </div>
  );
};
