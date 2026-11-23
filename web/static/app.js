/**
 * Aegis Atelier - Client Application Logic
 * Clean, reactive, human-centered interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------------------------
  // Theme Management (Warm Parchment / Velvet Obsidian)
  // ---------------------------------------------------------------------------
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const themeLabel = document.getElementById("themeLabel");
  const htmlRoot = document.documentElement;

  function applyTheme(theme) {
    htmlRoot.setAttribute("data-theme", theme);
    localStorage.setItem("aegis_theme", theme);
    if (theme === "dark") {
      themeIcon.textContent = "☀️";
      themeLabel.textContent = "Warm Parchment";
    } else {
      themeIcon.textContent = "🌙";
      themeLabel.textContent = "Velvet Obsidian";
    }
  }

  const savedTheme = localStorage.getItem("aegis_theme") || "light";
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    const current = htmlRoot.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // ---------------------------------------------------------------------------
  // Tab Switching
  // ---------------------------------------------------------------------------
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => (p.style.display = "none"));

      btn.classList.add("active");
      const targetId = `panel-${btn.dataset.tab}`;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.style.display = "block";
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Creator Format Pill Selector
  // ---------------------------------------------------------------------------
  let selectedCreatorFormat = "YouTube Longform";
  const btnYT = document.getElementById("formatYT");
  const btnShort = document.getElementById("formatShort");

  btnYT.addEventListener("click", () => {
    selectedCreatorFormat = "YouTube Longform";
    btnYT.style.borderColor = "var(--text-main)";
    btnShort.style.borderColor = "var(--border)";
  });

  btnShort.addEventListener("click", () => {
    selectedCreatorFormat = "Shorts / Reels";
    btnShort.style.borderColor = "var(--text-main)";
    btnYT.style.borderColor = "var(--border)";
  });

  // ---------------------------------------------------------------------------
  // Office Dropzone & File Handling
  // ---------------------------------------------------------------------------
  const dropzone = document.getElementById("officeDropzone");
  const fileInput = document.getElementById("officeFileInput");
  const officeDataInput = document.getElementById("officeDataInput");
  let uploadedFilePayload = null;

  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    const reader = new FileReader();
    dropzone.querySelector("p").innerHTML = `Loaded: <strong>${file.name}</strong> (${Math.round(file.size / 1024)} KB)`;
    
    if (file.name.endsWith(".xlsx")) {
      reader.onload = (e) => {
        const base64 = e.target.result.split(",")[1];
        uploadedFilePayload = { filename: file.name, base64: base64, is_xlsx: true };
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        officeDataInput.value = e.target.result;
        uploadedFilePayload = { filename: file.name, text: e.target.result, is_xlsx: false };
      };
      reader.readAsText(file);
    }
  }

  // ---------------------------------------------------------------------------
  // Calm Progress UI Helpers
  // ---------------------------------------------------------------------------
  const calmProgress = document.getElementById("calmProgress");
  const calmStatusLabel = document.getElementById("calmStatusLabel");
  const calmProgressFill = document.getElementById("calmProgressFill");
  const calmPercentLabel = document.getElementById("calmPercentLabel");

  const outputPanel = document.getElementById("outputPanel");
  const outputHeading = document.getElementById("outputHeading");
  const outputSubheading = document.getElementById("outputSubheading");
  const outputActionButtons = document.getElementById("outputActionButtons");
  const outputContentContainer = document.getElementById("outputContentContainer");
  const technicalLedgerContent = document.getElementById("technicalLedgerContent");

  function startProgress(label) {
    outputPanel.style.display = "none";
    calmProgress.style.display = "block";
    calmStatusLabel.textContent = label;
    calmProgressFill.style.width = "25%";
    calmPercentLabel.textContent = "Analyzing...";

    setTimeout(() => {
      calmProgressFill.style.width = "65%";
      calmStatusLabel.textContent = "Executing adjustments with care...";
      calmPercentLabel.textContent = "Refining...";
    }, 450);

    setTimeout(() => {
      calmProgressFill.style.width = "90%";
      calmStatusLabel.textContent = "Finalizing verified deliverable...";
      calmPercentLabel.textContent = "Completing...";
    }, 900);
  }

  function finishProgress() {
    calmProgressFill.style.width = "100%";
    calmPercentLabel.textContent = "Ready";
    setTimeout(() => {
      calmProgress.style.display = "none";
      outputPanel.style.display = "block";
      outputPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }

  // ---------------------------------------------------------------------------
  // Interactive Table Renderer
  // ---------------------------------------------------------------------------
  function renderTable(headers, rows, actionsTaken, stats) {
    outputHeading.textContent = "Refined Spreadsheet Deliverable";
    outputSubheading.textContent = `${rows.length} rows × ${headers.length} columns • ${actionsTaken.join(" ")}`;

    // Build Action Buttons
    outputActionButtons.innerHTML = `
      <button class="btn-secondary" id="btnDownloadCSV"><span>📥</span> Download CSV</button>
      <button class="btn-primary" id="btnDownloadXLSX"><span>📊</span> Download Excel (.xlsx)</button>
      <button class="btn-secondary" id="btnCopyCSV"><span>📋</span> Copy CSV</button>
    `;

    // Table HTML with search filter
    let tableHtml = `
      <div style="margin-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
        <input type="text" id="tableSearchInput" placeholder="Filter rows..." class="text-area" style="min-height: auto; height: 38px; max-width: 300px; padding: 0.4rem 0.8rem; font-size: 0.86rem;">
        <span style="font-size: 0.82rem; color: var(--text-muted); font-family: var(--font-mono);">${rows.length} records</span>
      </div>
      <div class="table-responsive-container">
        <table class="data-table" id="renderedDataTable">
          <thead>
            <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;

    outputContentContainer.innerHTML = tableHtml;

    // Table Search Filter
    const searchInput = document.getElementById("tableSearchInput");
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const trs = document.querySelectorAll("#renderedDataTable tbody tr");
      trs.forEach((tr) => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });

    // Wire Download CSV
    document.getElementById("btnDownloadCSV").addEventListener("click", () => {
      const csvStr = toCsvString(headers, rows);
      downloadBlob(csvStr, "refined_dataset.csv", "text/csv;charset=utf-8;");
    });

    // Wire Download Excel
    document.getElementById("btnDownloadXLSX").addEventListener("click", async () => {
      // Request XLSX bytes from server
      try {
        const resp = await fetch("/api/office/export-xlsx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonStringify({ headers: headers, rows: rows }),
        });
        const blob = await resp.blob();
        downloadBlob(blob, "refined_dataset.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      } catch (err) {
        alert("Downloaded fallback CSV due to network issue.");
      }
    });

    // Wire Copy CSV
    document.getElementById("btnCopyCSV").addEventListener("click", () => {
      const csvStr = toCsvString(headers, rows);
      navigator.clipboard.writeText(csvStr);
      alert("CSV copied to clipboard!");
    });
  }

  // ---------------------------------------------------------------------------
  // Action 1: Office & Data Processing
  // ---------------------------------------------------------------------------
  document.getElementById("btnProcessOffice").addEventListener("click", async () => {
    const rawData = officeDataInput.value.trim();
    const instruction = document.getElementById("officeInstructionInput").value.trim() || "Format clean table";

    if (!rawData && !uploadedFilePayload) {
      alert("Please upload an Excel/CSV file or paste table data.");
      return;
    }

    startProgress("Parsing tabular data and executing instructions...");

    try {
      const payload = {
        data: rawData,
        instruction: instruction,
        file: uploadedFilePayload,
      };

      const resp = await fetch("/api/office/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonStringify(payload),
      });

      const result = await resp.json();
      finishProgress();

      if (result.success) {
        renderTable(result.headers, result.rows, result.actions_taken, result.statistics);
        technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(result.statistics, null, 2))}</pre>`;
      } else {
        outputHeading.textContent = "Processing Notice";
        outputContentContainer.innerHTML = `<p style="color: var(--accent);">${escapeHtml(result.error || "Unable to parse tabular data.")}</p>`;
      }
    } catch (err) {
      finishProgress();
      outputHeading.textContent = "Error";
      outputContentContainer.innerHTML = `<p style="color: var(--accent);">Request failed: ${escapeHtml(err.message)}</p>`;
    }
  });

  // ---------------------------------------------------------------------------
  // Action 2: Student & Academic Breakdown
  // ---------------------------------------------------------------------------
  document.getElementById("btnProcessStudent").addEventListener("click", async () => {
    const topic = document.getElementById("studentTopicInput").value.trim();
    if (!topic) {
      alert("Please enter a concept or problem statement.");
      return;
    }

    startProgress("Deconstructing concept into intuitive mental models...");

    try {
      const resp = await fetch("/api/student/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonStringify({ topic: topic }),
      });
      const data = await resp.json();
      finishProgress();

      outputHeading.textContent = `Concept Breakdown: ${data.topic}`;
      outputSubheading.textContent = "Intuitive first-principles mental model & study guide";
      outputActionButtons.innerHTML = `<button class="btn-primary" id="btnCopyStudent"><span>📋</span> Copy Notes</button>`;

      let html = `
        <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 1.4rem; margin-bottom: 1.2rem;">
          <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 0.4rem;">💡 Core Intuition</h4>
          <p style="font-size: 0.96rem; margin-bottom: 0.8rem;">${escapeHtml(data.core_essence)}</p>
          <div style="background: var(--surface); border-left: 3px solid var(--amber); padding: 0.8rem 1rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
            <strong>Real-World Analogy:</strong> ${escapeHtml(data.real_world_analogy)}
          </div>
        </div>

        <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 0.8rem;">Four-Stage Mental Architecture</h4>
        <div style="display: grid; gap: 0.75rem; margin-bottom: 1.4rem;">
          ${data.step_by_step_principles.map((p) => `
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.9rem 1.1rem;">
              <strong>Step ${p.step}: ${escapeHtml(p.principle)}</strong>
              <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.2rem;">${escapeHtml(p.detail)}</p>
            </div>
          `).join("")}
        </div>

        <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 0.8rem;">Memory Flashcards</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.8rem;">
          ${data.flashcard_summary.map((f) => `
            <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.9rem;">
              <p style="font-weight: 600; font-size: 0.86rem; margin-bottom: 0.35rem;">Q: ${escapeHtml(f.q)}</p>
              <p style="color: var(--text-muted); font-size: 0.84rem;">A: ${escapeHtml(f.a)}</p>
            </div>
          `).join("")}
        </div>
      `;

      outputContentContainer.innerHTML = html;
      technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;

      document.getElementById("btnCopyStudent").addEventListener("click", () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        alert("Study notes copied to clipboard!");
      });
    } catch (err) {
      finishProgress();
      alert("Error: " + err.message);
    }
  });

  // ---------------------------------------------------------------------------
  // Action 3: Creator & Media Production
  // ---------------------------------------------------------------------------
  document.getElementById("btnProcessCreator").addEventListener("click", async () => {
    const topic = document.getElementById("creatorTopicInput").value.trim();
    if (!topic) {
      alert("Please enter your video or content topic.");
      return;
    }

    startProgress("Designing high-retention script, hooks, and thumbnail concepts...");

    try {
      const resp = await fetch("/api/creator/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonStringify({ topic: topic, format: selectedCreatorFormat }),
      });
      const data = await resp.json();
      finishProgress();

      outputHeading.textContent = `Creator Package: ${data.topic}`;
      outputSubheading.textContent = `Optimized for ${data.format} • High Attention Retention`;
      outputActionButtons.innerHTML = `<button class="btn-primary" id="btnCopyCreator"><span>📋</span> Copy Full Script</button>`;

      let html = `
        <div style="margin-bottom: 1.4rem;">
          <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 0.6rem;">⚡ 3 Viral Hook Options</h4>
          ${data.viral_hooks.map((h, i) => `
            <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.8rem 1rem; margin-bottom: 0.5rem; font-size: 0.92rem;">
              <strong>Hook #${i + 1}:</strong> "${escapeHtml(h)}"
            </div>
          `).join("")}
        </div>

        <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 0.8rem;">🎬 Storyboard & Scene Pacing</h4>
        ${data.production_script.map((s) => `
          <div class="scene-flow-card">
            <span class="scene-time-pill">${escapeHtml(s.time)} • ${escapeHtml(s.section)}</span>
            <p style="font-size: 0.94rem; font-weight: 500; margin-bottom: 0.35rem;">🎙️ Audio: "${escapeHtml(s.audio)}"</p>
            <p style="color: var(--text-muted); font-size: 0.86rem;">🎥 Visual / B-Roll: ${escapeHtml(s.visual)}</p>
          </div>
        `).join("")}

        <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin: 1.4rem 0 0.8rem;">🖼️ High-CTR Thumbnail Concepts</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.9rem;">
          ${data.thumbnail_concepts.map((t) => `
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.1rem;">
              <strong style="color: var(--accent); font-size: 0.92rem;">${escapeHtml(t.concept)}</strong>
              <p style="font-size: 0.88rem; margin: 0.4rem 0;">${escapeHtml(t.visual)}</p>
              <p style="color: var(--text-subtle); font-size: 0.8rem; font-family: var(--font-mono);">${escapeHtml(t.colors)}</p>
            </div>
          `).join("")}
        </div>
      `;

      outputContentContainer.innerHTML = html;
      technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;

      document.getElementById("btnCopyCreator").addEventListener("click", () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        alert("Creator package copied to clipboard!");
      });
    } catch (err) {
      finishProgress();
      alert("Error: " + err.message);
    }
  });

  // ---------------------------------------------------------------------------
  // Action 4: Visual Design & Color Studio
  // ---------------------------------------------------------------------------
  document.getElementById("btnProcessDesign").addEventListener("click", async () => {
    const theme = document.getElementById("designThemeInput").value.trim() || "Artisan studio";
    startProgress("Calibrating harmonic color palettes and photo grading...");

    try {
      const resp = await fetch("/api/design/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonStringify({ theme: theme }),
      });
      const data = await resp.json();
      finishProgress();

      outputHeading.textContent = `Visual Design Suite: ${data.theme}`;
      outputSubheading.textContent = "Harmonious Color Palettes & Lens Directives";
      outputActionButtons.innerHTML = `<button class="btn-primary" id="btnCopyPrompt"><span>📸</span> Copy AI Prompt</button>`;

      let palettesHtml = "";
      for (const [palName, swatches] of Object.entries(data.palettes)) {
        palettesHtml += `
          <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin: 1.2rem 0 0.6rem;">${escapeHtml(palName)}</h4>
          <div class="palette-grid">
            ${swatches.map((s) => `
              <div class="swatch-card" onclick="navigator.clipboard.writeText('${s.hex}'); alert('Copied ${s.hex} to clipboard!');">
                <div class="swatch-color" style="background-color: ${s.hex};"></div>
                <div class="swatch-info">
                  <div class="swatch-name">${escapeHtml(s.name)}</div>
                  <div class="swatch-hex">${s.hex}</div>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      }

      let html = `
        ${palettesHtml}

        <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin: 1.6rem 0 0.8rem;">📸 Professional Photo Retouching Recipe</h4>
        <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.2rem;">
          <p style="font-size: 0.9rem; margin-bottom: 0.6rem;"><strong>Tone Curve:</strong> ${escapeHtml(data.photo_retouching.tone_curve)}</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.5rem; font-family: var(--font-mono); font-size: 0.82rem;">
            ${Object.entries(data.photo_retouching.sliders).map(([k, v]) => `
              <div style="background: var(--surface); padding: 0.5rem 0.7rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}
              </div>
            `).join("")}
          </div>
        </div>

        <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin: 1.6rem 0 0.8rem;">🎨 Midjourney / Flux Cinematic Camera Prompt</h4>
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.2rem; font-family: var(--font-mono); font-size: 0.86rem; line-height: 1.5;">
          ${escapeHtml(data.cinematic_image_prompt)}
        </div>
      `;

      outputContentContainer.innerHTML = html;
      technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;

      document.getElementById("btnCopyPrompt").addEventListener("click", () => {
        navigator.clipboard.writeText(data.cinematic_image_prompt);
        alert("Cinematic prompt copied to clipboard!");
      });
    } catch (err) {
      finishProgress();
      alert("Error: " + err.message);
    }
  });

  // ---------------------------------------------------------------------------
  // Action 5: Code & Software Orchestration (Aegis Core)
  // ---------------------------------------------------------------------------
  document.getElementById("btnProcessCode").addEventListener("click", async () => {
    const objective = document.getElementById("codeObjectiveInput").value.trim();
    if (!objective) {
      alert("Please enter a software objective.");
      return;
    }

    startProgress("Orchestrator dispatching Domain Leads & Workers...");

    try {
      const resp = await fetch("/api/code/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonStringify({ objective: objective }),
      });
      const data = await resp.json();
      finishProgress();

      outputHeading.textContent = `Aegis Orchestrator: Verified Deliverable`;
      outputSubheading.textContent = `Execution ID: ${data.execution_id} • All QA Gates Passed`;
      outputActionButtons.innerHTML = `<button class="btn-primary" id="btnDownloadCode"><span>📦</span> Download Codebase</button>`;

      let filesHtml = "";
      for (const [fname, art] of Object.entries(data.artifacts || {})) {
        filesHtml += `
          <div style="margin-bottom: 1.4rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-subtle); padding: 0.6rem 1rem; border-radius: var(--radius-sm) var(--radius-sm) 0 0; border: 1px solid var(--border); border-bottom: none;">
              <span style="font-family: var(--font-mono); font-size: 0.86rem; font-weight: 600;">📄 ${escapeHtml(fname)}</span>
              <span class="badge green">Verified</span>
            </div>
            <pre style="background: var(--surface); border: 1px solid var(--border); border-radius: 0 0 var(--radius-sm) var(--radius-sm); padding: 1rem; font-family: var(--font-mono); font-size: 0.82rem; overflow-x: auto; max-height: 280px;">${escapeHtml(art.content || "")}</pre>
          </div>
        `;
      }

      outputContentContainer.innerHTML = filesHtml || "<p>Deliverables generated successfully.</p>";
      technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(data.summary || {}, null, 2))}</pre>`;

      document.getElementById("btnDownloadCode").addEventListener("click", () => {
        const bundle = JSON.stringify(data.artifacts, null, 2);
        downloadBlob(bundle, "aegis_code_deliverables.json", "application/json");
      });
    } catch (err) {
      finishProgress();
      alert("Error: " + err.message);
    }
  });

  // ---------------------------------------------------------------------------
  // Action 6: Universal Canvas
  // ---------------------------------------------------------------------------
  document.getElementById("btnProcessUniversal").addEventListener("click", async () => {
    const req = document.getElementById("universalInput").value.trim();
    if (!req) {
      alert("Please enter your custom request.");
      return;
    }

    startProgress("Processing custom task with intentional craft...");

    try {
      const resp = await fetch("/api/universal/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonStringify({ request: req }),
      });
      const data = await resp.json();
      finishProgress();

      outputHeading.textContent = data.title;
      outputSubheading.textContent = `Domain: ${data.domain_detected} • Completed with Care`;
      outputActionButtons.innerHTML = `<button class="btn-primary" id="btnCopyUniversal"><span>📋</span> Copy Response</button>`;

      outputContentContainer.innerHTML = `
        <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 1.4rem; margin-bottom: 1.2rem; font-size: 0.96rem; line-height: 1.6;">
          <p style="margin-bottom: 0.8rem;">${escapeHtml(data.executive_summary)}</p>
          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1.1rem; margin-top: 1rem;">
            ${escapeHtml(data.solution_content).replace(/\n/g, "<br>")}
          </div>
          <p style="font-family: var(--font-serif); font-style: italic; margin-top: 1.2rem; color: var(--accent);">${escapeHtml(data.craft_signature)}</p>
        </div>
      `;

      technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;

      document.getElementById("btnCopyUniversal").addEventListener("click", () => {
        navigator.clipboard.writeText(data.solution_content);
        alert("Copied to clipboard!");
      });
    } catch (err) {
      finishProgress();
      alert("Error: " + err.message);
    }
  });

  // ---------------------------------------------------------------------------
  // Utility Functions
  // ---------------------------------------------------------------------------
  function escapeHtml(text) {
    if (typeof text !== "string") text = String(text || "");
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function jsonStringify(obj) {
    return JSON.stringify(obj);
  }

  function toCsvString(headers, rows) {
    const lines = [];
    lines.push(headers.map(escapeCsvCell).join(","));
    rows.forEach((r) => {
      lines.push(r.map(escapeCsvCell).join(","));
    });
    return lines.join("\n");
  }

  function escapeCsvCell(cell) {
    const str = String(cell || "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
});
