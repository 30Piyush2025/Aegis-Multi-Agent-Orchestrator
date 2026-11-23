"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Square,
  X,
  Copy,
  Maximize2,
  Minimize2,
  Move,
} from "lucide-react";
import { FloatingWindowState } from "../../types";
import { useWindowStore } from "../../store/windowStore";

interface WindowFrameProps {
  window: FloatingWindowState;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ window: win, children }) => {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    bringToFront,
    updatePosition,
    updateSize,
  } = useWindowStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const resizeRef = useRef<{ startX: number; startY: number; initW: number; initH: number }>({
    startX: 0,
    startY: 0,
    initW: 0,
    initH: 0,
  });

  // Handle Dragging
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if (win.isMaximized) return;
    bringToFront(win.id);
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: win.bounds.x,
      initY: win.bounds.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        updatePosition(win.id, dragRef.current.initX + dx, dragRef.current.initY + dy);
      } else if (isResizing) {
        const dw = e.clientX - resizeRef.current.startX;
        const dh = e.clientY - resizeRef.current.startY;
        updateSize(win.id, resizeRef.current.initW + dw, resizeRef.current.initH + dh);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, win.id, updatePosition, updateSize]);

  // Handle Resizing
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (win.isMaximized) return;
    bringToFront(win.id);
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initW: win.bounds.width,
      initH: win.bounds.height,
    };
  };

  if (!win.isOpen || win.isMinimized) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        onMouseDown={() => bringToFront(win.id)}
        style={{
          position: "fixed",
          left: win.isMaximized ? 0 : win.bounds.x,
          top: win.isMaximized ? 0 : win.bounds.y,
          width: win.isMaximized ? "100vw" : win.bounds.width,
          height: win.isMaximized ? "100vh" : win.bounds.height,
          zIndex: win.zIndex,
        }}
        className={`flex flex-col bg-[#181615]/95 dark:bg-[#121110]/95 backdrop-blur-xl border border-[#2D2B28] rounded-xl shadow-2xl overflow-hidden transition-all duration-150 ${
          isDragging ? "cursor-grabbing select-none" : ""
        }`}
      >
        {/* Window Title Bar */}
        <div
          onMouseDown={handleMouseDownHeader}
          onDoubleClick={() => maximizeWindow(win.id)}
          className="flex items-center justify-between px-3.5 py-2.5 bg-[#1E1D1B] border-b border-[#2D2B28] select-none cursor-grab active:cursor-grabbing"
        >
          {/* Left: Window Title & Icon */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C45532]/80 animate-pulse" />
            <span className="text-xs font-semibold text-[#F6F4EE] tracking-wide">
              {win.title}
            </span>
          </div>

          {/* Right: Window Controls */}
          <div className="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
            {/* Minimize */}
            <button
              onClick={() => minimizeWindow(win.id)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#2D2B28] transition-colors"
              title="Minimize to Dock"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Maximize / Restore */}
            <button
              onClick={() => maximizeWindow(win.id)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-[#A19B90] hover:text-[#F6F4EE] hover:bg-[#2D2B28] transition-colors"
              title={win.isMaximized ? "Restore Dimensions" : "Maximize"}
            >
              {win.isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={() => closeWindow(win.id)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-[#A19B90] hover:text-[#FFFFFF] hover:bg-[#DC2626] transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Window Body */}
        <div className="flex-1 overflow-auto bg-[#181615] text-[#F6F4EE] p-4 custom-scrollbar">
          {children}
        </div>

        {/* Resize Handle (Bottom-Right Corner) */}
        {!win.isMaximized && (
          <div
            onMouseDown={handleMouseDownResize}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5"
            title="Resize Window"
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-[#A19B90]/60 rounded-br-sm" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
