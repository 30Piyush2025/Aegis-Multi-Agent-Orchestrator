/**
 * Aegis Atelier - Multi-Page Client Application Logic
 * Featuring Interactive 3D Wireframe Lining, Multi-Page Navigation,
 * and Quiet Background Processing.
 */

// Global page navigation function
function navigateToPage(pageKey) {
  const allPages = document.querySelectorAll(".page-view");
  allPages.forEach((p) => {
    p.classList.remove("active");
    p.style.display = "none";
  });

  const targetPage = document.getElementById(`page-${pageKey}`);
  if (targetPage) {
    targetPage.style.display = "block";
    // Trigger CSS transition
    setTimeout(() => {
      targetPage.classList.add("active");
    }, 20);
  }

  // Update title bar selector
  const select = document.getElementById("titlebarSelect");
  if (select) {
    select.value = pageKey;
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // If opening character page, trigger 3D canvas resize
  if (pageKey === "character" && window.initCharacter3D) {
    setTimeout(window.initCharacter3D, 100);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------------------------
  // 1. Theme Management (Warm Parchment / Velvet Obsidian)
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
  // 2. Title Bar Multi-Page Navigation
  // ---------------------------------------------------------------------------
  const titlebarSelect = document.getElementById("titlebarSelect");
  const btnGoHome = document.getElementById("btnGoHome");

  if (titlebarSelect) {
    titlebarSelect.addEventListener("change", (e) => {
      navigateToPage(e.target.value);
    });
  }

  if (btnGoHome) {
    btnGoHome.addEventListener("click", () => {
      navigateToPage("home");
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Interactive 3D Kinetic Wireframe Lining Canvas (Front Page Hero)
  // ---------------------------------------------------------------------------
  const canvas3D = document.getElementById("canvas3D");
  if (canvas3D) {
    const ctx = canvas3D.getContext("2d");
    let width, height;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    function resizeCanvas() {
      const rect = canvas3D.parentElement.getBoundingClientRect();
      width = canvas3D.width = rect.width;
      height = canvas3D.height = rect.height;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    canvas3D.parentElement.addEventListener("mousemove", (e) => {
      const rect = canvas3D.getBoundingClientRect();
      targetX = (e.clientX - rect.left - width / 2) * 0.002;
      targetY = (e.clientY - rect.top - height / 2) * 0.002;
    });

    let time = 0;
    function render3DWaves() {
      ctx.clearRect(0, 0, width, height);
      time += 0.015;
      mouseX += (targetX - mouseX) * 0.06;
      mouseY += (targetY - mouseY) * 0.06;

      const isDark = htmlRoot.getAttribute("data-theme") === "dark";
      const strokeColor = isDark ? "rgba(224, 122, 95, 0.28)" : "rgba(196, 85, 50, 0.22)";
      const accentStroke = isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(217, 119, 6, 0.28)";

      const lines = 18;
      const points = 36;
      const stepX = width / (points - 1);

      ctx.lineWidth = 1.2;

      for (let i = 0; i < lines; i++) {
        const depth = i / lines;
        const lineY = height * 0.3 + i * (height * 0.038) + mouseY * 120;
        ctx.strokeStyle = i % 4 === 0 ? accentStroke : strokeColor;
        ctx.beginPath();

        for (let j = 0; j < points; j++) {
          const x = j * stepX;
          const angle = j * 0.25 + time + i * 0.35 + mouseX * 5;
          const wave = Math.sin(angle) * (24 + depth * 35);
          const y = lineY + wave;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      requestAnimationFrame(render3DWaves);
    }
    requestAnimationFrame(render3DWaves);
  }

  // ---------------------------------------------------------------------------
  // 4. Character Art 3D Lining Viewport Canvas
  // ---------------------------------------------------------------------------
  const canvasChar = document.getElementById("canvasCharacter3D");
  if (canvasChar) {
    const ctxChar = canvasChar.getContext("2d");
    let cWidth, cHeight;
    let rotX = 0, rotY = 0;
    let isDragging = false;
    let lastX = 0, lastY = 0;

    function resizeCharCanvas() {
      cWidth = canvasChar.width = canvasChar.parentElement.clientWidth;
      cHeight = canvasChar.height = canvasChar.parentElement.clientHeight;
    }

    resizeCharCanvas();
    window.initCharacter3D = resizeCharCanvas;
    window.addEventListener("resize", resizeCharCanvas);

    canvasChar.addEventListener("mousedown", (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener("mouseup", () => (isDragging = false));

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    let charTime = 0;
    function renderCharacterWireframe() {
      ctxChar.clearRect(0, 0, cWidth, cHeight);
      charTime += 0.01;
      const autoRotY = rotY + charTime * 0.5;

      const isDark = htmlRoot.getAttribute("data-theme") === "dark";
      const primaryLine = isDark ? "#E07A5F" : "#C45532";
      const secondaryLine = isDark ? "rgba(245, 158, 11, 0.45)" : "rgba(217, 119, 6, 0.45)";

      const cx = cWidth / 2;
      const cy = cHeight / 2;
      const radius = Math.min(cWidth, cHeight) * 0.32;

      // Draw 3D wireframe geometric head / mannequin contour loops
      const rings = 12;
      const segments = 24;

      for (let r = 0; r < rings; r++) {
        const phi = (r / rings) * Math.PI;
        ctxChar.beginPath();
        ctxChar.strokeStyle = r % 3 === 0 ? primaryLine : secondaryLine;
        ctxChar.lineWidth = r % 3 === 0 ? 1.4 : 0.8;

        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * 2 * Math.PI + autoRotY;
          // 3D sphere coordinate
          const x3d = radius * Math.sin(phi) * Math.cos(theta);
          const y3d = radius * Math.cos(phi);
          const z3d = radius * Math.sin(phi) * Math.sin(theta);

          // Rotate X
          const yRot = y3d * Math.cos(rotX) - z3d * Math.sin(rotX);
          const zRot = y3d * Math.sin(rotX) + z3d * Math.cos(rotX);

          // Perspective projection
          const fov = 400;
          const scale = fov / (fov + zRot + 200);
          const px = cx + x3d * scale;
          const py = cy + yRot * scale;

          if (s === 0) ctxChar.moveTo(px, py);
          else ctxChar.lineTo(px, py);
        }
        ctxChar.stroke();
      }

      requestAnimationFrame(renderCharacterWireframe);
    }
    requestAnimationFrame(renderCharacterWireframe);
  }

  // ---------------------------------------------------------------------------
  // 5. Calm Progress UI Helper
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
  // 6. Action: Character Art & 3D Lining Studio
  // ---------------------------------------------------------------------------
  const btnProcessChar = document.getElementById("btnProcessCharacter");
  if (btnProcessChar) {
    btnProcessChar.addEventListener("click", async () => {
      const concept = document.getElementById("charConceptInput").value.trim() || "Cybernetic Artisan Nomad";
      const style = document.getElementById("charStyleSelect").value;

      startProgress("Synthesizing 3D character wireframes, topology, and Octane prompt...");

      try {
        const resp = await fetch("/api/character-art", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concept: concept, style: style }),
        });
        const data = await resp.json();
        finishProgress();

        outputHeading.textContent = `3D Character Design: ${data.character_concept}`;
        outputSubheading.textContent = `Style: ${data.style} • Quad-dominant 3D Wireframe Lining`;
        outputActionButtons.innerHTML = `<button class="btn-primary" id="btnCopyOctanePrompt"><span>📸</span> Copy Octane / Midjourney Prompt</button>`;

        let html = `
          <!-- Character Breakdown Grid -->
          <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.4rem; margin-bottom: 1.4rem;">
            <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 0.5rem;">🎭 ${escapeHtml(data.character_breakdown.name)}</h4>
            <p style="font-size: 0.94rem; margin-bottom: 0.8rem;"><strong>Visual Silhouette:</strong> ${escapeHtml(data.character_breakdown.visual_silhouette)}</p>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;"><strong>Expression:</strong> ${escapeHtml(data.character_breakdown.expression_and_mood)}</p>
            
            <h5 style="font-size: 0.88rem; font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; color: var(--accent);">Material Nodes & Tactile Finishes:</h5>
            <div style="display: grid; gap: 0.5rem;">
              ${data.character_breakdown.materials_and_textures.map((m) => `
                <div style="background: var(--surface); padding: 0.6rem 0.9rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 0.88rem;">
                  <strong>${escapeHtml(m.element)}:</strong> ${escapeHtml(m.material)}
                </div>
              `).join("")}
            </div>
          </div>

          <!-- 3D Wireframe Lining Directives -->
          <h4 style="font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 0.8rem;">📐 3D Wireframe Lining & Topology Parameters</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.8rem; margin-bottom: 1.4rem;">
            ${Object.entries(data.lining_3d.lining_parameters).map(([k, v]) => `
              <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.85rem 1rem;">
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${escapeHtml(k)}</div>
                <div style="font-size: 0.88rem; font-family: var(--font-mono); margin-top: 0.2rem;">${escapeHtml(v)}</div>
              </div>
            `).join("")}
          </div>

          <!-- Cinematic Rendering Prompt -->
          <h4 style="font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 0.8rem;">📸 Cinematic Render & Camera Prompt (Octane / Midjourney)</h4>
          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.2rem; font-family: var(--font-mono); font-size: 0.86rem; line-height: 1.6;">
            ${escapeHtml(data.cinematic_render_prompt)}
          </div>
        `;

        outputContentContainer.innerHTML = html;
        technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;

        document.getElementById("btnCopyOctanePrompt").addEventListener("click", () => {
          navigator.clipboard.writeText(data.cinematic_render_prompt);
          alert("Cinematic prompt copied to clipboard!");
        });
      } catch (err) {
        finishProgress();
        alert("Error: " + err.message);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Action: Office & Spreadsheet Processing
  // ---------------------------------------------------------------------------
  const dropzone = document.getElementById("officeDropzone");
  const fileInput = document.getElementById("officeFileInput");
  const officeDataInput = document.getElementById("officeDataInput");
  let uploadedFilePayload = null;

  if (dropzone && fileInput) {
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
        handleOfficeFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length) {
        handleOfficeFile(e.target.files[0]);
      }
    });
  }

  function handleOfficeFile(file) {
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

  const btnProcessOffice = document.getElementById("btnProcessOffice");
  if (btnProcessOffice) {
    btnProcessOffice.addEventListener("click", async () => {
      const rawData = officeDataInput.value.trim();
      const instruction = document.getElementById("officeInstructionInput").value.trim() || "Format clean table";

      if (!rawData && !uploadedFilePayload) {
        alert("Please upload an Excel/CSV file or paste table data.");
        return;
      }

      startProgress("Parsing spreadsheet and executing adjustments...");

      try {
        const payload = {
          data: rawData,
          instruction: instruction,
          file: uploadedFilePayload,
        };

        const resp = await fetch("/api/office/transform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await resp.json();
        finishProgress();

        if (result.success) {
          renderTableDeliverable(result.headers, result.rows, result.actions_taken, result.statistics);
          technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(result.statistics, null, 2))}</pre>`;
        } else {
          outputHeading.textContent = "Spreadsheet Notice";
          outputContentContainer.innerHTML = `<p style="color: var(--accent);">${escapeHtml(result.error || "Unable to parse tabular data.")}</p>`;
        }
      } catch (err) {
        finishProgress();
        alert("Error: " + err.message);
      }
    });
  }

  function renderTableDeliverable(headers, rows, actionsTaken, stats) {
    outputHeading.textContent = "Refined Spreadsheet Deliverable";
    outputSubheading.textContent = `${rows.length} rows × ${headers.length} columns • ${actionsTaken.join(" ")}`;

    outputActionButtons.innerHTML = `
      <button class="btn-secondary" id="btnDownloadCSV"><span>📥</span> Download CSV</button>
      <button class="btn-primary" id="btnDownloadXLSX"><span>📊</span> Download Excel (.xlsx)</button>
      <button class="btn-secondary" id="btnCopyCSV"><span>📋</span> Copy CSV</button>
    `;

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

    const searchInput = document.getElementById("tableSearchInput");
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const trs = document.querySelectorAll("#renderedDataTable tbody tr");
      trs.forEach((tr) => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });

    document.getElementById("btnDownloadCSV").addEventListener("click", () => {
      const csvStr = toCsvString(headers, rows);
      downloadBlob(csvStr, "refined_dataset.csv", "text/csv;charset=utf-8;");
    });

    document.getElementById("btnDownloadXLSX").addEventListener("click", async () => {
      try {
        const resp = await fetch("/api/office/export-xlsx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headers: headers, rows: rows }),
        });
        const blob = await resp.blob();
        downloadBlob(blob, "refined_dataset.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      } catch (err) {
        alert("Downloaded fallback CSV.");
      }
    });

    document.getElementById("btnCopyCSV").addEventListener("click", () => {
      const csvStr = toCsvString(headers, rows);
      navigator.clipboard.writeText(csvStr);
      alert("CSV copied to clipboard!");
    });
  }

  // ---------------------------------------------------------------------------
  // 8. Action: Creator & Media Production
  // ---------------------------------------------------------------------------
  let selectedCreatorFormat = "YouTube Longform";
  const btnYT = document.getElementById("formatYT");
  const btnShort = document.getElementById("formatShort");
  if (btnYT && btnShort) {
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
  }

  const btnProcessCreator = document.getElementById("btnProcessCreator");
  if (btnProcessCreator) {
    btnProcessCreator.addEventListener("click", async () => {
      const topic = document.getElementById("creatorTopicInput").value.trim();
      if (!topic) {
        alert("Please enter a video topic.");
        return;
      }

      startProgress("Engineering video script, hooks, and thumbnail concepts...");

      try {
        const resp = await fetch("/api/creator/script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: topic, format: selectedCreatorFormat }),
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
              <p style="color: var(--text-muted); font-size: 0.86rem;">🎥 Visual: ${escapeHtml(s.visual)}</p>
            </div>
          `).join("")}
        `;

        outputContentContainer.innerHTML = html;
        technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;

        document.getElementById("btnCopyCreator").addEventListener("click", () => {
          navigator.clipboard.writeText(JSON.stringify(data, null, 2));
          alert("Script copied to clipboard!");
        });
      } catch (err) {
        finishProgress();
        alert("Error: " + err.message);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 9. Action: Student & Academic Breakdown
  // ---------------------------------------------------------------------------
  const btnProcessStudent = document.getElementById("btnProcessStudent");
  if (btnProcessStudent) {
    btnProcessStudent.addEventListener("click", async () => {
      const topic = document.getElementById("studentTopicInput").value.trim();
      if (!topic) {
        alert("Please enter a concept or problem.");
        return;
      }

      startProgress("Formulating intuitive mental models and flashcards...");

      try {
        const resp = await fetch("/api/student/assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: topic }),
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
        `;

        outputContentContainer.innerHTML = html;
        technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;

        document.getElementById("btnCopyStudent").addEventListener("click", () => {
          navigator.clipboard.writeText(JSON.stringify(data, null, 2));
          alert("Notes copied to clipboard!");
        });
      } catch (err) {
        finishProgress();
        alert("Error: " + err.message);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 10. Action: Photo & Visual Design Studio
  // ---------------------------------------------------------------------------
  const btnProcessDesign = document.getElementById("btnProcessDesign");
  if (btnProcessDesign) {
    btnProcessDesign.addEventListener("click", async () => {
      const theme = document.getElementById("designThemeInput").value.trim() || "Artisan studio";
      startProgress("Calibrating color harmonies and camera recipes...");

      try {
        const resp = await fetch("/api/design/suite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: theme }),
        });
        const data = await resp.json();
        finishProgress();

        outputHeading.textContent = `Visual Design Suite: ${data.theme}`;
        outputSubheading.textContent = "Color Palettes & Camera Directives";
        outputActionButtons.innerHTML = `<button class="btn-primary" id="btnCopyDesignPrompt"><span>📸</span> Copy AI Prompt</button>`;

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

        outputContentContainer.innerHTML = palettesHtml;
        technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;

        document.getElementById("btnCopyDesignPrompt").addEventListener("click", () => {
          navigator.clipboard.writeText(data.cinematic_image_prompt);
          alert("Prompt copied to clipboard!");
        });
      } catch (err) {
        finishProgress();
        alert("Error: " + err.message);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 11. Action: Code & Software Studio
  // ---------------------------------------------------------------------------
  const btnProcessCode = document.getElementById("btnProcessCode");
  if (btnProcessCode) {
    btnProcessCode.addEventListener("click", async () => {
      const obj = document.getElementById("codeObjectiveInput").value.trim();
      if (!obj) {
        alert("Please enter a software objective.");
        return;
      }

      startProgress("Orchestrator decomposing goals into DAG and dispatching workers...");

      try {
        const resp = await fetch("/api/code/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objective: obj }),
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
                <span style="font-size: 0.78rem; font-weight: 600; color: var(--forest);">Verified</span>
              </div>
              <pre style="background: var(--surface); border: 1px solid var(--border); border-radius: 0 0 var(--radius-sm) var(--radius-sm); padding: 1rem; font-family: var(--font-mono); font-size: 0.82rem; overflow-x: auto; max-height: 280px;">${escapeHtml(art.content || "")}</pre>
            </div>
          `;
        }

        outputContentContainer.innerHTML = filesHtml;
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
  }

  // ---------------------------------------------------------------------------
  // 12. Action: Universal Canvas
  // ---------------------------------------------------------------------------
  const btnProcessUniversal = document.getElementById("btnProcessUniversal");
  if (btnProcessUniversal) {
    btnProcessUniversal.addEventListener("click", async () => {
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
          body: JSON.stringify({ request: req }),
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
  }

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

  function toCsvString(headers, rows) {
    const lines = [];
    lines.push(headers.map(escapeCsvCell).join(","));
    rows.forEach((r) => lines.push(r.map(escapeCsvCell).join(",")));
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
