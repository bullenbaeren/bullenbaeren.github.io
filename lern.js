/* =====================================================================
   Gemeinsame Helfer aller Lernwelten: Lernpfad, Quiz, Fortschritt.
   Der Fortschritt bleibt nur im eigenen Browser (localStorage), ohne Konto.
   ===================================================================== */
const Lern = (() => {
  const KEY = "bvb-lernen";
  // Empfohlene Reihenfolge für Einsteiger: [id, Titel, Pfad]
  const PATH = [
    ["eigenschaften", "Geld-Duell", "eigenschaften/"],
    ["inflation", "Geld & Inflation", "inflation/"],
    ["halving", "Knappheit & Halving", "halving/"],
    ["hashing", "Fingerabdruck-Maschine", "hashing/"], ["blockchain", "Blockchain", "blockchain/"],
    ["bahnhof", "Mempool-Bahnhof", "bahnhof/"],
    ["seed", "Seed-Trainer", "seed/"],
    ["betrug", "Betrug erkennen", "betrug/"],
    ["sparplan", "Sparplan", "sparplan/"],
    ["lightning", "Lightning", "lightning/"],
    ["mining", "Mining-Werkstatt", "mining/"], ["nodes", "Node-Wache", "nodes/"], ["schluessel", "Schlüssel-Labor", "schluessel/"], ["utxo", "Wechselgeld-Kasse", "utxo/"], ["wallets", "Wallet-Check", "wallets/"], ["fomo", "Gefühls-Achterbahn", "fomo/"], ["hebel", "Hebel-Falle", "hebel/"], ["geschichte", "Zeitreise", "geschichte/"], ["krypto", "Coin-Check", "krypto/"],
  ];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; } };
  const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} };
  const done = (s, id) => !!(s[id] && s[id].quiz);
  // Seite als besucht merken
  function visit(id){ const s = load(); s[id] = Object.assign({}, s[id], {seen: Date.now()}); save(s); }
  // Nächste empfohlene Welt (erste noch nicht abgeschlossene, außer der aktuellen)
  function nextAfter(id){ const s = load(); return PATH.find(([pid]) => pid !== id && !done(s, pid)) || null; }
  // Quiz bauen: QUIZ = [[Frage, [Antworten], Index richtig, Erklärung], ...]
  function quiz(box, id, QUIZ, root){
    const answered = {};
    QUIZ.forEach(([q, opts, ok, why], qi) => {
      const d = document.createElement("div"); d.className = "q";
      d.innerHTML = `<p>${qi + 1}. ${q}</p><div class="opts">${opts.map((o, i) => `<button type="button" data-i="${i}">${o}</button>`).join("")}</div><p class="why" hidden></p>`;
      d.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
        const i = +b.dataset.i;
        d.querySelectorAll("button").forEach(x => { x.classList.remove("ok", "no"); if (+x.dataset.i === ok) x.classList.add("ok"); });
        if (i !== ok) b.classList.add("no");
        const w = d.querySelector(".why"); w.hidden = false; w.textContent = (i === ok ? "Richtig! " : "Nicht ganz. ") + why;
        if (!(qi in answered)) answered[qi] = i === ok;
        if (Object.keys(answered).length === QUIZ.length) finish();
      }));
      box.appendChild(d);
    });
    const res = document.createElement("p"); res.className = "res"; res.hidden = true; box.appendChild(res);
    function finish(){
      const right = Object.values(answered).filter(Boolean).length, s = load(), before = level(count(s)), first = !done(s, id);
      s[id] = Object.assign({}, s[id], {quiz: Math.max(right, (s[id] && s[id].quiz) || 0), total: QUIZ.length}); save(s);
      const after = level(count(s));
      res.hidden = false; res.textContent = `${"⭐".repeat(right)}${"☆".repeat(QUIZ.length - right)}  ${right} von ${QUIZ.length} richtig. ✓ Diese Welt ist in deinem Lernpfad abgehakt.`;
      if (right === QUIZ.length) confetti();
      if (after.name !== before.name) toast(`${after.ico} Level-Up! Du bist jetzt <b>${after.name}</b>.`);
      else if (first) toast(`✓ Welt geschafft · ${after.n} von ${PATH.length}`);
      badge();
      renderNext(id, root);
    }
  }
  // "Weiter mit …"-Karte am Seitenende
  function renderNext(id, root = ""){
    const el = document.getElementById("next"); if (!el) return;
    const n = nextAfter(id);
    el.innerHTML = n ? `<span class="muted">Empfohlen als Nächstes</span><b>${n[1]}</b><a href="${root}${n[2]}">Los geht's →</a>`
                     : `<b>Stark, alle bisherigen Welten geschafft!</b><a href="${root}">Zur Übersicht →</a>`;
  }

  // ---------- Spaß-Schicht: Level, Konfetti, Einblenden ----------
  const ICON = {eigenschaften: "⚔️", inflation: "🛒", halving: "⏳", hashing: "🧬", blockchain: "🔗", bahnhof: "🚉", seed: "🔑", betrug: "🕵️", sparplan: "🐷", lightning: "⚡", mining: "⛏", nodes: "🖥", schluessel: "🔐", utxo: "👛", wallets: "🗄", fomo: "🎢", hebel: "💥", geschichte: "📜", krypto: "🟠"};
  // Sats-Level nach geschafften Welten (angelehnt an die Bitcoin-Tierwelt von Garnele bis Wal)
  const LEVELS = [[0, "🦠", "Plankton"], [1, "🦐", "Garnele"], [3, "🦀", "Krabbe"], [6, "🐟", "Fisch"], [9, "🐬", "Delfin"], [12, "🦈", "Hai"], [15, "🐳", "Buckelwal"], [19, "🐋", "Wal"]];
  const count = s => PATH.filter(([id]) => done(s, id)).length;
  function level(n){ let L = LEVELS[0]; for (const l of LEVELS) if (n >= l[0]) L = l; return {n, ico: L[1], name: L[2]}; }
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function confetti(){
    if (calm) return;
    const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
    const x = c.getContext("2d"), W = c.width = innerWidth, H = c.height = innerHeight, C = ["#f7931a", "#ffc94d", "#34d982", "#7cc4ff", "#ff5c73"];
    const P = Array.from({length: 130}, () => ({x: W/2, y: H*.4, vx: (Math.random() - .5)*16, vy: -Math.random()*13 - 4, r: Math.random()*6 + 4, c: C[Math.random()*5 | 0], a: Math.random()*6, b: Math.random() < .25}));
    let t = 0;
    (function f(){ x.clearRect(0, 0, W, H);
      P.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += .15; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c;
        if (p.b){ x.font = `bold ${p.r*3}px sans-serif`; x.fillText("₿", 0, 0); } else x.fillRect(-p.r/2, -p.r/3, p.r, p.r*.6); x.restore(); });
      if (++t < 160) requestAnimationFrame(f); else c.remove(); })();
  }
  function toast(html){ const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html; document.body.appendChild(t); setTimeout(() => t.classList.add("out"), 3400); setTimeout(() => t.remove(), 3900); }
  // Level-Anzeige im Kopf jeder Seite
  function badge(){
    const L = level(count(load())), el = document.querySelector(".lvl") || document.createElement("a");
    el.className = "lvl"; el.href = here ? "../" : "#steps"; el.title = "Dein Sats-Level: mehr Welten schaffen, um aufzusteigen";
    el.innerHTML = `<span class="li">${L.ico}</span><span><b>${L.name}</b><small>${L.n} von ${PATH.length} Welten</small></span><i><u style="width:${L.n/PATH.length*100}%"></u></i>`;
    if (!el.parentNode){ const top = document.querySelector(".top"), back = document.querySelector(".wrap > .back");
      if (top) top.insertBefore(el, top.children[1] || null); else if (back) back.after(el); }
  }
  // Welten erscheinen beim Scrollen
  function reveal(){
    if (calm || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }), {rootMargin: "0px 0px -6% 0px"});
    document.querySelectorAll(".wrap > .card, .learn > div, a.w").forEach((el, i) => { el.classList.add("rv"); el.style.setProperty("--d", (i % 4)*70 + "ms"); io.observe(el); });
    setTimeout(() => document.querySelectorAll(".rv").forEach(el => el.classList.add("in")), 5000);   // Sicherheitsnetz
  }
  const seg = location.pathname.split("/").filter(Boolean), here = PATH.some(([id]) => id === seg[seg.length - 1]) ? seg[seg.length - 1] : "";
  function init(){
    badge(); reveal();
    if (here && ICON[here]){ const h = document.querySelector("h1"); if (h && !h.previousElementSibling){ const i = document.createElement("span"); i.className = "wico"; i.setAttribute("aria-hidden", "true"); i.textContent = ICON[here]; h.before(i); } }
  }

  // SHA-256, synchron (für Blockchain und Mining: schnell genug für viele Versuche pro Bild)
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const enc = new TextEncoder(), W = new Uint32Array(64);
  function sha256(str){
    const msg = enc.encode(str), len = msg.length, n = ((len + 9 + 63) >> 6) << 6, buf = new Uint8Array(n);
    buf.set(msg); buf[len] = 0x80; const bits = len*8; buf[n - 4] = bits >>> 24; buf[n - 3] = bits >>> 16; buf[n - 2] = bits >>> 8; buf[n - 1] = bits;
    let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
    for (let o = 0; o < n; o += 64){
      for (let i = 0; i < 16; i++) W[i] = (buf[o+4*i] << 24) | (buf[o+4*i+1] << 16) | (buf[o+4*i+2] << 8) | buf[o+4*i+3];
      for (let i = 16; i < 64; i++){ const a = W[i-15], b = W[i-2]; const s0 = ((a>>>7)|(a<<25)) ^ ((a>>>18)|(a<<14)) ^ (a>>>3), s1 = ((b>>>17)|(b<<15)) ^ ((b>>>19)|(b<<13)) ^ (b>>>10); W[i] = (W[i-16] + s0 + W[i-7] + s1) | 0; }
      let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
      for (let i = 0; i < 64; i++){
        const S1 = ((e>>>6)|(e<<26)) ^ ((e>>>11)|(e<<21)) ^ ((e>>>25)|(e<<7)), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + W[i]) | 0;
        const S0 = ((a>>>2)|(a<<30)) ^ ((a>>>13)|(a<<19)) ^ ((a>>>22)|(a<<10)), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0; h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
    }
    return [h0,h1,h2,h3,h4,h5,h6,h7].map(v => (v >>> 0).toString(16).padStart(8, "0")).join("");
  }

  init();
  return {PATH, LEVELS, level, count, load, done, visit, quiz, renderNext, nextAfter, sha256, confetti, toast};
})();
