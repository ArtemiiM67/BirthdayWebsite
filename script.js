// ===== Messages (simple + emojis) =====
const MESSAGES = [
  "I love you :) 💛",
  "You're the best mom in the world! 💖",
  "Happy Birthday! 💕🎂",
  "You make every day better ☀️",
  "Thank you for everything 🌷",
  "You deserve the happiest day ever 🎉",
  "Love you forever and always 💚",
  "Big hug for you 🤗",
  "You’re amazing mom 💕"
];

// ===== Helpers =====
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

// ===== State =====
const state = {
  sparkles: 0,
  bites: 0,
  hearts: 0,
  sunOn: true,
  joy: 8,          // %
  orbsCaught: 0
};

function updateUI(){
  $("#sparklesCount").textContent = state.sparkles;
  $("#bitesCount").textContent = state.bites;
  $("#heartsCount").textContent = state.hearts;

  $("#bites").textContent = state.bites;
  $("#hearts").textContent = state.hearts;

  $("#meterFill").style.width = `${clamp(state.joy, 0, 100)}%`;
}

function addJoy(n){
  state.joy = clamp(state.joy + n, 0, 100);
  updateUI();
}

// ===== Background canvas (soft floating petals + sparkle dots) =====
const canvas = $("#bg");
const ctx = canvas.getContext("2d", { alpha: true });

let W = 0, H = 0;
let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

const petals = [];
const spark = [];

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

function spawnPetals(n = 18){
  for(let i=0;i<n;i++){
    petals.push({
      x: rand(0, W),
      y: rand(-H*0.2, H),
      r: rand(2.5, 5.0),
      vy: rand(0.25, 0.7),
      vx: rand(-0.15, 0.15),
      w: rand(0, Math.PI*2),
      a: rand(0.12, 0.22)
    });
  }
}
spawnPetals(26);

function burstSparkles(x, y, n = 90){
  for(let i=0;i<n;i++){
    spark.push({
      x, y,
      vx: rand(-2.6, 2.6),
      vy: rand(-3.6, 2.0),
      g: 0.06,
      r: rand(2, 4),
      a: 1,
      life: rand(35, 80),
      hue: rand(40, 190)
    });
  }
}

function tickBg(){
  ctx.clearRect(0,0,W,H);

  // subtle sun wash
  if(state.sunOn){
    const g = ctx.createRadialGradient(W*0.15, H*0.12, 20, W*0.15, H*0.12, Math.max(W,H)*0.6);
    g.addColorStop(0, "rgba(255,240,170,0.35)");
    g.addColorStop(1, "rgba(255,240,170,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
  }

  // petals
  for(const p of petals){
    p.w += 0.02;
    p.x += p.vx + Math.sin(p.w)*0.12;
    p.y += p.vy;

    if(p.y > H + 20){
      p.y = -20;
      p.x = rand(0, W);
    }
    if(p.x < -30) p.x = W + 30;
    if(p.x > W + 30) p.x = -30;

    ctx.globalAlpha = p.a;
    ctx.fillStyle = "rgba(47,122,74,1)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r*1.4, p.r, p.w, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // sparkle particles
  for(let i = spark.length - 1; i >= 0; i--){
    const s = spark[i];
    s.life -= 1;
    s.vy += s.g;
    s.x += s.vx;
    s.y += s.vy;
    s.a *= 0.975;

    ctx.globalAlpha = s.a;
    ctx.fillStyle = `hsla(${s.hue}, 80%, 55%, 1)`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if(s.life <= 0 || s.a < 0.03) spark.splice(i, 1);
  }

  requestAnimationFrame(tickBg);
}
requestAnimationFrame(tickBg);

// ===== Buttons: Start / Burst / Sun toggle / Reset =====
$("#btnStart").addEventListener("click", () => {
  burstSparkles(W*0.5, H*0.32, 160);
  spawnOrbs(10);
  addHearts(10);
  addJoy(18);
  toast("Party started 🌿🎉");
  $("#footerText").textContent = "Party started! Eat cake + collect sparkles ✨";
});

$("#btnBurst").addEventListener("click", () => {
  burstSparkles(rand(W*0.25, W*0.75), rand(H*0.20, H*0.60), 240);
  spawnOrbs(8);
  addJoy(10);
  toast("Burst!!! 🎉");
});

$("#btnSun").addEventListener("click", () => {
  state.sunOn = !state.sunOn;
  $("#btnSun").setAttribute("aria-pressed", state.sunOn ? "true" : "false");
  $("#btnSun").textContent = state.sunOn ? "☀️ Sun: On" : "🌥️ Sun: Off";
  toast(state.sunOn ? "Sunlight on ☀️" : "Sunlight off 🌥️");
});

$("#btnReset").addEventListener("click", () => {
  state.sparkles = 0;
  state.bites = 0;
  state.hearts = 0;
  state.joy = 8;
  state.orbsCaught = 0;

  spark.length = 0;

  resetCake();
  clearOrbs();
  clearHearts();

  $("#collectorMsg").textContent = "Collect 10 orbs for a mega burst 🎉";
  $("#footerText").textContent = "Reset complete 🌿";
  updateUI();
  toast("Reset ↺");
});

// ===== Modal Messages =====
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
  burstSparkles(W*0.55, H*0.22, 70);
  addJoy(6);
});

