// ========= Helpers =========
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function rand(min, max) { return Math.random() * (max - min) + min; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

// ========= State =========
const state = {
  pops: 0,
  bites: 0,
  wishes: 0,
  musicOn: false,
  starsOn: false,
  balloons: 10,
  cakeSlices: 12,
};

function updateStats() {
  $("#statPops").textContent = state.pops;
  $("#statCake").textContent = state.bites;
  $("#statWishes").textContent = state.wishes;
  $("#cakeBites").textContent = state.bites;
}

// ========= Canvas FX (confetti + balloons float + stars trails) =========
const canvas = $("#fx");
const ctx = canvas.getContext("2d", { alpha: true });

let W = 0, H = 0, DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

function resize() {
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize);
resize();

const particles = [];
const trails = [];
const skyBalloons = [];

function addConfettiBurst(x = W / 2, y = H / 2, count = 140) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: rand(-6, 6),
      vy: rand(-9, -2),
      g: rand(0.18, 0.30),
      size: rand(3, 7),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.18, 0.18),
      life: rand(70, 120),
      hue: rand(0, 360),
      alpha: 1,
      kind: "confetti",
    });
  }
}

function addHeartsBurst(x, y, count = 18) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: rand(-2.8, 2.8),
      vy: rand(-4.6, -1.2),
      g: 0.08,
      size: rand(10, 18),
      life: rand(50, 90),
      hue: rand(320, 360),
      alpha: 1,
      kind: "heart",
      wob: rand(0, Math.PI * 2),
    });
  }
}

function addPopBurst(x, y, hue = rand(0, 360)) {
  for (let i = 0; i < 24; i++) {
    particles.push({
      x, y,
      vx: rand(-4.2, 4.2),
      vy: rand(-4.2, 4.2),
      g: 0.10,
      size: rand(2, 5),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.2, 0.2),
      life: rand(35, 70),
      hue,
      alpha: 1,
      kind: "spark",
    });
  }
}

function spawnSkyBalloons(n = 6) {
  for (let i = 0; i < n; i++) {
    skyBalloons.push({
      x: rand(40, W - 40),
      y: H + rand(20, 260),
      r: rand(14, 24),
      vy: rand(0.25, 0.60),
      sway: rand(0.6, 1.4),
      phase: rand(0, Math.PI * 2),
      hue: rand(0, 360),
      alpha: rand(0.25, 0.42),
    });
  }
}

spawnSkyBalloons(12);

function drawHeart(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.28);
  ctx.bezierCurveTo(0, 0, -s * 0.5, 0, -s * 0.5, s * 0.28);
  ctx.bezierCurveTo(-s * 0.5, s * 0.55, -s * 0.15, s * 0.78, 0, s);
  ctx.bezierCurveTo(s * 0.15, s * 0.78, s * 0.5, s * 0.55, s * 0.5, s * 0.28);
  ctx.bezierCurveTo(s * 0.5, 0, 0, 0, 0, s * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function tick() {
  ctx.clearRect(0, 0, W, H);

  // soft background dots
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % W;
    const y = (i * 173) % H;
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // sky balloons
  for (let i = skyBalloons.length - 1; i >= 0; i--) {
    const b = skyBalloons[i];
    b.y -= b.vy;
    b.phase += 0.012 * b.sway;
    const sx = b.x + Math.sin(b.phase) * 16;

    ctx.globalAlpha = b.alpha;
    ctx.fillStyle = `hsla(${b.hue}, 90%, 65%, 1)`;
    ctx.beginPath();
    ctx.ellipse(sx, b.y, b.r * 0.9, b.r * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255,255,255,0.25)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, b.y + b.r * 1.05);
    ctx.lineTo(sx + Math.sin(b.phase * 1.3) * 8, b.y + b.r * 1.05 + 26);
    ctx.stroke();

    ctx.globalAlpha = 1;

    if (b.y < -60) {
      skyBalloons.splice(i, 1);
      skyBalloons.push({
        x: rand(40, W - 40),
        y: H + rand(40, 220),
        r: rand(14, 24),
        vy: rand(0.25, 0.60),
        sway: rand(0.6, 1.4),
        phase: rand(0, Math.PI * 2),
        hue: rand(0, 360),
        alpha: rand(0.25, 0.42),
      });
    }
  }

  // star trails
  if (state.starsOn) {
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.life -= 1;
      t.r += 0.06;
      t.alpha *= 0.965;

      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = `hsla(${t.hue}, 95%, 70%, 1)`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (t.life <= 0 || t.alpha < 0.02) trails.splice(i, 1);
    }
  }

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 1;
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;

    if (p.kind === "confetti" || p.kind === "spark") {
      p.rot += p.vr;
      p.alpha *= 0.985;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsla(${p.hue}, 95%, 68%, 1)`;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
      ctx.globalAlpha = 1;
    } else if (p.kind === "heart") {
      p.wob += 0.12;
      p.alpha *= 0.986;
      const wobx = Math.sin(p.wob) * 0.9;

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, 1)`;
      drawHeart(p.x + wobx, p.y, p.size);
      ctx.globalAlpha = 1;
    }

    if (p.life <= 0 || p.y > H + 200 || p.x < -200 || p.x > W + 200) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(tick);
}
tick();

