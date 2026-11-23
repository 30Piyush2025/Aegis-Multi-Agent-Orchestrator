"use client";

import React, { useState } from "react";
import { Download, Play, Table, Trash2, Filter } from "lucide-react";
import { ApiService } from "../../services/api";

const SAMPLE_CSV = `EmployeeID,Name,Department,Salary,Status
101,Aarav Sharma,Engineering,92000,Active
102,Diya Patel,Product,88000,Active
103,Rohan Verma,QA & Systems,76000,Pending
104,Ananya Iyer,Design,81000,Active
105,Aarav Sharma,Engineering,92000,Active
106,Kabir Mehta,Operations,69000,Active`;

export const SpreadsheetTool: React.FC = () => {
  const [rawData, setRawData] = useState(SAMPLE_CSV);
  const [dropColumns, setDropColumns] = useState("EmployeeID");
  const [filterQuery, setFilterQuery] = useState("Salary > 75000");
  const [deduplicate, setDeduplicate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTransform = async () => {
    setLoading(true);
    try {
      const cols = dropColumns.split(",").map((c) => c.trim()).filter(Boolean);
      const data = await ApiService.transformSpreadsheet({
        raw_data: rawData,
        drop_columns: cols,
        filter_query: filterQuery,
        deduplicate: deduplicate,
      });
      setResult(data);
    } catch (err: any) {
      alert("Spreadsheet processing error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadXlsx = async () => {
    if (!result || !result.headers || !result.rows) return;
    try {
      const blob = await ApiService.downloadXlsx(result.headers, result.rows);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aegis_clean_data.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export error: " + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 text-xs">
      {/* Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#1E1D1B] border border-[#2D2B28] p-3 rounded-lg">
        <div>
          <label className="text-[11px] font-semibold text-[#A19B90] block mb-1">
            Columns to Drop (comma-separated):
          </label>
          <input
            type="text"
            value={dropColumns}
            onChange={(e) => setDropColumns(e.target.value)}
            placeholder="e.g. EmployeeID, InternalRef"
            className="w-full bg-[#181615] border border-[#2D2B28] rounded px-2 py-1 text-[#F6F4EE] outline-none focus:border-[#C45532]"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#A19B90] block mb-1">
            Row Filter Condition:
          </label>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="e.g. Salary > 80000 or Status == Active"
            className="w-full bg-[#181615] border border-[#2D2B28] rounded px-2 py-1 text-[#F6F4EE] outline-none focus:border-[#C45532]"
          />
        </div>

        <div className="flex items-end justify-between gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-[#F6F4EE] text-xs">
            <input
              type="checkbox"
              checked={deduplicate}
              onChange={(e) => setDeduplicate(e.target.checked)}
              className="accent-[#C45532]"
            />
            <span>Deduplicate</span>
          </label>

          <button
            onClick={handleTransform}
            disabled={loading}
            className="px-4 py-1.5 bg-[#C45532] text-white font-semibold rounded hover:bg-[#AA4424] flex items-center gap-1 transition-all"
          >
            <Play className="w-3.5 h-3.5" /> {loading ? "Processing..." : "Execute"}
          </button>
        </div>
      </div>

      {/* Main Split: Raw Input vs Table Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[220px]">
        {/* Left: Input Textarea */}
        <div className="flex flex-col bg-[#1E1D1B] border border-[#2D2B28] rounded-lg p-2.5">
          <div className="text-[11px] font-semibold text-[#A19B90] mb-1.5 flex justify-between">
            <span>Raw CSV / TSV Ingestion</span>
            <button
              onClick={() => setRawData(SAMPLE_CSV)}
              className="text-[#C45532] hover:underline"
            >
              Reset Sample
            </button>
          </div>
          <textarea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            className="w-full flex-1 bg-[#181615] border border-[#2D2B28] rounded p-2 font-mono text-[11px] text-[#F6F4EE] outline-none resize-none focus:border-[#C45532]"
          />
        </div>

        {/* Right: Output Table Preview */}
        <div className="flex flex-col bg-[#1E1D1B] border border-[#2D2B28] rounded-lg p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#A19B90] mb-1.5 flex justify-between items-center">
            <span>Cleaned Output Table</span>
            {result && (
              <button
                onClick={handleDownloadXlsx}
                className="px-2 py-0.5 bg-[#2B5844] text-[#86EFAC] text-[11px] font-semibold rounded flex items-center gap-1 hover:bg-[#234837]"
              >
                <Download className="w-3 h-3" /> Download .XLSX
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto border border-[#2D2B28] rounded bg-[#181615]">
            {!result ? (
              <div className="h-full flex items-center justify-center text-[#A19B90]/60 italic p-4 text-center">
                Click "Execute" above to run in-memory spreadsheet transformation.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#242220] border-b border-[#2D2B28] sticky top-0 text-[#F6F4EE]">
                    {result.headers?.map((h: string, i: number) => (
                      <th key={i} className="p-1.5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows?.map((row: any[], rIdx: number) => (
                    <tr
                      key={rIdx}
                      className="border-b border-[#2D2B28]/60 hover:bg-[#1E1D1B]"
                    >
                      {row.map((cell: any, cIdx: number) => (
                        <td key={cIdx} className="p-1.5 text-[#F6F4EE]/90 whitespace-nowrap">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {result && (
            <div className="mt-2 text-[10px] text-[#A19B90] flex justify-between font-mono">
              <span>Rows: {result.rowCount || result.rows?.length}</span>
              <span>Columns: {result.columnCount || result.headers?.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
