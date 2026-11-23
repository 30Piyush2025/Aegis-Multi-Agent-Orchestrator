"use client";

import React, { useState } from "react";
import { Delete, History } from "lucide-react";

export const CalculatorTool: React.FC = () => {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const handleNumber = (n: string) => {
    setDisplay((prev) => (prev === "0" ? n : prev + n));
  };

  const handleOperator = (op: string) => {
    setEquation(`${display} ${op} `);
    setDisplay("0");
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
  };

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  };

  const handleCalculate = () => {
    try {
      const fullExpr = `${equation}${display}`;
      // Clean safe expression evaluation
      const sanitized = fullExpr.replace(/[^0-9+\-*/.() ]/g, "");
      const res = Function(`"use strict"; return (${sanitized})`)();
      const resStr = String(Number(res.toFixed(6)));

      setHistory((prev) => [`${fullExpr} = ${resStr}`, ...prev.slice(0, 8)]);
      setDisplay(resStr);
      setEquation("");
    } catch {
      setDisplay("Error");
    }
  };

  const buttons = [
    { label: "C", action: handleClear, type: "danger" },
    { label: "⌫", action: handleBackspace, type: "operator" },
    { label: "%", action: () => handleOperator("/ 100 *"), type: "operator" },
    { label: "÷", action: () => handleOperator("/"), type: "operator" },

    { label: "7", action: () => handleNumber("7") },
    { label: "8", action: () => handleNumber("8") },
    { label: "9", action: () => handleNumber("9") },
    { label: "×", action: () => handleOperator("*"), type: "operator" },

    { label: "4", action: () => handleNumber("4") },
    { label: "5", action: () => handleNumber("5") },
    { label: "6", action: () => handleNumber("6") },
    { label: "-", action: () => handleOperator("-"), type: "operator" },

    { label: "1", action: () => handleNumber("1") },
    { label: "2", action: () => handleNumber("2") },
    { label: "3", action: () => handleNumber("3") },
    { label: "+", action: () => handleOperator("+"), type: "operator" },

    { label: "0", action: () => handleNumber("0"), span: "col-span-2" },
    { label: ".", action: () => handleNumber(".") },
    { label: "=", action: handleCalculate, type: "primary" },
  ];

  return (
    <div className="flex flex-col h-full gap-3 select-none">
      {/* Display Screen */}
      <div className="bg-[#1E1D1B] border border-[#2D2B28] rounded-lg p-3 text-right flex flex-col justify-end min-h-[75px]">
        <div className="text-xs text-[#A19B90] font-mono h-4 overflow-hidden truncate">
          {equation}
        </div>
        <div className="text-2xl font-bold font-mono text-[#F6F4EE] truncate tracking-wider">
          {display}
        </div>
      </div>

      {/* Button Keypad */}
      <div className="grid grid-cols-4 gap-2 flex-1">
        {buttons.map((btn, idx) => {
          let btnStyle = "bg-[#242220] text-[#F6F4EE] hover:bg-[#2D2B28]";
          if (btn.type === "operator") {
            btnStyle = "bg-[#C45532]/20 text-[#E07A5F] hover:bg-[#C45532]/30 font-bold";
          } else if (btn.type === "danger") {
            btnStyle = "bg-red-950/40 text-red-400 hover:bg-red-900/50";
          } else if (btn.type === "primary") {
            btnStyle = "bg-[#C45532] text-white hover:bg-[#AA4424] font-bold shadow-md";
          }

          return (
            <button
              key={idx}
              onClick={btn.action}
              className={`py-3 rounded-lg font-mono text-sm transition-all active:scale-95 flex items-center justify-center ${btnStyle} ${
                btn.span || ""
              }`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* History Tape Preview */}
      {history.length > 0 && (
        <div className="border-t border-[#2D2B28] pt-2 text-[11px] text-[#A19B90] font-mono flex items-center justify-between">
          <span className="truncate">Last: {history[0]}</span>
          <span className="text-[10px] text-[#C45532] font-semibold">{history.length} records</span>
        </div>
      )}
    </div>
  );
};
