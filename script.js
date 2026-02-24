// ====== STRICT MESSAGE LIST (only these) ======
const MESSAGES = [
  "I love you :)",
  "You're the best mom in the world!",
  "Happy Birthday! *hearts"
];

// ====== Helpers ======
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => Math.random() * (b - a) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._id);
  toast._id = setTimeout(() => t.classList.remove("show"), 1800);
}

// ====== State ======
const state = {
  sparkles: 0,
  bites: 0,
  hearts: 0,
  neon: true,
  happiness: 8, // %
  orbsCaught: 0
};

function updateUI(){
  $("#sparklesCount").textContent = state.sparkles;
  $("#bitesCount").textContent = state.bites;
  $("#heartsCount").textContent = state.hearts;

  $("#bites").textContent = state.bites;
  $("#hearts").textContent = state.hearts;

  $("#meterFill").style.width = `${clamp(state.happiness, 0, 100)}%`;
}

function addHappiness(n){
  state.happiness = clamp(state.happiness + n, 0, 100);
  updateUI();
}

// ====== Background Canvas (neon grid + particles) ======
const canvas = $("#bg");
const ctx = canvas.getContext("2d", { alpha: true });
let W = 0, H = 0;
let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

const bgParticles = [];

function resize(){
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function spawnBgBurst(x, y, n = 40){
  for(let i=0;i<n;i++){
    bgParticles.push({
      x, y,
      vx: rand(-2.8, 2.8),
      vy: rand(-3.8, 1.8),
      life: rand(30, 70),
      hue: rand(0, 360),
      r: rand(2, 4),
      a: 1
    });
  }
}

function drawGrid(t){
  const spacing = 46;
  ctx.save();
  ctx.globalAlpha = state.neon ? 0.18 : 0.10;
  ctx.lineWidth = 1;

  for(let y = (t*0.02)%spacing; y < H; y += spacing){
    ctx.strokeStyle = "rgba(56,246,255,0.20)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for(let x = (t*0.03)%spacing; x < W; x += spacing){
    ctx.strokeStyle = "rgba(168,85,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.restore();
}

function tick(t){
  ctx.clearRect(0,0,W,H);

  // soft vignette
  ctx.save();
  ctx.globalAlpha = 0.20;
  const g = ctx.createRadialGradient(W/2, H/2, 10, W/2, H/2, Math.max(W,H)*0.7);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);
  ctx.restore();

  drawGrid(t);

  // particles
  for(let i = bgParticles.length-1; i >= 0; i--){
    const p = bgParticles[i];
    p.life -= 1;
    p.vy += 0.06;
    p.x += p.vx;
    p.y += p.vy;
    p.a *= 0.97;

    ctx.globalAlpha = p.a;
    ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, 1)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if(p.life <= 0 || p.a < 0.03) bgParticles.splice(i,1);
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ====== Party Start / Burst / Neon Toggle / Reset ======
$("#btnStart").addEventListener("click", () => {
  spawnBgBurst(W*0.5, H*0.35, 140);
  addHappiness(18);
  spawnOrbs(10);
  addHearts(10);
  toast("Party started! ⚡");
  $("#footerText").textContent = "Party started. Click the cake!";
});

$("#btnBurst").addEventListener("click", (e) => {
  spawnBgBurst(rand(W*0.25, W*0.75), rand(H*0.20, H*0.60), 220);
  spawnOrbs(8);
  addHappiness(10);
  toast("BURST!!! ⚡");
});

$("#btnNeon").addEventListener("click", () => {
  state.neon = !state.neon;
  $("#btnNeon").setAttribute("aria-pressed", state.neon ? "true" : "false");
  $("#btnNeon").textContent = state.neon ? "🟣 Neon: On" : "⚪ Neon: Off";
  toast(state.neon ? "Neon on 🟣" : "Neon off ⚪");
});

$("#btnReset").addEventListener("click", () => {
  state.sparkles = 0;
  state.bites = 0;
  state.hearts = 0;
  state.happiness = 8;
  state.orbsCaught = 0;
  bgParticles.length = 0;

  resetCake();
  clearOrbs();
  clearHearts();

  $("#footerText").textContent = "Reset complete. Ready again.";
  $("#collectorMsg").textContent = "Catch 10 orbs for a mega burst ⚡";
  updateUI();
  toast("Reset ↺");
});

// ====== Messages Modal (ONLY allowed messages) ======
const modal = $("#modal");
const modalText = $("#modalText");

function openModal(){
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(){
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function setRandomMessage(){
  modalText.textContent = pick(MESSAGES);
}

$("#btnMessage").addEventListener("click", () => {
  setRandomMessage();
  openModal();
  spawnBgBurst(W*0.55, H*0.22, 90);
  addHappiness(6);
});

$("#btnClose").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if(e.target === modal) closeModal();
});

$("#btnAnother").addEventListener("click", () => {
  setRandomMessage();
  spawnBgBurst(W*0.55, H*0.25, 70);
  toast("💬");
});

$("#btnConfetti").addEventListener("click", () => {
  spawnBgBurst(W*0.5, H*0.35, 220);
  spawnOrbs(6);
  addHappiness(8);
  toast("⚡");
});

// ====== Cake Bites ======
const cake = $("#cake");
const crumbBox = $("#crumbBox");
const MAX_BITES = 15;

function sprinklePixels(n = 14){
  const rect = cake.getBoundingClientRect();
  for(let i=0;i<n;i++){
    const px = document.createElement("div");
    px.className = "pixel";
    const x = rect.left + rect.width/2 + rand(-34, 34);
    const y = rect.top + rect.height/2 + rand(-26, 26);

    // position relative to crumbBox
    const b = crumbBox.getBoundingClientRect();
    px.style.left = `${x - b.left}px`;
    px.style.top = `${y - b.top}px`;
    px.style.background = `hsla(${rand(0,360)}, 95%, 72%, 1)`;
    crumbBox.appendChild(px);

    const dx = rand(-44, 44);
    const dy = rand(18, 70);
    px.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.7)`, opacity: 0 }
      ],
      { duration: rand(420, 740), easing: "cubic-bezier(.2,.8,.2,1)" }
    ).onfinish = () => px.remove();
  }
}

function cakeScale(){
  const remaining = clamp(1 - (state.bites / MAX_BITES), 0.18, 1);
  const scale = 0.82 + remaining * 0.18;
  cake.style.transform = `translateY(6px) scale(${scale})`;
}

function biteCake(){
  if(state.bites >= MAX_BITES){
    toast("Refill? 🍰");
    return;
  }

  state.bites += 1;
  state.sparkles += 2;
  addHappiness(3);

  sprinklePixels(16);
  spawnBgBurst(rand(W*0.45, W*0.55), rand(H*0.40, H*0.55), 30);

  cake.animate(
    [
      { transform: cake.style.transform || "translateY(6px) scale(1)" },
      { transform: "translateY(4px) scale(1.03)" },
      { transform: cake.style.transform || "translateY(6px) scale(1)" }
    ],
    { duration: 210, easing: "ease-out" }
  );

  cakeScale();
  updateUI();

  if(state.bites === MAX_BITES){
    toast("Cake finished!!! ✨");
    spawnBgBurst(W*0.5, H*0.45, 120);
    addHappiness(16);
  } else {
    toast("nom 🍰");
  }
}

function resetCake(){
  state.bites = 0;
  cake.style.transform = "translateY(6px) scale(1)";
  updateUI();
}

cake.addEventListener("click", biteCake);
$("#btnRefill").addEventListener("click", () => {
  resetCake();
  toast("Refilled 🍰");
});

// ====== Magnet Hearts ======
const heartsArena = $("#heartsArena");
let mouse = { x: 0, y: 0 };
const heartEls = [];

function heartEmoji(){
  return Math.random() < 0.5 ? "💗" : "💖";
}

function createHeart(x = rand(40, heartsArena.clientWidth - 40), y = rand(40, heartsArena.clientHeight - 40)){
  const el = document.createElement("div");
  el.className = "heart";
  el.textContent = heartEmoji();

  const h = {
    el,
    x, y,
    vx: rand(-0.6, 0.6),
    vy: rand(-0.6, 0.6),
    wob: rand(0, Math.PI*2),
  };
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  el.addEventListener("click", () => {
    // pop into sparkles
    const r = el.getBoundingClientRect();
    spawnBgBurst(r.left + r.width/2, r.top + r.height/2, 70);
    state.sparkles += 5;
    state.hearts = Math.max(0, state.hearts - 1);
    addHappiness(5);
    updateUI();
    el.remove();
    const idx = heartEls.indexOf(h);
    if(idx >= 0) heartEls.splice(idx, 1);
    toast("💗");
  });

  heartsArena.appendChild(el);
  heartEls.push(h);

  state.hearts += 1;
  updateUI();
}

function addHearts(n = 6){
  for(let i=0;i<n;i++) createHeart();
}

function clearHearts(){
  heartEls.splice(0).forEach(h => h.el.remove());
  state.hearts = 0;
  updateUI();
}

heartsArena.addEventListener("pointermove", (e) => {
  const rect = heartsArena.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
heartsArena.addEventListener("click", (e) => {
  // avoid double when clicking heart itself
  if(e.target.classList.contains("heart")) return;
  createHeart(e.offsetX, e.offsetY);
  toast("Added 💗");
});

$("#btnHearts").addEventListener("click", () => {
  addHearts(6);
  toast("Hearts +");
});

// physics tick for hearts
function tickHearts(){
  const rect = heartsArena.getBoundingClientRect();
  const w = rect.width, h = rect.height;

  for(const Ht of heartEls){
    const dx = mouse.x - Ht.x;
    const dy = mouse.y - Ht.y;
    const d = Math.hypot(dx, dy) || 1;

    // magnet pull
    const pull = 0.020;
    Ht.vx += (dx / d) * pull;
    Ht.vy += (dy / d) * pull;

    // drift + damping
    Ht.wob += 0.06;
    Ht.vx += Math.sin(Ht.wob) * 0.002;
    Ht.vy += Math.cos(Ht.wob) * 0.002;

    Ht.vx *= 0.96;
    Ht.vy *= 0.96;

    Ht.x += Ht.vx;
    Ht.y += Ht.vy;

    // bounds
    Ht.x = clamp(Ht.x, 6, w - 18);
    Ht.y = clamp(Ht.y, 6, h - 18);

    Ht.el.style.transform = `translate(${Ht.x}px, ${Ht.y}px)`;
  }

  requestAnimationFrame(tickHearts);
}
requestAnimationFrame(tickHearts);

// initial hearts
addHearts(10);

// ====== Collector Orbs + Neon Trail ======
const collector = $("#collector");
const orbs = [];
let drawing = false;

function createOrb(){
  const el = document.createElement("div");
  el.className = "orb";
  const w = collector.clientWidth;
  const h = collector.clientHeight;
  const x = rand(16, w - 16);
  const y = rand(50, h - 16);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  collector.appendChild(el);

  orbs.push({ el, x, y, vx: rand(-0.35, 0.35), vy: rand(-0.35, 0.35) });
}

function spawnOrbs(n = 6){
  for(let i=0;i<n;i++) createOrb();
}

function clearOrbs(){
  orbs.splice(0).forEach(o => o.el.remove());
}

function addTrailDot(x, y){
  const d = document.createElement("div");
  d.className = "trail";
  d.style.left = `${x - 5}px`;
  d.style.top = `${y - 5}px`;
  collector.appendChild(d);
  d.animate(
    [
      { transform: "scale(1)", opacity: 0.85 },
      { transform: "scale(1.8)", opacity: 0 }
    ],
    { duration: 420, easing: "ease-out" }
  ).onfinish = () => d.remove();
}

collector.addEventListener("pointerdown", () => { drawing = true; });
window.addEventListener("pointerup", () => { drawing = false; });

collector.addEventListener("pointermove", (e) => {
  if(!drawing) return;
  const rect = collector.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  addTrailDot(x, y);

  // collision with orbs
  for(let i=orbs.length-1; i>=0; i--){
    const o = orbs[i];
    const ox = o.x, oy = o.y;
    const dist = Math.hypot(x - ox, y - oy);
    if(dist < 18){
      // caught!
      const br = o.el.getBoundingClientRect();
      spawnBgBurst(br.left + 7, br.top + 7, 60);
      state.sparkles += 8;
      state.orbsCaught += 1;
      addHappiness(4);
      updateUI();

      o.el.remove();
      orbs.splice(i, 1);

      if(state.orbsCaught % 10 === 0){
        $("#collectorMsg").textContent = "MEGA BURST UNLOCKED ⚡";
        spawnBgBurst(W*0.5, H*0.35, 260);
        spawnOrbs(10);
        addHappiness(18);
        toast("MEGA ⚡");
      }
    }
  }
});

function tickOrbs(){
  const w = collector.clientWidth;
  const h = collector.clientHeight;

  for(const o of orbs){
    o.x += o.vx;
    o.y += o.vy;

    if(o.x < 8 || o.x > w - 22) o.vx *= -1;
    if(o.y < 40 || o.y > h - 22) o.vy *= -1;

    o.x = clamp(o.x, 8, w - 22);
    o.y = clamp(o.y, 40, h - 22);

    o.el.style.transform = `translate(${o.x}px, ${o.y}px)`;
  }

  requestAnimationFrame(tickOrbs);
}
requestAnimationFrame(tickOrbs);

$("#btnSpawnOrbs").addEventListener("click", () => {
  spawnOrbs(8);
  toast("Orbs +");
});

// ====== Global click sparkle + footer updates ======
window.addEventListener("click", (e) => {
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
  if(["button"].includes(tag)) return;

  spawnBgBurst(e.clientX, e.clientY, 40);
  state.sparkles += 1;
  updateUI();
});

function boot(){
  updateUI();
  spawnOrbs(10);
  $("#footerText").textContent = "Click “Start Party” to go crazy ⚡";
  // tiny welcome sparkle
  setTimeout(() => spawnBgBurst(W*0.5, H*0.28, 120), 350);
}
boot();