// ========= Balloon Pop DOM =========
const balloonField = $("#balloonField");

function balloonColor() {
  const hue = Math.floor(rand(0, 360));
  return {
    hue,
    css: `linear-gradient(180deg, hsla(${hue}, 92%, 70%, .95), hsla(${hue}, 88%, 54%, .95))`,
  };
}

function makeBalloon() {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "balloon";
  const { hue, css } = balloonColor();
  b.dataset.hue = String(hue);
  b.style.background = css;

  const x = rand(10, balloonField.clientWidth - 64);
  const y = rand(18, balloonField.clientHeight - 92);
  b.style.left = `${x}px`;
  b.style.top = `${y}px`;

  b.innerHTML = `<span>🎈</span>`;

  b.addEventListener("click", (e) => {
    e.preventDefault();
    const rect = b.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    state.pops++;
    updateStats();
    addPopBurst(cx, cy, Number(b.dataset.hue || 0));

    b.animate(
      [
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.35)", filter: "brightness(1.2)" },
        { transform: "scale(0.2)", opacity: 0 }
      ],
      { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" }
    ).onfinish = () => b.remove();

    toast("POP! 🎈");
  });

  balloonField.appendChild(b);
}

function setBalloonCount(n) {
  state.balloons = clamp(n, 0, 30);
  balloonField.innerHTML = "";
  for (let i = 0; i < state.balloons; i++) makeBalloon();
}

function addBalloons(n = 5) {
  for (let i = 0; i < n; i++) makeBalloon();
  state.balloons = balloonField.children.length;
}

setBalloonCount(state.balloons);

// ========= Cake Eating =========
const cake = $("#cake");
const slices = $("#slices");
const crumbs = $("#crumbs");
let eaten = new Array(state.cakeSlices).fill(false);

function buildSlices() {
  slices.innerHTML = "";
  const total = state.cakeSlices;

  for (let i = 0; i < total; i++) {
    const s = document.createElement("button");
    s.type = "button";
    s.className = "slice";
    s.style.transform = `rotate(${(360 / total) * i}deg)`;
    s.style.background = `hsla(${(i * 360) / total}, 95%, 70%, 1)`;
    s.style.border = "1px solid rgba(255,255,255,.10)";
    s.style.cursor = "pointer";
    s.style.opacity = "0";
    s.dataset.idx = String(i);

    s.addEventListener("mouseenter", () => (s.style.opacity = "0.12"));
    s.addEventListener("mouseleave", () => (s.style.opacity = "0"));

    s.addEventListener("click", (e) => {
      e.preventDefault();
      eatSlice(i);
    });

    slices.appendChild(s);
  }
}