$("#btnClose").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if(e.target === modal) closeModal(); });

$("#btnAnother").addEventListener("click", () => {
  setRandomMessage();
  burstSparkles(W*0.55, H*0.25, 55);
  toast("💬");
});

$("#btnConfetti").addEventListener("click", () => {
  burstSparkles(W*0.5, H*0.35, 220);
  spawnOrbs(6);
  addJoy(8);
  toast("🎉");
});

// ===== Cake =====
const cake = $("#cake");
const cakeStage = $("#cakeStage");
const sprinkleBox = $("#sprinkleBox");
const MAX_BITES = 15;

function sprinkle(n = 16){
  const stageRect = cakeStage.getBoundingClientRect();
  const cakeRect = cake.getBoundingClientRect();

  for(let i=0;i<n;i++){
    const sp = document.createElement("div");
    sp.className = "sprinkle";

    // spawn around cake center, relative to stage
    const cx = (cakeRect.left + cakeRect.width/2) - stageRect.left;
    const cy = (cakeRect.top + cakeRect.height/2) - stageRect.top;

    sp.style.left = `${cx + rand(-34, 34)}px`;
    sp.style.top  = `${cy + rand(-26, 26)}px`;
    sp.style.background = `hsla(${rand(40,190)}, 70%, 55%, 1)`;

    sprinkleBox.appendChild(sp);

    const dx = rand(-60, 60);
    const dy = rand(22, 90);
    sp.animate(
      [
        { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rand(-120,120)}deg) scale(0.7)`, opacity: 0 }
      ],
      { duration: rand(420, 760), easing: "cubic-bezier(.2,.8,.2,1)" }
    ).onfinish = () => sp.remove();
  }
}

function cakeScale(){
  const remaining = clamp(1 - (state.bites / MAX_BITES), 0.18, 1);
  const scale = 0.82 + remaining * 0.18;
  cake.style.transform = `translateY(6px) scale(${scale})`;
}

function biteCake(){
  if(state.bites >= MAX_BITES){
    toast("Refill? 🎂");
    return;
  }

  state.bites += 1;
  state.sparkles += 2;
  addJoy(3);

  sprinkle(18);

  const cakeRect = cake.getBoundingClientRect();
  burstSparkles(cakeRect.left + cakeRect.width/2, cakeRect.top + cakeRect.height/2, 28);

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
    toast("Cake finished!!! 🎉");
    burstSparkles(W*0.5, H*0.45, 140);
    addJoy(16);
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
  toast("Refilled 🎂");
});

// ===== Heart Garden (fixed positioning) =====
const heartsArena = $("#heartsArena");
let mouse = { x: 0, y: 0 };
const hearts = [];

function heartEmoji(){
  const opts = ["💖","💗","💞","💕"];
  return opts[Math.floor(Math.random()*opts.length)];
}

function createHeart(x, y){
  const el = document.createElement("div");
  el.className = "heart";
  el.textContent = heartEmoji();

  const w = heartsArena.clientWidth;
  const h = heartsArena.clientHeight;

  const obj = {
    el,
    x: clamp(x ?? rand(20, w-20), 6, w-26),
    y: clamp(y ?? rand(50, h-20), 6, h-26),
    vx: rand(-0.5, 0.5),
    vy: rand(-0.5, 0.5),
    wob: rand(0, Math.PI*2)
  };

  el.style.left = `${obj.x}px`;
  el.style.top  = `${obj.y}px`;

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    const r = el.getBoundingClientRect();
    burstSparkles(r.left + r.width/2, r.top + r.height/2, 70);
    state.sparkles += 5;
    state.hearts = Math.max(0, state.hearts - 1);
    addJoy(5);
    updateUI();
    el.remove();
    const idx = hearts.indexOf(obj);
    if(idx >= 0) hearts.splice(idx, 1);
    toast("💖");
  });

  heartsArena.appendChild(el);
  hearts.push(obj);

  state.hearts += 1;
  updateUI();
}

function addHearts(n = 6){
  for(let i=0;i<n;i++) createHeart();
}

function clearHearts(){
  while(hearts.length) hearts.pop().el.remove();
  state.hearts = 0;
  updateUI();
}

heartsArena.addEventListener("pointermove", (e) => {
  const rect = heartsArena.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

heartsArena.addEventListener("click", (e) => {
  // click empty area adds a heart at click
  createHeart(e.offsetX, e.offsetY);
  toast("Added 💖");
});

$("#btnHearts").addEventListener("click", () => {
  addHearts(6);
  toast("Hearts +");
});

function tickHearts(){
  const w = heartsArena.clientWidth;
  const h = heartsArena.clientHeight;

  for(const ht of hearts){
    const dx = mouse.x - ht.x;
    const dy = mouse.y - ht.y;
    const d = Math.hypot(dx, dy) || 1;

    // magnet pull
    const pull = 0.018;
    ht.vx += (dx / d) * pull;
    ht.vy += (dy / d) * pull;

    // gentle wobble
    ht.wob += 0.06;
    ht.vx += Math.sin(ht.wob) * 0.002;
    ht.vy += Math.cos(ht.wob) * 0.002;

    // damping
    ht.vx *= 0.96;
    ht.vy *= 0.96;

    ht.x += ht.vx;
    ht.y += ht.vy;

    // bounds
    ht.x = clamp(ht.x, 6, w - 26);
    ht.y = clamp(ht.y, 40, h - 26);

    ht.el.style.left = `${ht.x}px`;
    ht.el.style.top  = `${ht.y}px`;
  }

  requestAnimationFrame(tickHearts);
}
requestAnimationFrame(tickHearts);

// initial hearts
addHearts(10);

// ===== Sparkle Collector (fixed positioning + collisions) =====
const collector = $("#collector");
const orbs = [];
let drawing = false;

function createOrb(){
  const el = document.createElement("div");
  el.className = "orb";

  const w = collector.clientWidth;
  const h = collector.clientHeight;

  const obj = {
    el,
    x: rand(16, w - 30),
    y: rand(56, h - 30),
    vx: rand(-0.45, 0.45),
    vy: rand(-0.45, 0.45)
  };

  el.style.left = `${obj.x}px`;
  el.style.top  = `${obj.y}px`;

  collector.appendChild(el);
  orbs.push(obj);
}

function spawnOrbs(n = 6){
  for(let i=0;i<n;i++) createOrb();
}

function clearOrbs(){
  while(orbs.length) orbs.pop().el.remove();
}

function addTrailDot(x, y){
  const d = document.createElement("div");
  d.className = "trail";
  d.style.left = `${x - 5}px`;
  d.style.top  = `${y - 5}px`;
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

  // collision with orbs (use orb center)
  for(let i=orbs.length-1; i>=0; i--){
    const o = orbs[i];
    const ox = o.x + 7;
    const oy = o.y + 7;
    const dist = Math.hypot(x - ox, y - oy);

    if(dist < 18){
      // caught!
      const br = o.el.getBoundingClientRect();
      burstSparkles(br.left + 7, br.top + 7, 70);

      state.sparkles += 8;
      state.orbsCaught += 1;
      addJoy(4);
      updateUI();

      o.el.remove();
      orbs.splice(i, 1);

      if(state.orbsCaught % 10 === 0){
        $("#collectorMsg").textContent = "MEGA BURST UNLOCKED 🎉";
        burstSparkles(W*0.5, H*0.35, 260);
        spawnOrbs(10);
        addJoy(18);
        toast("MEGA 🎉");
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
    if(o.y < 48 || o.y > h - 22) o.vy *= -1;

    o.x = clamp(o.x, 8, w - 22);
    o.y = clamp(o.y, 48, h - 22);

    o.el.style.left = `${o.x}px`;
    o.el.style.top  = `${o.y}px`;
  }

  requestAnimationFrame(tickOrbs);
}
requestAnimationFrame(tickOrbs);

$("#btnSpawnOrbs").addEventListener("click", () => {
  spawnOrbs(8);
  toast("Orbs + ✨");
});

// ===== Global click sparkle =====
window.addEventListener("click", (e) => {
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
  if(tag === "button") return;

  burstSparkles(e.clientX, e.clientY, 50);
  state.sparkles += 1;
  updateUI();
});

// ===== Boot =====
function boot(){
  updateUI();
  spawnOrbs(10);
  $("#footerText").textContent = "Click “Start Party” 🌿";
  setTimeout(() => burstSparkles(W*0.5, H*0.26, 120), 350);
}
boot();