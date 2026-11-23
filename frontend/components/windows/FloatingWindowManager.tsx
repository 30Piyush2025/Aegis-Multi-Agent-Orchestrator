"use client";

import React from "react";
import { useWindowStore } from "../../store/windowStore";
import { WindowFrame } from "./WindowFrame";
import { CalculatorTool } from "../tools/CalculatorTool";
import { ClockTool } from "../tools/ClockTool";
import { CalendarTool } from "../tools/CalendarTool";
import { SpreadsheetTool } from "../tools/SpreadsheetTool";
import { CharacterArtTool } from "../tools/CharacterArtTool";
import { CodeOrchestratorTool } from "../tools/CodeOrchestratorTool";
import { SettingsTool } from "../tools/SettingsTool";
import { ToolType } from "../../types";

export const FloatingWindowManager: React.FC = () => {
  const { windows } = useWindowStore();

  const renderToolComponent = (id: ToolType) => {
    switch (id) {
      case "calculator":
        return <CalculatorTool />;
      case "clock":
        return <ClockTool />;
      case "calendar":
        return <CalendarTool />;
      case "spreadsheet":
        return <SpreadsheetTool />;
      case "character-art":
        return <CharacterArtTool />;
      case "code-orchestrator":
        return <CodeOrchestratorTool />;
      case "settings":
        return <SettingsTool />;
      default:
        return <div>Tool content not found</div>;
    }
  };

  return (
    <>
      {(Object.keys(windows) as ToolType[]).map((id) => {
        const win = windows[id];
        return (
          <WindowFrame key={id} window={win}>
            {renderToolComponent(id)}
          </WindowFrame>
        );
      })}
    </>
  );
};