function spawnCrumbs(x, y) {
  const rect = crumbs.getBoundingClientRect();
  const bx = x - rect.left;
  const by = y - rect.top;

  for (let i = 0; i < 10; i++) {
    const c = document.createElement("div");
    c.className = "crumb";
    c.style.left = `${bx + rand(-18, 18)}px`;
    c.style.top = `${by + rand(-10, 18)}px`;
    c.style.transform = `rotate(${rand(0, 360)}deg)`;
    c.style.opacity = String(rand(0.4, 0.9));
    crumbs.appendChild(c);

    const dx = rand(-18, 18);
    const dy = rand(8, 26);
    c.animate(
      [
        { transform: `translate(0,0) rotate(0deg)`, opacity: c.style.opacity },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rand(-80, 80)}deg)`, opacity: 0 }
      ],
      { duration: rand(450, 800), easing: "cubic-bezier(.2,.8,.2,1)" }
    ).onfinish = () => c.remove();
  }
}

function shrinkCake() {
  const eatenCount = eaten.filter(Boolean).length;
  const remaining = state.cakeSlices - eatenCount;
  const ratio = remaining / state.cakeSlices; // 1..0
  const scale = 0.86 + ratio * 0.14; // never disappears entirely
  const squish = 1 + (1 - ratio) * 0.06;

  cake.style.transform = `translateY(-6px) scale(${scale}, ${scale * (1 - (squish - 1) * 0.2)})`;
  cake.style.filter = `drop-shadow(0 18px 32px rgba(0,0,0,.28))`;
}

function eatSlice(i) {
  if (eaten[i]) return;

  eaten[i] = true;
  state.bites++;
  updateStats();

  // little confetti puff at cake location
  const rect = cake.getBoundingClientRect();
  addConfettiBurst(rect.left + rect.width * rand(0.35, 0.65), rect.top + rect.height * rand(0.35, 0.55), 22);

  // crumbs
  spawnCrumbs(rect.left + rect.width / 2, rect.top + rect.height * 0.78);

  // pulse cake
  cake.animate(
    [{ transform: cake.style.transform || "translateY(-6px) scale(1)" },
     { transform: "translateY(-8px) scale(1.02)" },
     { transform: cake.style.transform || "translateY(-6px) scale(1)" }],
    { duration: 240, easing: "ease-out" }
  );

  shrinkCake();
  toast("Nom nom 🍰");

  // finish message
  const eatenCount = eaten.filter(Boolean).length;
  if (eatenCount >= state.cakeSlices) {
    toast("Cake finished! Refill? 🎂✨");
    addHeartsBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
  }
}

function resetCake() {
  state.bites = 0;
  eaten = new Array(state.cakeSlices).fill(false);
  cake.style.transform = "translateY(-6px) scale(1)";
  updateStats();
  toast("Cake refilled! 🎂");
}

buildSlices();
shrinkCake();

cake.addEventListener("click", () => {
  // If clicked not on slice: eat a random remaining slice
  const remainingIdx = eaten.map((v, idx) => (!v ? idx : null)).filter(v => v !== null);
  if (!remainingIdx.length) return;
  eatSlice(remainingIdx[Math.floor(Math.random() * remainingIdx.length)]);
});
cake.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    cake.click();
  }
});

$("#btnRefill").addEventListener("click", resetCake);

// ========= Gift =========
const gift = $("#gift");
const giftMsg = $("#giftMsg");

function openGift() {
  gift.classList.add("open");
  giftMsg.classList.add("show");

  const rect = gift.getBoundingClientRect();
  addHeartsBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 26);
  addConfettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
  toast("Surprise! 💝");
}

function closeGift() {
  gift.classList.remove("open");
  giftMsg.classList.remove("show");
}

gift.addEventListener("click", () => {
  if (giftMsg.classList.contains("show")) closeGift();
  else openGift();
});
$("#btnCloseGift").addEventListener("click", closeGift);

$("#btnHearts").addEventListener("click", () => {
  const rect = gift.getBoundingClientRect();
  addHeartsBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 18);
  toast("More love 💗");
});

// ========= Stars mode (drag sparkles + wish counter) =========
let dragging = false;
let lastWishAt = 0;

function addTrail(x, y) {
  trails.push({
    x, y,
    r: rand(1.2, 2.8),
    hue: rand(0, 360),
    alpha: rand(0.55, 0.95),
    life: rand(18, 40),
  });
}

window.addEventListener("pointerdown", (e) => {
  dragging = true;
  if (state.starsOn) {
    addTrail(e.clientX, e.clientY);
  }
});

window.addEventListener("pointerup", () => { dragging = false; });

window.addEventListener("pointermove", (e) => {
  if (!state.starsOn) return;
  if (!dragging) return;

  addTrail(e.clientX, e.clientY);
  addTrail(e.clientX + rand(-6, 6), e.clientY + rand(-6, 6));

  const now = performance.now();
  if (now - lastWishAt > 950) {
    state.wishes++;
    updateStats();
    lastWishAt = now;
    toast("Wish sent ✨");
  }
});

// ========= Music (WebAudio synth, no files) =========
let audioCtx = null;
let master = null;
let musicTimer = null;

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  master = audioCtx.createGain();
  master.gain.value = 0.10;
  master.connect(audioCtx.destination);
}

function playNote(freq, t, dur = 0.12) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  o.type = "triangle";
  o.frequency.setValueAtTime(freq, t);

  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.9, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.connect(g);
  g.connect(master);

  o.start(t);
  o.stop(t + dur + 0.02);
}

function startMusic() {
  ensureAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();

  const scale = [0, 2, 4, 7, 9, 12]; // pentatonic-ish
  const base = 220;
  let step = 0;

  if (musicTimer) clearInterval(musicTimer);
  musicTimer = setInterval(() => {
    const t = audioCtx.currentTime + 0.02;
    const deg = scale[step % scale.length];
    const freq = base * Math.pow(2, deg / 12);

    playNote(freq, t, 0.12);
    if (step % 6 === 0) playNote(freq * 2, t + 0.02, 0.08);

    step++;
  }, 180);
}

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

function setMusic(on) {
  state.musicOn = on;
  const btn = $("#btnMusic");
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.textContent = on ? "🎵 Music: On" : "🎵 Music: Off";
  if (on) startMusic();
  else stopMusic();
}

// ========= Buttons =========
$("#btnConfetti").addEventListener("click", (e) => {
  addConfettiBurst(rand(W * 0.25, W * 0.75), rand(H * 0.25, H * 0.60), 160);
  toast("WOOO 🎉");
});

$("#btnSurprise").addEventListener("click", () => {
  addConfettiBurst(W * 0.5, H * 0.35, 260);
  spawnSkyBalloons(10);
  addBalloons(7);
  toast("HAPPY BIRTHDAY MOM!!! 💛🎉");
});

$("#btnAddBalloons").addEventListener("click", () => {
  addBalloons(6);
  toast("More balloons 🎈");
});

$("#btnMore").addEventListener("click", () => {
  addBalloons(4);
  toast("+ balloons");
});

$("#btnLess").addEventListener("click", () => {
  const kids = Array.from(balloonField.children);
  for (let i = 0; i < 3 && kids.length - i - 1 >= 0; i++) {
    kids[kids.length - i - 1].remove();
  }
  state.balloons = balloonField.children.length;
  toast("- balloons");
});

$("#btnReset").addEventListener("click", () => {
  state.pops = 0;
  state.wishes = 0;
  setBalloonCount(10);
  resetCake();
  closeGift();
  addConfettiBurst(W * 0.5, H * 0.35, 90);
  updateStats();
  toast("Reset! ✨");
});

$("#btnStars").addEventListener("click", () => {
  state.starsOn = !state.starsOn;
  $("#btnStars").setAttribute("aria-pressed", state.starsOn ? "true" : "false");
  $("#btnStars").textContent = state.starsOn ? "✨ Stars: On" : "✨ Stars: Off";
  toast(state.starsOn ? "Drag to make wishes ✨" : "Stars off");
});

$("#btnMusic").addEventListener("click", () => {
  setMusic(!state.musicOn);
  toast(state.musicOn ? "Music on 🎵" : "Music off");
});

// ========= Little welcome flourish =========
updateStats();
setTimeout(() => {
  addConfettiBurst(W * 0.55, H * 0.28, 120);
  toast("Click around 😄");
}, 450);

// Also let user click background to sparkle a bit
window.addEventListener("click", (e) => {
  // avoid spamming when clicking UI buttons
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
  if (["button", "a", "input"].includes(tag)) return;

  addPopBurst(e.clientX, e.clientY, rand(0, 360));
  if (state.starsOn) addTrail(e.clientX, e.clientY);
});