/**
 * Aegis Desktop Assistant - Centralized API Integration Service
 * Type-safe communication with Aegis Multi-Agent Python Backend.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.error) errorMsg = errorJson.error;
      } catch {
        // Fallback to text
      }
      throw new Error(errorMsg);
    }
    return (await res.json()) as T;
  }

  /**
   * Health Check
   */
  public static async checkHealth(): Promise<{ status: string; engine: string; craft: string }> {
    return this.request("/api/health");
  }

  /**
   * Universal Agent Execution
   */
  public static async executeUniversal(
    prompt: string,
    domain: string = "GENERAL"
  ): Promise<{ status: string; solution_content: string; craft_signature: string; domain: string }> {
    return this.request("/api/universal/execute", {
      method: "POST",
      body: JSON.stringify({ prompt, domain }),
    });
  }

  /**
   * Spreadsheet Data Transformation
   */
  public static async transformSpreadsheet(payload: {
    raw_data?: string;
    drop_columns?: string[];
    filter_query?: string;
    deduplicate?: boolean;
  }): Promise<any> {
    return this.request("/api/office/transform", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Download Excel binary file
   */
  public static async downloadXlsx(headers: string[], rows: (string | number)[][]): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/api/office/export-xlsx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headers, rows }),
    });
    if (!res.ok) throw new Error("Failed to export Excel binary");
    return res.blob();
  }

  /**
   * 3D Character Art & Wireframe Generation
   */
  public static async generateCharacterArt(payload: {
    concept: string;
    style?: string;
    topology_mode?: string;
  }): Promise<any> {
    return this.request("/api/character-art", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Full Hierarchical Multi-Agent DAG Orchestration
   */
  public static async orchestrateCode(
    objective: string,
    healingBudget: number = 3
  ): Promise<any> {
    return this.request("/api/code/orchestrate", {
      method: "POST",
      body: JSON.stringify({ objective, healing_budget: healingBudget }),
    });
  }

  /**
   * Visual Design & Palette Suite
   */
  public static async generateDesignSuite(theme: string): Promise<any> {
    return this.request("/api/design/suite", {
      method: "POST",
      body: JSON.stringify({ theme }),
    });
  }
}
