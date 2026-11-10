/* =====================================================================
   Gemeinsame Helfer aller Lernwelten: Lernpfad, Quiz, Fortschritt.
   Der Fortschritt bleibt nur im eigenen Browser (localStorage), ohne Konto.
   ===================================================================== */
const Lern = (() => {
  const KEY = "bvb-lernen";
  // Empfohlene Reihenfolge für Einsteiger: [id, Titel, Pfad]
  const PATH = [
    ["inflation", "Geld & Inflation", "inflation/"],
    ["halving", "Knappheit & Halving", "halving/"],
    ["blockchain", "Blockchain", "blockchain/"],
    ["bahnhof", "Mempool-Bahnhof", "bahnhof/"],
    ["seed", "Seed-Trainer", "seed/"],
    ["betrug", "Betrug erkennen", "betrug/"],
    ["sparplan", "Sparplan", "sparplan/"],
    ["lightning", "Lightning", "lightning/"],
    ["mining", "Mining-Werkstatt", "mining/"], ["nodes", "Node-Wache", "nodes/"], ["schluessel", "Schlüssel-Labor", "schluessel/"], ["utxo", "Wechselgeld-Kasse", "utxo/"], ["wallets", "Wallet-Check", "wallets/"], ["erben", "Notfall-Plan", "erben/"],
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
      const right = Object.values(answered).filter(Boolean).length, s = load();
      s[id] = Object.assign({}, s[id], {quiz: Math.max(right, (s[id] && s[id].quiz) || 0), total: QUIZ.length}); save(s);
      res.hidden = false; res.textContent = `${right} von ${QUIZ.length} richtig. ✓ Diese Welt ist in deinem Lernpfad abgehakt.`;
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

  return {PATH, load, done, visit, quiz, renderNext, nextAfter, sha256};
})();
