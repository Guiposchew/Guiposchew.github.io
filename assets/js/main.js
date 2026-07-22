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