/**
 * Aegis Desktop Assistant - TypeScript Domain Definitions
 * Enterprise-grade type contracts for Chat, Windows, Tools, and Orchestrator.
 */

export type Role = "user" | "assistant" | "system";

export interface ToolExecutionRecord {
  id: string;
  tool: string;
  status: "running" | "success" | "error";
  durationMs?: number;
  input?: any;
  result?: any;
  error?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  toolExecutions?: ToolExecutionRecord[];
  isStreaming?: boolean;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export type ToolType =
  | "calculator"
  | "clock"
  | "calendar"
  | "spreadsheet"
  | "character-art"
  | "code-orchestrator"
  | "settings";

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloatingWindowState {
  id: ToolType;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  bounds: WindowBounds;
  prevBounds?: WindowBounds;
  zIndex: number;
}

export interface AgentDAGNode {
  id: string;
  title: string;
  domain: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "HEALING";
  assignedTo?: string;
}

export interface OrchestrationResultPayload {
  execution_id: string;
  success: boolean;
  qa_passed: boolean;
  duration_seconds: number;
  healing_iterations: number;
  artifacts: Record<string, { content: string; path?: string }>;
  summary: Record<string, any>;
}

export interface SpreadsheetTransformResult {
  status: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  rows: (string | number)[][];
  statistics?: Record<string, any>;
  summary: string;
}

export interface CharacterArtResult {
  concept: string;
  visual_silhouette: string;
  topology: Record<string, any>;
  render_prompt: string;
  specifications: Record<string, any>;
}
