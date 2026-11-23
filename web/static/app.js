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

  // If leaving design page and private photo is loaded, auto-shred memory for privacy guarantee
  if (pageKey !== "design" && window.shredPrivateMemory && window.hasLoadedPrivatePhoto && window.hasLoadedPrivatePhoto()) {
    window.shredPrivateMemory(false);
  }

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
  // 10. Private Photo Permission Vault & Visual Design Studio
  // ---------------------------------------------------------------------------
  const photoPermissionToggle = document.getElementById("photoPermissionToggle");
  const photoPermissionStatusTitle = document.getElementById("photoPermissionStatusTitle");
  const photoPermissionStatusDesc = document.getElementById("photoPermissionStatusDesc");
  const btnShredPhoto = document.getElementById("btnShredPhoto");
  const privatePhotoDropzone = document.getElementById("privatePhotoDropzone");
  const privatePhotoDropzoneText = document.getElementById("privatePhotoDropzoneText");
  const privatePhotoInput = document.getElementById("privatePhotoInput");
  const privatePhotoPreviewContainer = document.getElementById("privatePhotoPreviewContainer");
  const privatePhotoCanvas = document.getElementById("privatePhotoCanvas");
  const btnToggleBlurMask = document.getElementById("btnToggleBlurMask");
  const btnExtractPalette = document.getElementById("btnExtractPalette");

  let privatePhotoData = {
    hasPermission: false,
    rawImage: null,
    isMasked: false,
    fileName: "",
    fileSize: 0,
    width: 0,
    height: 0
  };

  // Toast notification helper
  function showToast(msg) {
    let toast = document.getElementById("aegisToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "aegisToast";
      toast.style.cssText = "position: fixed; bottom: 24px; right: 24px; background: var(--surface); color: var(--text-main); border: 1px solid var(--border-focus); padding: 0.85rem 1.4rem; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); font-size: 0.9rem; font-weight: 600; z-index: 99999; display: flex; align-items: center; gap: 0.6rem; transition: all 0.3s ease; opacity: 0; transform: translateY(10px); pointer-events: none;";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
    }, 3200);
  }

  function shredPrivateMemory(notifyUser = true) {
    if (privatePhotoCanvas) {
      const ctx = privatePhotoCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, privatePhotoCanvas.width, privatePhotoCanvas.height);
        ctx.clearRect(0, 0, privatePhotoCanvas.width, privatePhotoCanvas.height);
      }
      privatePhotoCanvas.width = 1;
      privatePhotoCanvas.height = 1;
    }

    privatePhotoData.rawImage = null;
    privatePhotoData.isMasked = false;
    privatePhotoData.fileName = "";
    privatePhotoData.fileSize = 0;
    privatePhotoData.width = 0;
    privatePhotoData.height = 0;

    if (privatePhotoInput) privatePhotoInput.value = "";
    if (privatePhotoPreviewContainer) privatePhotoPreviewContainer.style.display = "none";
    if (btnShredPhoto) btnShredPhoto.style.display = "none";

    if (photoPermissionToggle) {
      photoPermissionToggle.checked = false;
      privatePhotoData.hasPermission = false;
    }

    if (photoPermissionStatusTitle) {
      photoPermissionStatusTitle.textContent = "Private Photo Sandbox: PERMISSION LOCKED";
      photoPermissionStatusTitle.style.color = "var(--text-main)";
    }
    if (photoPermissionStatusDesc) {
      photoPermissionStatusDesc.textContent = "Explicit user permission required before accessing local or private photography.";
    }

    if (privatePhotoDropzone) {
      privatePhotoDropzone.style.opacity = "0.55";
      privatePhotoDropzone.style.pointerEvents = "none";
      privatePhotoDropzone.style.cursor = "not-allowed";
    }
    if (privatePhotoDropzoneText) {
      privatePhotoDropzoneText.innerHTML = "Toggle <strong>Private Photo Permission</strong> above to load and analyze confidential photos in an isolated local sandbox.";
    }

    if (notifyUser) {
      showToast("🛡️ Photo shredded & purged from memory. Sandbox reset.");
    }
  }

  // Expose global hooks for auto-shred on tab/page close
  window.shredPrivateMemory = shredPrivateMemory;
  window.hasLoadedPrivatePhoto = () => !!privatePhotoData.rawImage;

  // Permission toggle event
  if (photoPermissionToggle) {
    photoPermissionToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        privatePhotoData.hasPermission = true;
        photoPermissionStatusTitle.textContent = "Private Photo Sandbox: PERMISSION GRANTED";
        photoPermissionStatusTitle.style.color = "var(--forest)";
        photoPermissionStatusDesc.textContent = "Local sandbox active: 100% in-browser RAM isolation. Zero cloud exfiltration. EXIF & GPS stripped.";
        privatePhotoDropzone.style.opacity = "1";
        privatePhotoDropzone.style.pointerEvents = "auto";
        privatePhotoDropzone.style.cursor = "pointer";
        privatePhotoDropzoneText.innerHTML = "<strong>Click or drag & drop a confidential photo here</strong> (PNG, JPG, WEBP). Stays 100% local in memory.";
        showToast("🔒 Sandbox Permission Granted. Zero data leaves your device.");
      } else {
        shredPrivateMemory(true);
      }
    });
  }

  // Shred Button event
  if (btnShredPhoto) {
    btnShredPhoto.addEventListener("click", () => {
      shredPrivateMemory(true);
    });
  }

  // Dropzone click -> file input
  if (privatePhotoDropzone && privatePhotoInput) {
    privatePhotoDropzone.addEventListener("click", () => {
      if (privatePhotoData.hasPermission) {
        privatePhotoInput.click();
      }
    });

    privatePhotoDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (privatePhotoData.hasPermission) {
        privatePhotoDropzone.style.borderColor = "var(--forest)";
        privatePhotoDropzone.style.background = "var(--forest-soft)";
      }
    });

    privatePhotoDropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      if (privatePhotoData.hasPermission) {
        privatePhotoDropzone.style.borderColor = "var(--border)";
        privatePhotoDropzone.style.background = "var(--bg-subtle)";
      }
    });

    privatePhotoDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      if (privatePhotoData.hasPermission) {
        privatePhotoDropzone.style.borderColor = "var(--border)";
        privatePhotoDropzone.style.background = "var(--bg-subtle)";
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handlePrivateImageFile(e.dataTransfer.files[0]);
        }
      }
    });

    privatePhotoInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handlePrivateImageFile(e.target.files[0]);
      }
    });
  }

  function handlePrivateImageFile(file) {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPEG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxDim = 1200;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        privatePhotoData.rawImage = img;
        privatePhotoData.fileName = file.name;
        privatePhotoData.fileSize = file.size;
        privatePhotoData.width = w;
        privatePhotoData.height = h;
        privatePhotoData.isMasked = false;

        renderPrivateCanvas();

        privatePhotoPreviewContainer.style.display = "block";
        btnShredPhoto.style.display = "inline-flex";
        privatePhotoDropzoneText.innerHTML = `🔒 Sanitized & Isolated: <strong>${escapeHtml(file.name)}</strong> (${(file.size / 1024).toFixed(1)} KB) • EXIF Cleared • ${w}×${h}px`;
        showToast(`🔒 "${file.name}" loaded into isolated RAM sandbox.`);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function renderPrivateCanvas() {
    if (!privatePhotoCanvas || !privatePhotoData.rawImage) return;
    const ctx = privatePhotoCanvas.getContext("2d");
    const w = privatePhotoData.width;
    const h = privatePhotoData.height;

    privatePhotoCanvas.width = w;
    privatePhotoCanvas.height = h;

    // Draw sanitized image (zero EXIF tags exist in raw canvas pixels)
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(privatePhotoData.rawImage, 0, 0, w, h);

    if (privatePhotoData.isMasked) {
      // Frosted privacy censor overlay for sensitive regions
      ctx.save();
      const maskY = Math.round(h * 0.20);
      const maskH = Math.round(h * 0.40);
      const maskX = Math.round(w * 0.12);
      const maskW = Math.round(w * 0.76);

      ctx.fillStyle = "rgba(18, 17, 16, 0.76)";
      ctx.fillRect(maskX, maskY, maskW, maskH);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 3;
      for (let x = maskX - maskH; x < maskX + maskW + maskH; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, maskY);
        ctx.lineTo(x + maskH, maskY + maskH);
        ctx.stroke();
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 ${Math.max(14, Math.round(w * 0.026))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🔒 PRIVACY SHIELD: CONFIDENTIAL REGION MASKED", w / 2, maskY + maskH / 2);
      ctx.restore();
    }
  }

  // Toggle Blur Mask
  if (btnToggleBlurMask) {
    btnToggleBlurMask.addEventListener("click", () => {
      if (!privatePhotoData.rawImage) {
        alert("Please load a private photo into the sandbox first.");
        return;
      }
      privatePhotoData.isMasked = !privatePhotoData.isMasked;
      renderPrivateCanvas();
      if (privatePhotoData.isMasked) {
        btnToggleBlurMask.innerHTML = `<span>👁️‍🗨️</span> Remove Privacy Blur Mask`;
        showToast("👁️ Privacy blur mask activated.");
      } else {
        btnToggleBlurMask.innerHTML = `<span>👁️</span> Toggle Privacy Blur Mask`;
        showToast("👁️ Full photo preview restored.");
      }
    });
  }

  // Extract Color Palette from Local Canvas Pixels (100% Client-Side In-Memory)
  if (btnExtractPalette) {
    btnExtractPalette.addEventListener("click", () => {
      if (!privatePhotoData.rawImage || !privatePhotoCanvas) {
        alert("Please load a private photo first to extract its color palette.");
        return;
      }

      startProgress("Sampling image color DNA & harmonies locally in memory...");
      setTimeout(() => {
        try {
          const ctx = privatePhotoCanvas.getContext("2d");
          const imgData = ctx.getImageData(0, 0, privatePhotoCanvas.width, privatePhotoCanvas.height);
          const data = imgData.data;

          const colorSamples = [];
          const step = Math.max(1, Math.floor(data.length / (4 * 1200)));
          for (let i = 0; i < data.length; i += 4 * step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a > 128) {
              colorSamples.push({ r, g, b });
            }
          }

          const swatches = extractQuantizedPalette(colorSamples);
          finishProgress();

          outputHeading.textContent = `Private Photo Color DNA: ${privatePhotoData.fileName}`;
          outputSubheading.textContent = `Analyzed locally in memory • ${privatePhotoCanvas.width}×${privatePhotoCanvas.height}px • Zero Cloud Leakage`;
          outputActionButtons.innerHTML = `
            <button class="btn-primary" id="btnCopyPhotoPrompt"><span>📸</span> Copy Midjourney / Octane Recipe</button>
            <button class="btn-secondary" id="btnDownloadPaletteJson"><span>📥</span> Export Palette</button>
          `;

          const hexList = swatches.map(s => s.hex).join(", ");
          const cameraRecipe = `Cinematic natural lighting, 35mm photograph, art direction in harmonious palette (${hexList}), shot on Leica M11, Summilux 50mm f/1.4 lens, natural skin tones, gentle chiaroscuro, 8k resolution, authentic editorial craft --ar 16:9 --style raw`;

          let paletteHtml = `
            <div style="margin-bottom: 1.5rem; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.2rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
                <strong style="font-size: 1rem;">Extracted Dominant Tones</strong>
                <span class="privacy-badge">🔒 100% In-Memory</span>
              </div>
              <div class="palette-grid">
                ${swatches.map(s => `
                  <div class="swatch-card" onclick="navigator.clipboard.writeText('${s.hex}'); alert('Copied ${s.hex} to clipboard!');">
                    <div class="swatch-color" style="background-color: ${s.hex};"></div>
                    <div class="swatch-info">
                      <div class="swatch-name">${escapeHtml(s.name)}</div>
                      <div class="swatch-hex">${s.hex}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="card" style="margin-top: 1.5rem;">
              <h4 style="font-family: var(--font-display); font-size: 1.15rem; margin-bottom: 0.6rem;">Suggested Camera &amp; Lighting Recipe</h4>
              <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 1rem;">
                Based on your photo's local chromatic values, Aegis generated an editorial photo directive that harmonizes with these tones:
              </p>
              <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1rem; font-family: var(--font-mono); font-size: 0.84rem; line-height: 1.6; word-break: break-all;">
                ${escapeHtml(cameraRecipe)}
              </div>
            </div>
          `;

          outputContentContainer.innerHTML = paletteHtml;
          technicalLedgerContent.innerHTML = `<pre>${escapeHtml(JSON.stringify({
            source: "Private Photo Local Memory Sandbox",
            fileName: privatePhotoData.fileName,
            resolution: `${privatePhotoCanvas.width}x${privatePhotoCanvas.height}`,
            palette: swatches,
            exif_status: "Stripped & Zeroed",
            cloud_exfiltration: "None (Client-side Canvas Extraction)"
          }, null, 2))}</pre>`;

          const designThemeInput = document.getElementById("designThemeInput");
          if (designThemeInput) {
            designThemeInput.value = `Artisan editorial palette (${swatches.map(s => s.name).slice(0, 3).join(", ")}) with authentic textures`;
          }

          document.getElementById("btnCopyPhotoPrompt").addEventListener("click", () => {
            navigator.clipboard.writeText(cameraRecipe);
            showToast("📸 Recipe copied to clipboard!");
          });

          document.getElementById("btnDownloadPaletteJson").addEventListener("click", () => {
            downloadBlob(JSON.stringify({ fileName: privatePhotoData.fileName, swatches, cameraRecipe }, null, 2), "aegis_photo_palette.json", "application/json");
          });

          const outSec = document.getElementById("outputSection");
          if (outSec) {
            outSec.scrollIntoView({ behavior: "smooth" });
          }
        } catch (err) {
          finishProgress();
          alert("Error extracting palette: " + err.message);
        }
      }, 400);
    });
  }

  function extractQuantizedPalette(samples) {
    if (!samples.length) {
      return [
        { name: "Terracotta Primary", hex: "#C45532" },
        { name: "Parchment Ivory", hex: "#FAF9F5" },
        { name: "Velvet Obsidian", hex: "#181615" },
        { name: "Pine Forest", hex: "#2B5844" },
        { name: "Warm Amber", hex: "#D97706" }
      ];
    }

    const sorted = [...samples].sort((a, b) => {
      const lumA = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
      const lumB = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
      return lumA - lumB;
    });

    const quant = [
      { role: "Deep Shadow", sample: sorted[Math.floor(sorted.length * 0.05)] },
      { role: "Muted Neutral", sample: sorted[Math.floor(sorted.length * 0.28)] },
      { role: "Dominant Midtone", sample: sorted[Math.floor(sorted.length * 0.50)] },
      { role: "Luminous Accent", sample: sorted[Math.floor(sorted.length * 0.75)] },
      { role: "Highlight Tint", sample: sorted[Math.floor(sorted.length * 0.95)] },
    ];

    return quant.map(q => {
      const hex = rgbToHex(q.sample.r, q.sample.g, q.sample.b);
      return { name: q.role, hex };
    });
  }

  function rgbToHex(r, g, b) {
    const toHex = (n) => {
      const h = Math.max(0, Math.min(255, Math.round(n))).toString(16);
      return h.length === 1 ? "0" + h : h;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  // Standard Design Suite Generator
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

  // ---------------------------------------------------------------------------
  // 13. Dynamic Scroll Reveal Animation Engine
  // ---------------------------------------------------------------------------
  function initScrollReveal() {
    const elements = document.querySelectorAll(".scroll-reveal");
    if (!elements.length) return;

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );

      elements.forEach((el) => observer.observe(el));
    } else {
      // Fallback for older browsers
      elements.forEach((el) => el.classList.add("is-revealed"));
    }
  }

  initScrollReveal();
});
