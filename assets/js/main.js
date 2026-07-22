// Oscilloscope-style hero trace.
// Draws a slowly evolving interference pattern (two summed waves),
// evoking a lab instrument readout without being decorative for its own sake.
(function () {
  const canvas = document.getElementById("scope");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width, height, dpr;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3f7d6e";
  const brass = getComputedStyle(document.documentElement).getPropertyValue("--brass").trim() || "#a8763c";
  const line = getComputedStyle(document.documentElement).getPropertyValue("--paper-line").trim() || "#d7dfdd";

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // baseline grid ticks
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const midY = height / 2;

    // primary trace — a beating pattern from two close frequencies (accent)
    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let x = 0; x <= width; x += 2) {
      const p = x / width;
      const y =
        midY +
        Math.sin(p * 26 + t) * 14 * Math.cos(p * 2.2 + t * 0.15) +
        Math.sin(p * 30 - t * 1.3) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // secondary faint trace (brass) — slight phase offset, lower amplitude
    ctx.beginPath();
    ctx.strokeStyle = brass;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.25;
    for (let x = 0; x <= width; x += 2) {
      const p = x / width;
      const y = midY + Math.sin(p * 18 + t * 0.8 + 1.4) * 9;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    t += 0.012;
  }

  if (prefersReduced) {
    draw(); // static single frame
  } else {
    (function loop() {
      draw();
      requestAnimationFrame(loop);
    })();
  }
})();

(function () {
  const dataPath = "assets/data/projects.json";

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date)) return "";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short" });
  }

  function createDocListItem(item, position) {
    return `
      <li class="doc-item">
        <span class="doc-no">${String(position).padStart(2, "0")}</span>
        <div class="doc-body">
          <span class="course-tag">${item.course}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
        <div class="doc-action">
          <a href="${item.url}" target="_blank" rel="noopener">View PDF ↗</a>
        </div>
      </li>
    `;
  }

  function createProjectCard(item) {
    return `
      <article class="card">
        <span class="tag">${item.course}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <span class="meta">${formatDate(item.date)} · Project</span>
        <a class="card-link" href="${item.url}" target="_blank" rel="noopener">View PDF ↗</a>
      </article>
    `;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function renderList(containerId, countId, items, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items.length) {
      if (countId) setText(countId, "0 documents on file");
      container.innerHTML = `<li class="doc-item doc-placeholder"><div class="doc-body"><h3>${emptyMessage}</h3></div></li>`;
      return;
    }

    if (countId) setText(countId, `${items.length} documents on file`);
    container.innerHTML = items
      .map((item, index) => createDocListItem(item, index + 1))
      .join("");
  }

  function renderProjects(containerId, countId, items, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items.length) {
      if (countId) setText(countId, "0 entries");
      container.innerHTML = `<div class="card placeholder"><span class="tag">No project entries yet</span><h3>${emptyMessage}</h3><p>Add entries to <code>assets/data/projects.json</code> and place the PDF in <code>/pdfs/</code>.</p></div>`;
      return;
    }

    if (countId) setText(countId, `${items.length} entries`);
    container.innerHTML = items.map(createProjectCard).join("");
  }

  function hydratePage(data) {
    const docs = Array.isArray(data) ? data.slice() : [];

    docs.forEach((item) => {
      item.__date = new Date(item.date);
    });

    docs.sort((a, b) => b.__date - a.__date || a.title.localeCompare(b.title));

    const projectDocs = docs.filter((item) => item.category === "project");
    const reportDocs = docs.filter((item) => item.category === "report");

    const recentDocsList = document.getElementById("recent-docs-list");
    if (recentDocsList) {
      const recent = projectDocs.slice(0, 2);
      if (recent.length) {
        setText("recent-count", `${recent.length} latest projects`);
        recentDocsList.innerHTML = recent.map((item, idx) => createDocListItem(item, idx + 1)).join("");
      } else {
        renderList("recent-docs-list", "recent-count", [], "No recent projects found.");
      }
    }

    renderList("report-docs-list", "report-count", reportDocs, "No reports found. Add items with category 'report'.");
    renderProjects("project-card-grid", "project-count", projectDocs, "No project documents found yet.");
  }

  function showError() {
    renderList("recent-docs-list", "recent-count", [], "Unable to load recent projects.");
    renderList("report-docs-list", "report-count", [], "Unable to load reports.");
    renderProjects("project-card-grid", "project-count", [], "Unable to load project documents.");
  }

  fetch(dataPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to fetch ${dataPath}: ${response.status}`);
      }
      return response.json();
    })
    .then(hydratePage)
    .catch((error) => {
      console.error("Document loader error:", error);
      showError();
    });
})();