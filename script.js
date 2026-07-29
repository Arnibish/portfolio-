// script.js
// Interactive Blueprint Grid Background + Navbar show/hide on scroll (Home only)

const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

let W = 0, H = 0, dpr = 1;

const mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false };

// Blueprint settings
const GRID_MAJOR = 120;
const GRID_MINOR = 24;
const DOT_EVERY = 24;
const PARALLAX = 0.035;
const SNAP_COUNT = 7;
const SCAN_SPEED = 0.55;

function resize() {
  dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function lerp(a, b, t) { return a + (b - a) * t; }

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#061523");
  g.addColorStop(1, "#0a2033");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawGrid(offsetX, offsetY) {
  // minor
  ctx.strokeStyle = "rgba(72,214,255,0.06)";
  ctx.lineWidth = 1;

  for (let x = -GRID_MINOR; x <= W + GRID_MINOR; x += GRID_MINOR) {
    ctx.beginPath();
    ctx.moveTo(x + offsetX, 0);
    ctx.lineTo(x + offsetX, H);
    ctx.stroke();
  }
  for (let y = -GRID_MINOR; y <= H + GRID_MINOR; y += GRID_MINOR) {
    ctx.beginPath();
    ctx.moveTo(0, y + offsetY);
    ctx.lineTo(W, y + offsetY);
    ctx.stroke();
  }

  // major
  ctx.strokeStyle = "rgba(72,214,255,0.14)";
  for (let x = -GRID_MAJOR; x <= W + GRID_MAJOR; x += GRID_MAJOR) {
    ctx.beginPath();
    ctx.moveTo(x + offsetX, 0);
    ctx.lineTo(x + offsetX, H);
    ctx.stroke();
  }
  for (let y = -GRID_MAJOR; y <= H + GRID_MAJOR; y += GRID_MAJOR) {
    ctx.beginPath();
    ctx.moveTo(0, y + offsetY);
    ctx.lineTo(W, y + offsetY);
    ctx.stroke();
  }
}

function drawDots(offsetX, offsetY) {
  ctx.fillStyle = "rgba(234,244,255,0.11)";
  const step = DOT_EVERY;

  for (let x = 0; x <= W; x += step) {
    for (let y = 0; y <= H; y += step) {
      if (((x / step) + (y / step)) % 2 !== 0) continue;
      ctx.fillRect(Math.round(x + offsetX) - 1, Math.round(y + offsetY) - 1, 2, 2);
    }
  }
}

function drawScanLine(t) {
  const y = (t * SCAN_SPEED * 120) % (H + 200) - 100;
  const grad = ctx.createLinearGradient(0, y - 40, 0, y + 40);
  grad.addColorStop(0, "rgba(72,214,255,0)");
  grad.addColorStop(0.5, "rgba(72,214,255,0.08)");
  grad.addColorStop(1, "rgba(72,214,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 40, W, 80);
}

function nearestGridPoints(mx, my, offsetX, offsetY) {
  const step = GRID_MINOR;
  const gx = Math.round((mx - offsetX) / step) * step + offsetX;
  const gy = Math.round((my - offsetY) / step) * step + offsetY;

  const pts = [];
  const radius = 4;

  for (let ix = -radius; ix <= radius; ix++) {
    for (let iy = -radius; iy <= radius; iy++) {
      const x = gx + ix * step;
      const y = gy + iy * step;
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;

      const dx = mx - x;
      const dy = my - y;
      const d2 = dx * dx + dy * dy;
      pts.push({ x, y, d2 });
    }
  }

  pts.sort((a, b) => a.d2 - b.d2);
  return pts.slice(0, SNAP_COUNT);
}

function drawMouseOverlay(offsetX, offsetY) {
  if (!mouse.active) return;

  const mx = mouse.x;
  const my = mouse.y;

  const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
  glow.addColorStop(0, "rgba(72,214,255,0.18)");
  glow.addColorStop(1, "rgba(72,214,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(mx - 180, my - 180, 360, 360);

  ctx.strokeStyle = "rgba(234,244,255,0.22)";
  ctx.lineWidth = 1;

  ctx.beginPath(); ctx.moveTo(mx - 18, my); ctx.lineTo(mx + 18, my); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx, my - 18); ctx.lineTo(mx, my + 18); ctx.stroke();

  const pts = nearestGridPoints(mx, my, offsetX, offsetY);

  for (const p of pts) {
    const dist = Math.sqrt(p.d2);
    const alpha = Math.max(0, 1 - dist / 220) * 0.35;

    ctx.strokeStyle = `rgba(72,214,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    ctx.fillStyle = `rgba(234,244,255,${alpha + 0.08})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loop(tms) {
  const t = tms * 0.001;

  mouse.x = lerp(mouse.x, mouse.tx, 0.12);
  mouse.y = lerp(mouse.y, mouse.ty, 0.12);

  const cx = W / 2;
  const cy = H / 2;
  const ox = (cx - mouse.x) * PARALLAX;
  const oy = (cy - mouse.y) * PARALLAX;

  const offsetX = Math.max(-40, Math.min(40, ox));
  const offsetY = Math.max(-40, Math.min(40, oy));

  drawBackground();
  drawScanLine(t);
  drawGrid(offsetX, offsetY);
  drawDots(offsetX, offsetY);
  drawMouseOverlay(offsetX, offsetY);

  requestAnimationFrame(loop);
}

// Mouse + touch
window.addEventListener("mousemove", (e) => {
  mouse.tx = e.clientX;
  mouse.ty = e.clientY;
  mouse.active = true;
});
window.addEventListener("mouseleave", () => (mouse.active = false));

window.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  mouse.tx = touch.clientX;
  mouse.ty = touch.clientY;
  mouse.active = true;
}, { passive: true });

window.addEventListener("touchend", () => (mouse.active = false));

// Init
resize();
mouse.x = mouse.tx = W / 2;
mouse.y = mouse.ty = H / 2;

window.addEventListener("resize", resize);
requestAnimationFrame(loop);

/* ===== NAVBAR SHOW/HIDE ON SCROLL (HOME) ===== */
const nav = document.getElementById("nav");
const hero = document.getElementById("home");

if (nav && hero) {
  window.addEventListener("scroll", () => {
    const heroBottom = hero.getBoundingClientRect().bottom;

    if (heroBottom < 80) {
      nav.classList.add("show");
    } else {
      nav.classList.remove("show");
    }
  });
}

/* ===== DROPDOWNS: ONLY ONE OPEN AT A TIME ===== */
function setupDropdown(dropdownId) {
    const dd = document.getElementById(dropdownId);
    if (!dd) return;
  
    const btn = dd.querySelector(".dropbtn");
    const menu = dd.querySelector(".dropdown-menu");
    if (!btn || !menu) return;
  
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      // Close any other open dropdowns
      document.querySelectorAll(".dropdown.open").forEach((openDD) => {
        if (openDD !== dd) openDD.classList.remove("open");
      });
  
      // Toggle this one
      dd.classList.toggle("open");
    });
  
    // Clicking inside menu shouldn't close it before link works
    menu.addEventListener("click", (e) => {
      e.stopPropagation();
      dd.classList.remove("open");
    });
  }
  
  // Setup both dropdowns (safe if one doesn't exist on a page)
  setupDropdown("expDropdown");
  setupDropdown("projDropdown");

  
  
  // Close dropdowns if you click anywhere else
  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown.open").forEach((openDD) => {
      openDD.classList.remove("open");
    });
  });
  
  // Close dropdowns with Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".dropdown.open").forEach((openDD) => {
        openDD.classList.remove("open");
      });
    }
  });

  // ===== Flip cards (Certifications page) =====
document.querySelectorAll(".flip-card").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
    });
  });

  // ===== Explicit flip-toggle buttons (for cards with embedded 3D viewers) =====
  document.querySelectorAll(".flip-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      btn.closest(".flip-card").classList.toggle("is-flipped");
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        btn.closest(".flip-card").classList.toggle("is-flipped");
      }
    });
  });
  
  

// ===== Scroll tracker (generic, used on Projects page and grouped experience blocks) =====
function initScrollTracker(trackerRoot) {
  const trackerItems = trackerRoot.querySelectorAll(".tracker-item");
  const connectorFills = trackerRoot.querySelectorAll(".tracker-connector .connector-fill");

  if (!trackerItems.length) return;

  const sections = [];
  const ringData = {};

  trackerItems.forEach((item) => {
    const target = document.getElementById(item.dataset.target);
    if (target) sections.push(target);

    const ring = item.querySelector(".ring-fill");
    const r = ring.r.baseVal.value;
    const circumference = 2 * Math.PI * r;
    ring.style.strokeDasharray = `${circumference}`;
    ring.style.strokeDashoffset = `${circumference}`;
    ringData[item.dataset.target] = { ring, circumference };
  });

  if (!sections.length) return;

  function updateTracker() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const overallProgress = docHeight > 0 ? scrollTop / docHeight : 0;

    connectorFills.forEach((fill, i) => {
      const segStart = i / connectorFills.length;
      const segEnd = (i + 1) / connectorFills.length;
      let segProgress = (overallProgress - segStart) / (segEnd - segStart);
      segProgress = Math.max(0, Math.min(1, segProgress));
      fill.style.height = `${segProgress * 100}%`;
      fill.style.opacity = `${0.35 + segProgress * 0.65}`;
    });

    let activeId = null;
    const viewportMid = window.innerHeight * 0.5;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionHeight = rect.height || 1;

      let progress = (viewportMid - rect.top) / sectionHeight;
      progress = Math.max(0, Math.min(1, progress));

      const data = ringData[section.id];
      if (data) {
        const offset = data.circumference * (1 - progress);
        data.ring.style.strokeDashoffset = `${offset}`;
        data.ring.style.opacity = `${0.3 + progress * 0.7}`;
      }

      if (rect.top <= viewportMid && rect.bottom >= viewportMid) {
        activeId = section.id;
      }
    });

    trackerItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.target === activeId);
    });
  }

  trackerItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = document.getElementById(item.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  window.addEventListener("scroll", updateTracker, { passive: true });
  window.addEventListener("resize", updateTracker);
  updateTracker();
}

document.querySelectorAll(".scroll-tracker, .mini-tracker").forEach(initScrollTracker);
