/* =====================================================================
   Gemeinsame Helfer aller Lernwelten: Lernpfad, Quiz, Fortschritt.
   Der Fortschritt bleibt nur im eigenen Browser (localStorage), ohne Konto.
   ===================================================================== */
const Lern = (() => {
  const KEY = "bvb-lernen";
  // Empfohlene Reihenfolge für Einsteiger: [id, Titel, Pfad]
  // Kapitel für Einsteiger: [Symbol, Titel, Kurzbeschreibung, Welten in Reihenfolge]
  const CHAPTERS = [
    ["🌱", "Warum Bitcoin?", "Was gutes Geld ausmacht und warum Bitcoin anders ist.", ["eigenschaften", "inflation", "halving", "geschichte"]],
    ["🛡️", "Sicher starten", "Bevor du Bitcoin kaufst: Wallet, Seed und Betrug.", ["wallets", "seed", "betrug", "krypto"]],
    ["🧠", "Klug investieren", "Sparplan statt Bauchgefühl, und Finger weg vom Hebel.", ["sparplan", "fomo", "hebel"]],
    ["💸", "Bezahlen & Senden", "Wie eine Zahlung wirklich abläuft, schnell und günstig.", ["utxo", "bahnhof", "lightning"]],
    ["⚙️", "Unter der Haube", "Für Neugierige: die Technik hinter Bitcoin.", ["hashing", "schluessel", "blockchain", "mining", "nodes"]]
  ];
  // Lernpfad = alle Welten in Kapitel-Reihenfolge: [id, Titel, Pfad]
  const TITLES = {eigenschaften: ["Geld-Duell", "eigenschaften/"], inflation: ["Geld & Inflation", "inflation/"], halving: ["Knappheit & Halving", "halving/"], geschichte: ["Zeitreise", "geschichte/"], wallets: ["Wallet-Check", "wallets/"], seed: ["Seed-Trainer", "seed/"], betrug: ["Betrug erkennen", "betrug/"], krypto: ["Coin-Check", "krypto/"], sparplan: ["Sparplan", "sparplan/"], fomo: ["Gefühls-Achterbahn", "fomo/"], hebel: ["Hebel-Falle", "hebel/"], utxo: ["Wechselgeld-Kasse", "utxo/"], bahnhof: ["Mempool-Bahnhof", "bahnhof/"], lightning: ["Lightning", "lightning/"], hashing: ["Fingerabdruck-Maschine", "hashing/"], schluessel: ["Schlüssel-Labor", "schluessel/"], blockchain: ["Blockchain", "blockchain/"], mining: ["Mining-Werkstatt", "mining/"], nodes: ["Node-Wache", "nodes/"]};
  const PATH = CHAPTERS.flatMap(c => c[3].map(id => [id, ...TITLES[id]]));
  const chapterOf = id => CHAPTERS.findIndex(c => c[3].includes(id));
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
      // Antworten in zufälliger Reihenfolge, damit die richtige nicht immer an derselben Stelle steht
      const d = document.createElement("div"); d.className = "q";
      d.innerHTML = `<p>${qi + 1}. ${q}</p><div class="opts">${opts.map((o, i) => [Math.random(), i, o]).sort((a, b) => a[0] - b[0]).map(([, i, o]) => `<button type="button" data-i="${i}">${o}</button>`).join("")}</div><p class="why" hidden></p>`;
      d.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
        const i = +b.dataset.i;
        d.querySelectorAll("button").forEach(x => { x.classList.remove("ok", "no"); if (+x.dataset.i === ok) x.classList.add("ok"); });
        if (i !== ok) b.classList.add("no");
        const w = d.querySelector(".why"); w.hidden = false; w.textContent = (i === ok ? "Richtig! " : "Nicht ganz. ") + why;
        if (!(qi in answered)){ answered[qi] = i === ok; say(i === ok ? pickOne(PRAISE) : pickOne(OOPS), 3500); }
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
      if (right === QUIZ.length) say("Alle Fragen richtig! ✨");
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


  // ---------- Comic-Zeichnungen (gemeinsam für Szenen, Karten und Satoshi) ----------
  // Comic-Zeichnungen im Satsland-Stil: dicke dunkle Kontur, flache Farben, Glanzpunkt. viewBox 0 0 100 100
  const SK = 'stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const hl = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".45"/>`;
  const coinP = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffc94d" ${SK}/><circle cx="${cx}" cy="${cy}" r="${r*.72}" fill="none" stroke="#e0a000" stroke-width="3"/><text x="${cx}" y="${cy + r*.36}" font-size="${r}" font-weight="900" text-anchor="middle" fill="#b86e00" font-family="Arial">₿</text>${hl(cx - r*.35, cy - r*.45, r*.3, r*.14)}`;
  const ART = {
    plankton: `<path d="M50 18c18 0 30 14 30 32S68 84 50 84 20 70 20 50s12-32 30-32z" fill="#7ad890" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="36" cy="40" r="4" fill="#34d982"/><circle cx="62" cy="64" r="5" fill="#34d982"/><circle cx="58" cy="34" r="3" fill="#34d982"/><circle cx="44" cy="52" r="6" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="45" cy="52" r="2.7" fill="#0d1230"/><circle cx="58" cy="50" r="5" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="59" cy="50" r="2.25" fill="#0d1230"/><path d="M20 50l-10-4M80 50l10-4M50 18l2-10M50 84l-2 10" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`,
    shrimp: `<path d="M78 30c-4 32-26 52-52 46-8-2-10-10-4-14 18 4 34-6 38-30z" fill="#ff9a6a" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M60 40l8 4M52 52l8 6M42 62l6 8" stroke="#c9374f" stroke-width="3" stroke-linecap="round"/><path d="M76 30q4-18 18-22M74 30q-6-16 2-26" fill="none" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="72" cy="30" r="5" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="73" cy="30" r="2.25" fill="#0d1230"/><path d="M22 66l-12 4 4 10" fill="#ff9a6a" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`,
    crab: `<ellipse cx="50" cy="58" rx="30" ry="20" fill="#ff5c73" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M24 52q-14-10-10-26 12 2 14 14M76 52q14-10 10-26-12 2-14 14" fill="#ff5c73" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 26l8 4M86 26l-8 4" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="40" cy="40" r="6" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="41" cy="40" r="2.7" fill="#0d1230"/><circle cx="60" cy="40" r="6" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="61" cy="40" r="2.7" fill="#0d1230"/><path d="M30 74l-8 10M42 78l-4 10M58 78l4 10M70 74l8 10" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 60q8 6 16 0" fill="none" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="40" cy="50" rx="8" ry="3" fill="#fff" opacity=".45"/>`,
    fish: `<path d="M20 50c12-22 40-26 58-6-18 22-46 20-58 6z" fill="#7cc4ff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M78 44l16-14v38l-16-14z" fill="#5aa0e8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M40 34q10 16 0 32" fill="none" stroke="#2f6fd6" stroke-width="3"/><circle cx="30" cy="46" r="5" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="31" cy="46" r="2.25" fill="#0d1230"/><ellipse cx="50" cy="38" rx="10" ry="3" fill="#fff" opacity=".45"/>`,
    dolphin: `<path d="M12 60c10-26 44-40 74-22 6 4 6 10 0 12-24 10-50 14-74 10z" fill="#8fb4d8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M50 36l8-18 8 20z" fill="#8fb4d8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M80 48l14 6-4-14z" fill="#8fb4d8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 60l-6 4 8 2" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="28" cy="52" r="4" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="29" cy="52" r="1.8" fill="#0d1230"/><path d="M20 60q10 4 22 0" fill="none" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="50" cy="44" rx="12" ry="3" fill="#fff" opacity=".45"/>`,
    shark: `<path d="M8 58c16-24 52-30 82-10-26 22-62 24-82 10z" fill="#9aa2b8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M46 38l6-26 14 30z" fill="#9aa2b8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M88 48l8-16v34z" fill="#9aa2b8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 58l22 2-4 6-4-5-4 6-4-6-4 5z" fill="#fff" stroke="#0d1230" stroke-width="2.5" stroke-linejoin="round"/><circle cx="30" cy="48" r="4" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="31" cy="48" r="1.8" fill="#0d1230"/><path d="M50 52l2 8M58 50l2 8M66 50l2 8" stroke="#0d1230" stroke-width="2.5"/>`,
    humpback: `<path d="M8 58c6-24 46-36 78-16 8 6 6 22-6 26-30 8-56 6-72-10z" fill="#3a5a9a" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 62c20 10 46 12 70 4" fill="none" stroke="#dbe6ff" stroke-width="3"/><path d="M84 46l12-14 0 26z" fill="#3a5a9a" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M40 66l-6 16 16-10z" fill="#3a5a9a" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="24" cy="52" r="4" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="25" cy="52" r="1.8" fill="#0d1230"/><circle cx="44" cy="44" r="3" fill="#5a7ac0"/><circle cx="56" cy="40" r="3" fill="#5a7ac0"/>`,
    whale: `<path d="M8 60c0-24 30-40 62-30 18 6 24 20 18 30-10 16-60 20-80 0z" fill="#2f6fd6" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M82 46l14-12v28z" fill="#2f6fd6" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 66c18 8 50 10 70-2" fill="none" stroke="#bfe0ff" stroke-width="3"/><circle cx="26" cy="52" r="5" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="27" cy="52" r="2.25" fill="#0d1230"/><path d="M36 26q-4-14 4-20M36 26q6-12 16-12" fill="none" stroke="#7cc4ff" stroke-width="5" stroke-linecap="round"/><circle cx="56" cy="50" r="10" fill="#ffc94d" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><text x="56" y="55" font-size="13" font-weight="900" text-anchor="middle" fill="#b86e00" font-family="Arial">₿</text><ellipse cx="40" cy="38" rx="12" ry="3" fill="#fff" opacity=".45"/>`,
    printer: `<path d="M14 34h72v40H14z" fill="#c0c0cc" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M24 14h52v22H24z" fill="#f2f4ff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M24 74h52v18H24z" fill="#9ee6a8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><text x="50" y="88" font-size="12" font-weight="900" text-anchor="middle" fill="#0d1230" font-family="Arial">€€€</text><circle cx="34" cy="52" r="7" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="35" cy="52" r="3.15" fill="#0d1230"/><circle cx="66" cy="52" r="7" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="67" cy="52" r="3.15" fill="#0d1230"/><path d="M26 42l14 4M74 42l-14 4" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M40 64q10-6 20 0" fill="none" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`,
    phisher: `<path d="M20 96c0-24 14-36 30-36s30 12 30 36z" fill="#3a3f5c" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="50" cy="40" r="22" fill="#ffd0a0" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M26 34h48v10H26z" fill="#0d1230"/><ellipse cx="41" cy="39" rx="5" ry="3" fill="#fff"/><ellipse cx="59" cy="39" rx="5" ry="3" fill="#fff"/><path d="M40 52q10 6 20-2" fill="none" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M28 22q22-14 44 0v6H28z" fill="#0d1230" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M80 66V18l10-6" fill="none" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/><path d="M90 12v20q0 6-6 6-5 0-5-5" fill="none" stroke="#c0c0cc" stroke-width="3"/>`,
    fomo: `<path d="M14 88c-6-30 4-66 36-70s46 30 38 70c-6-6-10-6-14 0-4-6-10-6-14 0-4-6-10-6-14 0-4-6-10-6-14 0-4-6-12-6-18 0z" fill="#b26bff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="36" cy="44" r="10" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="37" cy="44" r="4.5" fill="#0d1230"/><circle cx="64" cy="44" r="10" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="65" cy="44" r="4.5" fill="#0d1230"/><path d="M34 66q16 14 32 0" fill="#3a0d1a" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 66l3 5 3-5M52 66l3 5 3-5" fill="#fff"/><path d="M20 30l10 6M80 30l-10 6" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`,
    troll: `<circle cx="50" cy="48" r="30" fill="#7ad890" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 40l-12-8 4 16M78 40l12-8-4 16" fill="#7ad890" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="40" cy="42" r="6" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="41" cy="42" r="2.7" fill="#0d1230"/><circle cx="60" cy="42" r="6" fill="#fff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="61" cy="42" r="2.7" fill="#0d1230"/><ellipse cx="50" cy="56" rx="8" ry="6" fill="#5ab870" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M36 68q14 8 28 0" fill="none" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M40 68l2 6M58 68l-2 6" stroke="#fff" stroke-width="3"/><path d="M70 66v28" stroke="#8a5a2b" stroke-width="5"/><path d="M60 60h26v14H60z" fill="#ffc94d" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><text x="73" y="71" font-size="9" font-weight="900" text-anchor="middle" fill="#0d1230" font-family="Arial">GEBÜHR</text>`,
    golem: `<path d="M26 30h48v44H26z" fill="#8a8a98" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M34 14h32v18H34z" fill="#9a9aa8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 36h12v30H14zM74 36h12v30H74z" fill="#7a7a88" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M32 74h12v18H32zM56 74h12v18H56z" fill="#7a7a88" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="42" cy="23" r="4" fill="#ff5c73"/><circle cx="58" cy="23" r="4" fill="#ff5c73"/><text x="50" y="58" font-size="16" font-weight="900" text-anchor="middle" fill="#ffe066" font-family="Arial" stroke="#0d1230" stroke-width="1">51%</text><path d="M34 40l6 8M64 44l-4 10" stroke="#5a5a68" stroke-width="2"/>`,
    key: `<circle cx="32" cy="50" r="20" fill="#ffc94d" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="32" cy="50" r="7" fill="#1b2150" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M50 50h40v10M78 50v12M66 50v8" fill="none" stroke="#0d1230" stroke-width="10" stroke-linecap="round"/><path d="M50 50h40v10M78 50v12M66 50v8" fill="none" stroke="#ffc94d" stroke-width="5" stroke-linecap="round"/>`,
    mask: `<circle cx="50" cy="52" r="34" fill="#ffd0a0" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 44q36-18 72 0v14q-36 14-72 0z" fill="#0d1230"/><ellipse cx="36" cy="50" rx="8" ry="5" fill="#fff"/><ellipse cx="64" cy="50" rx="8" ry="5" fill="#fff"/><circle cx="37" cy="50" r="3" fill="#0d1230"/><circle cx="63" cy="50" r="3" fill="#0d1230"/><path d="M38 72q12-6 24 0" fill="none" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 30q30-26 60 0" fill="#3a3f5c" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`,
    pig: `<ellipse cx="50" cy="56" rx="36" ry="28" fill="#ffb3c8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M30 34l-4-14 14 8M64 30l10-12 2 16" fill="#ff8fb0" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="84" cy="58" rx="8" ry="10" fill="#ff8fb0" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="64" cy="46" r="3.5" fill="#0d1230"/><path d="M40 30h18" stroke="#0d1230" stroke-width="5" stroke-linecap="round"/><path d="M30 82v8M66 82v8" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><text x="44" y="68" font-size="18" font-weight="900" text-anchor="middle" fill="#f7931a" font-family="Arial">₿</text>`,
    train: `<path d="M18 22h64v50H18z" fill="#ff5c73" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M26 30h20v16H26zM54 30h20v16H54z" fill="#7cc4ff" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 72h80" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="32" cy="80" r="8" fill="#3a3f5c" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="68" cy="80" r="8" fill="#3a3f5c" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M18 56h64" stroke="#ffc94d" stroke-width="5"/>`,
    finger: `<path d="M50 10c-20 0-34 16-34 38 0 22 10 38 18 42M50 22c-12 0-22 10-22 26 0 16 6 30 14 36M50 34c-6 0-10 6-10 14 0 14 6 26 12 32M50 46v34M62 34c4 4 6 10 6 16 0 14-4 24-8 30M74 26c6 8 10 16 10 26 0 16-4 26-10 34" fill="none" stroke="#0d1230" stroke-width="9" stroke-linecap="round"/><path d="M50 10c-20 0-34 16-34 38 0 22 10 38 18 42M50 22c-12 0-22 10-22 26 0 16 6 30 14 36M50 34c-6 0-10 6-10 14 0 14 6 26 12 32M50 46v34M62 34c4 4 6 10 6 16 0 14-4 24-8 30M74 26c6 8 10 16 10 26 0 16-4 26-10 34" fill="none" stroke="#7af0ff" stroke-width="4" stroke-linecap="round"/>`,
    chain: `<rect x="8" y="38" width="36" height="24" rx="12" fill="none" stroke="#0d1230" stroke-width="12"/><rect x="8" y="38" width="36" height="24" rx="12" fill="none" stroke="#f7931a" stroke-width="6"/><rect x="56" y="38" width="36" height="24" rx="12" fill="none" stroke="#0d1230" stroke-width="12"/><rect x="56" y="38" width="36" height="24" rx="12" fill="none" stroke="#f7931a" stroke-width="6"/><rect x="34" y="42" width="32" height="16" rx="8" fill="none" stroke="#0d1230" stroke-width="12"/><rect x="34" y="42" width="32" height="16" rx="8" fill="none" stroke="#ffc94d" stroke-width="6"/>`,
    server: `<path d="M22 12h56v24H22zM22 40h56v24H22zM22 68h56v24H22z" fill="#2b3478" stroke="#0d1230" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="34" cy="24" r="4" fill="#34d982"/><circle cx="34" cy="52" r="4" fill="#34d982"/><circle cx="34" cy="80" r="4" fill="#ffc94d"/><path d="M48 24h20M48 52h20M48 80h20" stroke="#7cc4ff" stroke-width="4" stroke-linecap="round"/>`,
    laptop: `<path d="M20 22h60v40H20z" fill="#2b3478" ${SK}/><path d="M26 28h48v28H26z" fill="#7cc4ff"/><text x="50" y="50" font-size="22" font-weight="900" text-anchor="middle" fill="#f7931a" font-family="Arial">₿</text><path d="M8 66h84l-8 12H16z" fill="#c0c0cc" ${SK}/>`,
    letter: `<path d="M12 28h76v48H12z" fill="#fff1c2" ${SK}/><path d="M12 28l38 28 38-28" fill="none" ${SK}/>${hl(30, 36, 8, 3)}`,
    news: `<path d="M14 16h72v70H14z" fill="#f4efe1" ${SK}/><path d="M22 26h56v10H22z" fill="#0d1230"/><path d="M22 44h26M22 52h26M22 60h26M22 68h26M56 44h22v24H56z" stroke="#7a7a8c" stroke-width="3" fill="#c9cbe0"/>`,
    block: `<path d="M50 12l34 18v40L50 88 16 70V30z" fill="#f7931a" ${SK}/><path d="M16 30l34 18 34-18M50 48v40" fill="none" ${SK}/><path d="M50 12l34 18-34 18-34-18z" fill="#ffb04a" ${SK}/><text x="34" y="72" font-size="22" font-weight="900" text-anchor="middle" fill="#fff" font-family="Arial">₿</text>`,
    satoshi: `<path d="M22 96c0-26 12-40 28-40s28 14 28 40z" fill="#3a3f5c" ${SK}/><path d="M28 50c0-22 10-36 22-36s22 14 22 36c0 8-10 12-22 12s-22-4-22-12z" fill="#4b5072" ${SK}/><ellipse cx="50" cy="46" rx="14" ry="13" fill="#141833"/><circle cx="44" cy="45" r="2.6" fill="#ffc94d"/><circle cx="56" cy="45" r="2.6" fill="#ffc94d"/><text x="50" y="88" font-size="18" font-weight="900" text-anchor="middle" fill="#f7931a" font-family="Arial">₿</text>`,
    hal: `<path d="M22 96c0-24 12-36 28-36s28 12 28 36z" fill="#34d982" ${SK}/><circle cx="50" cy="38" r="20" fill="#ffd0a0" ${SK}/><path d="M30 34c2-14 12-18 20-18s18 4 20 18c-6-6-12-8-20-8s-14 2-20 8z" fill="#8a5a2b" ${SK}/><circle cx="42" cy="40" r="6" fill="#fff" ${SK}/><circle cx="58" cy="40" r="6" fill="#fff" ${SK}/><path d="M48 40h4" ${SK}/><circle cx="42" cy="40" r="2" fill="#0d1230"/><circle cx="58" cy="40" r="2" fill="#0d1230"/><path d="M43 50q7 6 14 0" fill="none" ${SK}/>`,
    coin: coinP(50, 50, 38),
    pizza: `<path d="M50 90L14 22q36-16 72 0z" fill="#ffd76a" ${SK}/><path d="M14 22q36-16 72 0l-4 9q-32-13-64 0z" fill="#d98a3a" ${SK}/><circle cx="40" cy="44" r="7" fill="#ff5c73" ${SK}/><circle cx="60" cy="40" r="6" fill="#ff5c73" ${SK}/><circle cx="50" cy="64" r="6" fill="#ff5c73" ${SK}/>`,
    ghost: `<path d="M22 90V44c0-18 12-30 28-30s28 12 28 30v46l-9-8-10 8-9-8-9 8-10-8z" fill="#f2f4ff" ${SK}/><ellipse cx="41" cy="44" rx="5" ry="7" fill="#0d1230"/><ellipse cx="59" cy="44" rx="5" ry="7" fill="#0d1230"/><ellipse cx="50" cy="62" rx="6" ry="4" fill="#0d1230"/>${hl(36, 28, 7, 3)}`,
    bag: `<path d="M38 22h24l-6 12h-12z" fill="#c9a26b" ${SK}/><path d="M44 34h12c22 8 30 26 26 42-3 10-12 14-32 14s-29-4-32-14c-4-16 4-34 26-42z" fill="#e0b97a" ${SK}/><text x="50" y="76" font-size="30" font-weight="900" text-anchor="middle" fill="#8a5a2b" font-family="Arial">₿</text>${hl(34, 50, 5, 9)}`,
    scale: `<path d="M50 18v62M30 86h40" fill="none" ${SK}/><path d="M14 30h72" ${SK}/><path d="M14 30l-10 24h20zM86 30l-10 24h20z" fill="#ffc94d" ${SK}/><circle cx="50" cy="18" r="5" fill="#ffc94d" ${SK}/>`,
    dollar: `<path d="M10 28h80v44H10z" fill="#9ee6a8" ${SK}/><circle cx="50" cy="50" r="13" fill="#34d982" ${SK}/><text x="50" y="57" font-size="20" font-weight="900" text-anchor="middle" fill="#0d1230" font-family="Arial">$</text>`,
    scissors: `<circle cx="28" cy="72" r="12" fill="#ff5c73" ${SK}/><circle cx="28" cy="34" r="12" fill="#ff5c73" ${SK}/><path d="M38 66L88 30M38 40l50 36" stroke="#c0c0cc" stroke-width="9" stroke-linecap="round"/><path d="M38 66L88 30M38 40l50 36" fill="none" stroke="#0d1230" stroke-width="2"/><circle cx="56" cy="53" r="4" fill="#0d1230"/>`,
    pick: `<path d="M30 84L68 30" stroke="#8a5a2b" stroke-width="10" stroke-linecap="round"/><path d="M30 84L68 30" fill="none" stroke="#0d1230" stroke-width="2"/><path d="M40 20q30-6 48 22q-22-12-44-6z" fill="#c0c0cc" ${SK}/>`,
    bank2: `<path d="M50 10l40 20H10z" fill="#ffc94d" ${SK}/><path d="M14 30h72v6H14zM14 80h72v8H14z" fill="#f2f4ff" ${SK}/><path d="M22 38h8v40h-8zM40 38h8v40h-8zM58 38h8v40h-8zM74 38h8v40h-8z" fill="#f2f4ff" ${SK}/>`,
    bank: `<path d="M50 10l40 20H10z" fill="#ffc94d" ${SK}/><path d="M14 30h72v6H14zM14 80h72v8H14z" fill="#f2f4ff" ${SK}/><path d="M22 38h8v40h-8zM40 38h8v40h-8zM58 38h8v40h-8zM74 38h8v40h-8z" fill="#f2f4ff" ${SK}/><path d="M46 46l6 10-5 8 7 12" fill="none" stroke="#ff5c73" stroke-width="3"/>`,
    split: `<path d="M12 50h30l40-28M42 50l40 28" fill="none" stroke="#0d1230" stroke-width="12" stroke-linecap="round"/><path d="M12 50h30l40-28" fill="none" stroke="#f7931a" stroke-width="6" stroke-linecap="round"/><path d="M42 50l40 28" fill="none" stroke="#9aa2d6" stroke-width="6" stroke-linecap="round"/>`,
    rocket: `<path d="M50 8c16 14 20 34 14 58H36C30 42 34 22 50 8z" fill="#f2f4ff" ${SK}/><circle cx="50" cy="36" r="8" fill="#7cc4ff" ${SK}/><path d="M36 54l-12 18 14-4zM64 54l12 18-14-4z" fill="#ff5c73" ${SK}/><path d="M42 66q8 22 16 0" fill="#ffc94d" ${SK}/>`,
    volcano: `<path d="M6 92l30-50h28l30 50z" fill="#8a5a2b" ${SK}/><path d="M36 42q14 10 28 0l-4 14q-10 6-20 0z" fill="#ff5c73" ${SK}/><path d="M44 30q-6-14 4-22M56 30q6-12-2-20" fill="none" stroke="#c9cbe0" stroke-width="5" stroke-linecap="round"/><path d="M58 60l-10 14h8l-6 12 14-18h-8l6-8z" fill="#ffe066" ${SK}/>`,
    flag: `<path d="M18 10v84" ${SK}/><path d="M18 14h66v54H18z" fill="#fff" ${SK}/><path d="M20 16h62v15H20zM20 51h62v15H20z" fill="#2f6fd6"/><circle cx="51" cy="41" r="6" fill="#ffc94d" stroke="#0d1230" stroke-width="2"/>`,
    phone: `<path d="M30 8h40v84H30z" fill="#2b3478" ${SK} rx="8"/><path d="M35 16h30v62H35z" fill="#7cc4ff"/><path d="M54 26l-12 20h10l-6 18 16-24H52l6-14z" fill="#ffe066" stroke="#0d1230" stroke-width="2"/>`,
    bolt: `<path d="M58 6L26 54h20l-8 40 36-54H52l10-34z" fill="#ffe066" ${SK}/>`,
    sprout: `<path d="M50 92V48" stroke="#1a9e5a" stroke-width="7" stroke-linecap="round"/><path d="M50 56C30 58 16 44 16 26c22 0 34 12 34 30zM50 46c4-18 18-28 36-26 0 20-16 30-36 26z" fill="#34d982" ${SK}/><path d="M22 92h56" ${SK}/>`,
    tower: `<path d="M26 14h48v78H26z" fill="#7cc4ff" ${SK}/><path d="M34 24h10v10H34zM56 24h10v10H56zM34 44h10v10H34zM56 44h10v10H56zM34 64h10v10H34zM56 64h10v10H56z" fill="#2b3478"/><path d="M26 14h48v8H26z" fill="#ff5c73" ${SK}/>`,
    boom: `<path d="M50 6l9 22 22-12-8 24 22 6-22 10 14 20-24-6-4 24-12-20-16 18 2-24-22 2 16-18-18-14 24-2-6-24 20 12z" fill="#ffe066" ${SK}/><path d="M50 28l5 14 14-6-6 14 12 6-14 4 6 12-14-4-4 12-6-12-10 8 2-12-12-2 10-10-8-10 14 2z" fill="#ff5c73"/>`,
    bull: `<path d="M24 26q-14-4-14-18 10 4 20 12M76 26q14-4 14-18-10 4-20 12" fill="#fff4d6" ${SK}/><circle cx="50" cy="48" r="30" fill="#34d982" ${SK}/><ellipse cx="50" cy="64" rx="20" ry="14" fill="#b6f5cf" ${SK}/><circle cx="43" cy="62" r="3" fill="#0d1230"/><circle cx="57" cy="62" r="3" fill="#0d1230"/><circle cx="50" cy="80" r="5" fill="none" stroke="#ffc94d" stroke-width="4"/><path d="M34 40h12v8H34zM54 40h12v8H54zM46 43h8" fill="#0d1230" stroke="#0d1230" stroke-width="2"/>${hl(36, 30, 8, 3)}`,
    trophy: `<path d="M30 14h40v22c0 16-8 26-20 26s-20-10-20-26z" fill="#ffc94d" ${SK}/><path d="M30 22H16c0 14 6 20 16 20M70 22h14c0 14-6 20-16 20" fill="none" ${SK}/><path d="M44 62h12v12H44zM32 74h36v12H32z" fill="#e0a000" ${SK}/><text x="50" y="44" font-size="20" font-weight="900" text-anchor="middle" fill="#b86e00" font-family="Arial">₿</text>${hl(40, 22, 5, 2)}`,
  };
  const art = n => `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">${ART[n]}</svg>`;

  // Zeichnung je Welt (Weltsymbol und Karte im Lernpfad)
  const CARD = {eigenschaften: "scale", inflation: "dollar", halving: "scissors", geschichte: "pizza", wallets: "bank2", seed: "letter", betrug: "mask", krypto: "rocket",
    sparplan: "pig", fomo: "boom", hebel: "volcano", utxo: "bag", bahnhof: "train", lightning: "bolt", hashing: "finger", schluessel: "key", blockchain: "chain", mining: "pick", nodes: "server"};

  // ---------- Tages-Challenge mit Serie ----------
  const DAILY = [
    ["Wie viele Bitcoin wird es höchstens geben?", ["21 Millionen", "100 Millionen", "Unbegrenzt"], 0, "Die Obergrenze von 21 Millionen steht fest im Code."],
    ["Wie heißt die kleinste Bitcoin-Einheit?", ["Satoshi (Sat)", "Bit", "Cent"], 0, "1 Bitcoin = 100 Millionen Sats, benannt nach dem Erfinder."],
    ["Wie oft halbiert sich die Belohnung für Miner?", ["Etwa alle 4 Jahre", "Jedes Jahr", "Nie"], 0, "Alle 210.000 Blöcke, das sind ungefähr 4 Jahre."],
    ["Wer darf deine Seed-Wörter wissen?", ["Niemand", "Der Support deiner Wallet", "Deine Bank"], 0, "Wer die Wörter kennt, hat deine Bitcoin. Echter Support fragt nie danach."],
    ["Wie lange dauert es im Schnitt bis zum nächsten Block?", ["Etwa 10 Minuten", "Etwa 1 Sekunde", "Etwa 1 Tag"], 0, "Die Schwierigkeit passt sich an, damit es im Schnitt bei 10 Minuten bleibt."],
    ["Was passiert mit einer Münze (UTXO), wenn du nur einen Teil zahlst?", ["Sie wird ganz ausgegeben, der Rest kommt als Wechselgeld zurück", "Sie wird geteilt", "Das geht nicht"], 0, "Wie beim Bargeld: ganz ausgeben, Wechselgeld zurück."],
    ["Wann wurde der erste Bitcoin-Block erzeugt?", ["Januar 2009", "Dezember 2017", "März 2000"], 0, "Der Genesis-Block entstand am 3. Januar 2009."],
    ["Wofür steht „HODL“ in der Bitcoin-Welt?", ["Halten statt verkaufen", "Eine Börse", "Ein Wallet-Typ"], 0, "Ursprünglich ein Tippfehler von „hold“ aus einem Forum 2013, heute ein Motto."],
    ["Was macht eine Node?", ["Sie prüft jeden Block nach den Regeln", "Sie druckt neue Bitcoin", "Sie legt den Preis fest"], 0, "Nodes prüfen und verbreiten Blöcke und Transaktionen."],
    ["Was ist Lightning?", ["Ein Netz für schnelle, günstige Zahlungen auf Bitcoin", "Ein neuer Coin", "Eine Börse"], 0, "Lightning nutzt Kanäle, um Zahlungen in Sekunden abzuwickeln."],
    ["Was bedeutet „Nicht deine Schlüssel, nicht deine Bitcoin“?", ["Wer die Schlüssel nicht selbst hat, besitzt nur ein Versprechen", "Man braucht keine Schlüssel", "Schlüssel gehören der Bank"], 0, "Auf einer Börse gehören die Schlüssel der Börse."],
    ["Was zeigt ein Hash?", ["Einen eindeutigen Fingerabdruck von Daten", "Den Bitcoin-Preis", "Deine Adresse"], 0, "Schon ein geändertes Zeichen ergibt einen völlig anderen Hash."],
    ["Was ist ein typisches Betrugs-Signal?", ["Garantierte hohe Gewinne", "Open-Source-Code", "Lange Erfahrung"], 0, "Wer Rendite verspricht, will meistens dein Geld."],
    ["Wer bekommt die Gebühren einer Transaktion?", ["Der Miner, der den Block findet", "Die Bitcoin-Firma", "Der Staat"], 0, "Gebühren und neue Bitcoin bilden den Lohn der Miner."],
    ["Was ist ein Sparplan (DCA)?", ["Regelmäßig den gleichen Betrag kaufen", "Alles auf einmal kaufen", "Mit Hebel kaufen"], 0, "So musst du nicht den perfekten Zeitpunkt treffen."],
    ["Was passiert bei einer Liquidation?", ["Die Börse schließt die Hebel-Wette, der Einsatz ist weg", "Du bekommst Zinsen", "Nichts"], 0, "Bitcoin ohne Hebel kann nie liquidiert werden."],
    ["Wie viele Blöcke liegen zwischen zwei Halvings?", ["210.000", "2.016", "21.000.000"], 0, "2.016 Blöcke ist der Abstand der Schwierigkeits-Anpassung."],
    ["Wer ist Satoshi Nakamoto?", ["Der unbekannte Erfinder von Bitcoin", "Ein japanischer Bankchef", "Ein Börsen-CEO"], 0, "Bis heute weiß niemand, wer dahintersteckt."],
    ["Was kauften 2010 zwei Pizzen?", ["10.000 Bitcoin", "1 Bitcoin", "100 Bitcoin"], 0, "Der 22. Mai ist seitdem der Bitcoin-Pizza-Tag."],
    ["Was ist eine Soft Fork?", ["Ein Upgrade mit strengeren Regeln, alte Nodes bleiben kompatibel", "Eine Abspaltung in zwei Coins", "Ein Hackerangriff"], 0, "SegWit und Taproot waren Soft Forks."],
    ["Was ist eine Hardware-Wallet?", ["Ein Gerät, das den Schlüssel offline hält", "Eine Börse", "Ein USB-Stick mit Bitcoin drauf"], 0, "Die Bitcoin liegen in der Blockchain, das Gerät schützt nur den Schlüssel."],
    ["Was heißt FOMO?", ["Angst, etwas zu verpassen", "Ein Mining-Gerät", "Eine Gebühr"], 0, "FOMO verleitet dazu, teuer zu kaufen."],
    ["Womit unterschreibst du eine Bitcoin-Zahlung?", ["Mit deinem privaten Schlüssel", "Mit deiner Adresse", "Mit deinem Passwort bei der Börse"], 0, "Prüfen kann jeder mit dem öffentlichen Schlüssel."],
    ["Was verbindet die Blöcke miteinander?", ["Jeder Block enthält den Hash des vorherigen", "Ein Server", "Die Uhrzeit"], 0, "Deshalb fällt jede Änderung an alten Blöcken sofort auf."],
    ["Welche Einheit nutzt man für Gebühren?", ["sat/vB (Sats pro virtuellem Byte)", "Euro pro Bitcoin", "Prozent vom Betrag"], 0, "Die Gebühr hängt von der Größe der Transaktion ab, nicht vom Betrag."],
    ["Was ist die Mempool?", ["Der Warteraum für unbestätigte Transaktionen", "Ein Mining-Pool", "Eine Wallet"], 0, "Miner suchen sich dort die Transaktionen mit den höchsten Gebühren aus."],
    ["Welches Land machte Bitcoin 2021 zum Zahlungsmittel?", ["El Salvador", "Deutschland", "Japan"], 0, "El Salvador war das erste Land der Welt."],
    ["Was ist Inflation?", ["Dein Geld verliert an Kaufkraft", "Der Bitcoin-Kurs steigt", "Banken zahlen Zinsen"], 0, "Dieselben Dinge kosten mit der Zeit mehr Geld."],
  ];
  const DK = "satsland-daily", ymd = d => d.toLocaleDateString("sv-SE"), today = () => ymd(new Date());
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };
  function streak(){ let d = {}; try { d = JSON.parse(localStorage.getItem(DK)) || {}; } catch(e){}
    if (d.last !== today() && d.last !== yesterday()) d.streak = 0; return d; }
  function daily(box){
    const day = Math.floor(new Date(today()).getTime()/864e5), [q, opts, ok, why] = DAILY[day % DAILY.length], d = streak(), doneToday = d.last === today();
    const order = opts.map((o, i) => [((day*7 + i*13) % 11), i, o]).sort((a, b) => a[0] - b[0]);
    box.innerHTML = `<div class="dh"><span class="fl ${d.streak ? "on" : ""}">🔥 <b>${d.streak || 0}</b></span><span>Tag${d.streak === 1 ? "" : "e"} in Folge${d.best ? ` · Rekord ${d.best}` : ""}</span></div>
      <p class="dq">${q}</p><div class="opts">${order.map(([, i, o]) => `<button type="button" data-i="${i}" ${doneToday ? "disabled" : ""} class="${doneToday && i === ok ? "ok" : ""}">${o}</button>`).join("")}</div>
      <p class="why" ${doneToday ? "" : "hidden"}>${doneToday ? (d.ok ? "✓ Heute geschafft! " : "Heute war's knapp. ") + why + " Morgen gibt's eine neue Frage." : ""}</p>`;
    if (doneToday) return;
    box.querySelector(".opts").onclick = e => { const b = e.target.closest("button"); if (!b) return;
      const right = +b.dataset.i === ok, s = streak();
      s.streak = (s.last === yesterday() ? s.streak || 0 : 0) + 1; s.best = Math.max(s.best || 0, s.streak); s.last = today(); s.ok = right;
      try { localStorage.setItem(DK, JSON.stringify(s)); } catch(e){}
      daily(box); if (!right) box.querySelector(`[data-i="${b.dataset.i}"]`).classList.add("no");
      if ([3, 7, 14, 30, 100].includes(s.streak)){ confetti(); toast(`🔥 ${s.streak} Tage in Folge! Weiter so.`); }
      else toast(right ? "🔥 Richtig! Serie: " + s.streak : "🔥 Serie gehalten: " + s.streak + ". Mitmachen zählt!");
      say(right ? "Stark! Bis morgen bei der nächsten Frage." : "Fast! Wichtig ist, dass du dranbleibst.");
    };
  }

  // ---------- Satoshi als Begleiter ----------
  const TIPS = {
    "": "Willkommen in Satsland! Mach die Tages-Challenge und besiege alle 5 Bosse.",
    eigenschaften: "Hi, ich bin Satoshi! Rate, welches Geld gewinnt. Tipp: Gold ist ein harter Gegner.",
    inflation: "Schau, wie dein Einkaufswagen schrumpft. Genau das ist Inflation.",
    halving: "Alle 4 Jahre halbiert sich die Belohnung. Das macht Bitcoin knapp.",
    geschichte: "Drück auf ▶ Abspielen, dann zeige ich dir meine Geschichte.",
    wallets: "Nicht deine Schlüssel, nicht deine Bitcoin. Merk dir das!",
    seed: "Deine Seed-Wörter sind alles. Nie abfotografieren, nie online speichern!",
    betrug: "Ich schreibe dir nie. Wer sich als Satoshi ausgibt, ist ein Betrüger.",
    krypto: "Es gibt Tausende Coins. Prüf jeden mit den sechs Fragen.",
    sparplan: "Regelmäßig kaufen schlägt Timing. Probier verschiedene Startjahre.",
    fomo: "Kannst du ruhig bleiben, wenn alle schreien? Ich bin gespannt.",
    hebel: "Hebel ist wie eine Lupe. Auch für deine Verluste!",
    utxo: "Bitcoin ist wie Bargeld: Du bekommst Wechselgeld zurück.",
    bahnhof: "Wer mehr Gebühr zahlt, fährt im nächsten Zug mit.",
    lightning: "Mit Lightning zahlst du in Sekunden, fast gratis.",
    hashing: "Ändere nur ein einziges Zeichen und staune.",
    schluessel: "Mit dem privaten Schlüssel unterschreibst du. Den kennt nur dein Gerät.",
    blockchain: "Versuch mal, einen alten Block zu fälschen. Viel Glück!",
    mining: "Probier selbst zu minen. Ganz schön viel Arbeit, oder?",
    nodes: "Nodes gehorchen niemandem, nur den Regeln.",
  };
  const GK = "satsland-guide-off";
  let gTimer = 0;
  function say(text, ms = 7000){
    const g = document.querySelector(".guide"); if (!g) return;
    const b = g.querySelector(".gb"); b.querySelector("span").textContent = text; g.classList.add("talk");
    clearTimeout(gTimer); gTimer = setTimeout(() => g.classList.remove("talk"), ms);
  }
  function guide(){
    let off = false; try { off = localStorage.getItem(GK) === "1"; } catch(e){}
    if (off || !(here in TIPS) && here) return;
    const g = document.createElement("div"); g.className = "guide";
    g.innerHTML = `<div class="gb"><span></span><button type="button" class="gx" aria-label="Satoshi ausblenden">×</button></div><button type="button" class="gs" aria-label="Satoshi fragen">${art("satoshi")}</button>`;
    document.body.appendChild(g);
    g.querySelector(".gs").onclick = () => say(TIPS[here] || TIPS[""]);
    g.querySelector(".gx").onclick = () => { g.remove(); try { localStorage.setItem(GK, "1"); } catch(e){} toast("Satoshi ist weg. Zurückholen: unten auf der Startseite."); };
    g.querySelector(".gb span").onclick = () => g.classList.remove("talk");   // Antippen schließt die Blase
    setTimeout(() => say(TIPS[here] || TIPS[""], 5500), 900);
  }
  const PRAISE = ["Stark! 💪", "Genau so!", "Du hast's drauf!", "Richtig! Weiter so."], OOPS = ["Fast! Lies kurz die Erklärung.", "Kein Problem, so lernt man.", "Knapp daneben. Jetzt weißt du's!"];
  const pickOne = a => a[Math.floor(Math.random()*a.length)];


  // ---------- Comic-Intro je Welt: kurzes animiertes Panel unter der Überschrift ----------
  const sa = (n, x, y, z, an = "", d = 0, st = "") => `<span class="a" style="left:${x}%;top:${y}%;width:${z}px;height:${z}px;${an ? `animation:${an};animation-delay:${d}s;` : ""}${st}">${art(n)}</span>`;
  const sl = (t, x, y, d = 0) => `<span class="lbl" style="left:${x}%;top:${y}%;animation-delay:${d}s">${t}</span>`;
  const sf = (n, fx, fy, x, y, z, d) => sa(n, x, y, z, "fly 1.3s cubic-bezier(.3,.7,.3,1) both", d, `--fx:${fx}%;--fy:${fy}%`);
  const INTRO = {
    eigenschaften: ["day", "Wer ist das beste Geld?", sa("dollar", 22, 60, 64, "grow .5s both", .2) + sa("trophy", 50, 56, 74, "grow .5s both", .5) + sa("coin", 78, 60, 64, "grow .5s both", .8) + sl("Das Duell beginnt!", 50, 88, 1.2)],
    inflation: ["dusk", "Alles wird teurer …", sa("dollar", 34, 60, 84, "shrink 2.4s ease .6s both") + sa("bag", 72, 60, 64) + sl("Kaufkraft schrumpft", 50, 88, 1)],
    halving: ["night", "Schnipp, schnapp: halbiert!", sa("coin", 24, 62, 70) + sa("scissors", 50, 58, 60, "cut .6s ease 3", .3) + sa("coin", 76, 66, 40, "grow .5s both", 1.8) + sl("50 → 25 → … → 3,125", 50, 88, 1.4)],
    wallets: ["day", "Hol dir deine Schlüssel!", sa("bank2", 22, 60, 76) + sf("key", 22, 60, 76, 58, 52, .6) + sa("phone", 80, 62, 60) + sl("Nicht deine Schlüssel …", 50, 88, 1.6)],
    seed: ["dusk", "12 Wörter = alles", sa("letter", 32, 60, 72, "grow .5s both", .2) + sa("key", 70, 58, 64, "bobA 1.6s ease-in-out infinite", .8) + sl("Offline aufschreiben!", 50, 88, 1)],
    betrug: ["night", "Psst … gratis Bitcoin?", sa("mask", 30, 60, 76, "shake .5s ease .6s 3") + sa("phone", 74, 62, 56) + sl("Achtung, Falle!", 50, 88, 1.4)],
    krypto: ["day", "1000x garantiert!!!", sa("rocket", 30, 62, 66, "rocket 3s ease-in-out .3s both") + sa("coin", 72, 60, 66, "grow .5s both", .4) + sl("Lieber erst prüfen", 50, 88, 1.6)],
    sparplan: ["dawn", "Jeden Monat ein bisschen", sa("pig", 64, 62, 80) + sf("coin", 64, -20, 64, 40, 34, .3) + sf("coin", 64, -20, 64, 40, 34, 1.3) + sf("coin", 64, -20, 64, 40, 34, 2.3) + sl("Klein, aber regelmäßig", 30, 88, 1)],
    fomo: ["dusk", "Kaufen? Verkaufen? AAAH!", `<svg class="line" viewBox="0 0 400 170"><path d="M10 140 C120 135 200 120 250 30 C270 15 280 25 300 120 L390 140" stroke="#f7931a"/></svg>` + sa("fomo", 18, 62, 60, "bobA 1s ease-in-out infinite") + sl("Ruhig bleiben!", 76, 86, 2.4)],
    hebel: ["dusk", "10× Hebel, was kann schon …", sa("volcano", 34, 62, 86) + sa("boom", 66, 52, 76, "grow .4s both", 1.6) + sl("BOOM. Einsatz weg.", 66, 88, 2)],
    utxo: ["day", "Wechselgeld, bitte!", sa("bag", 22, 60, 66) + sf("coin", 22, 60, 60, 56, 40, .5) + sf("coin", 22, 60, 82, 62, 30, 1) + sl("Rest kommt zurück", 70, 88, 1.6)],
    bahnhof: ["night", "Nächster Zug: in ~10 Minuten", sa("train", 50, 64, 90, "drive 4s linear .2s infinite") + sl("Wer mehr zahlt, fährt mit", 50, 90, .8)],
    lightning: ["night", "Bezahlt in 1 Sekunde", sa("phone", 18, 62, 60) + sa("phone", 82, 62, 60) + sa("bolt", 50, 56, 56, "zap 1s ease .3s 3") + sl("⚡ fast gratis", 50, 88, 1.2)],
    hashing: ["night", "Jeder Text hat einen Fingerabdruck", sa("news", 22, 60, 66) + sf("finger", 22, 60, 76, 58, 66, .6) + sl("Ein Zeichen anders = alles anders", 50, 90, 1.6)],
    schluessel: ["dawn", "Unterschrift mit Schlüssel", sa("key", 28, 60, 70, "bobA 1.4s ease-in-out infinite") + sa("letter", 72, 60, 70, "grow .5s both", .5) + sl("✓ echt", 72, 30, 1.4)],
    blockchain: ["night", "Block an Block an Block", sa("block", 20, 62, 54, "drop .7s cubic-bezier(.3,1.4,.5,1) both", .2, "top:62%") + sa("block", 44, 62, 54, "drop .7s cubic-bezier(.3,1.4,.5,1) both", .7, "top:62%") + sa("block", 68, 62, 54, "drop .7s cubic-bezier(.3,1.4,.5,1) both", 1.2, "top:62%") + sa("chain", 86, 62, 40, "grow .5s both", 1.8)],
    mining: ["dusk", "Raten, raten … Treffer!", sa("pick", 34, 58, 70, "swing .5s ease-in-out 4") + sa("block", 66, 62, 60, "grow .5s both", 2.2) + sl("Neuer Block!", 66, 24, 2.4)],
    nodes: ["night", "Tausende Wächter prüfen alles", sa("server", 18, 62, 52, "grow .4s both", .1) + sa("server", 39, 62, 52, "grow .4s both", .3) + sa("server", 61, 62, 52, "grow .4s both", .5) + sa("server", 82, 62, 52, "grow .4s both", .7) + sl("✓ ✓ ✓ ✓", 50, 22, 1.2)],
  };
  function intro(){
    const I = INTRO[here], h = document.querySelector("h1"); if (!I || !h) return;
    const st = document.createElement("div"); st.className = `stage intro ${I[0]}`; st.setAttribute("aria-hidden", "true"); st.title = "Nochmal abspielen";
    const play = () => { st.innerHTML = `<span class="say">${I[1]}</span>` + I[2]; };
    play(); st.onclick = play; h.parentElement.after(st);
  }

  // ---------- Kapitel-Bosse: 5 Fragen auf Zeit, Boss hat 4 Leben, du 2 ----------
  const BOSSES = [
    ["printer", "Der Gelddrucker", "Ich drucke einfach mehr Geld. Hahaha!", [
      ["Es wird mehr Geld gedruckt, aber nicht mehr hergestellt. Was passiert meist?", ["Die Preise steigen", "Die Preise fallen", "Nichts"], "Mehr Geld für gleich viele Waren: Jeder Euro kauft weniger."],
      ["Wie viele Bitcoin gibt es höchstens?", ["21 Millionen", "21 Milliarden", "Unbegrenzt"], "Die Grenze steht fest im Code."],
      ["Was halbiert sich beim Halving?", ["Die neuen Bitcoin pro Block", "Der Bitcoin-Preis", "Die Zahl der Nodes"], "Die Belohnung für Miner halbiert sich etwa alle 4 Jahre."],
      ["Wo hat Gold einen Vorteil gegenüber Bitcoin?", ["Es ist seit Jahrtausenden bewährt", "Es ist leichter zu verschicken", "Es ist besser teilbar"], "Bitcoin gibt es erst seit 2009."],
      ["Wer kann neue Euro erschaffen?", ["Zentralbank und Banken", "Jeder Bürger", "Niemand"], "Bei Bitcoin kann das dagegen niemand."]]],
    ["phisher", "Phishing-Phil", "Gib mir mal kurz deine Seed-Wörter …", [
      ["Der „Support“ fragt im Chat nach deinen Seed-Wörtern. Was tust du?", ["Niemals herausgeben, das ist Betrug", "Herausgeben, er will helfen", "Nur die Hälfte schicken"], "Echter Support fragt nie nach dem Seed."],
      ["Wo bewahrst du Seed-Wörter am besten auf?", ["Offline auf Papier oder Metall", "Als Foto in der Cloud", "In einer E-Mail an dich selbst"], "Alles Digitale kann gehackt werden."],
      ["Deine Börse geht pleite. Wer ist sicher?", ["Wer seine Bitcoin in der eigenen Wallet hat", "Wer sie auf der Börse lässt", "Niemand"], "Nicht deine Schlüssel, nicht deine Bitcoin."],
      ["Ein Coin verspricht „1000x garantiert“. Das ist …", ["Ein großes Warnsignal", "Eine sichere Sache", "Normal"], "Garantierte Gewinne gibt es nicht."],
      ["Was speichert eine Hardware-Wallet?", ["Deine privaten Schlüssel", "Deine Bitcoin selbst", "Dein Bankkonto"], "Die Bitcoin liegen in der Blockchain, das Gerät schützt die Schlüssel."]]],
    ["fomo", "Das FOMO-Monster", "Alle werden reich, nur du nicht! KAUF JETZT!", [
      ["Rekordhoch, alle reden von Bitcoin. Was lehrt die Geschichte?", ["Dann ist es oft schon teuer, ruhig bleiben", "Sofort alles kaufen", "Kredit aufnehmen"], "In der Euphorie kaufen viele zu teuer."],
      ["Was ist ein Sparplan?", ["Regelmäßig den gleichen Betrag kaufen", "Einmal alles kaufen", "Mit Hebel kaufen"], "So musst du keinen perfekten Zeitpunkt treffen."],
      ["10× Hebel, der Kurs fällt um 10 %. Was passiert?", ["Der Einsatz ist komplett weg", "Du verlierst 1 %", "Nichts"], "100 % geteilt durch 10 = 10 %."],
      ["Minus 70 %, überall Panik. Was war in der Vergangenheit oft ein Fehler?", ["In Panik alles verkaufen", "Ruhig bleiben", "Einen Plan haben"], "Wer panisch verkauft, macht den Verlust endgültig."],
      ["Wer kann nie liquidiert werden?", ["Wer ohne Hebel kauft", "Wer mit 2× Hebel handelt", "Wer nur nachts handelt"], "Ohne geliehenes Geld gibt es nichts zu liquidieren."]]],
    ["troll", "Der Gebühren-Troll", "Hier kommt keiner durch ohne Gebühr!", [
      ["Wovon hängt die Bitcoin-Gebühr vor allem ab?", ["Von der Größe der Transaktion in vByte", "Vom Betrag", "Von der Uhrzeit"], "Miner werden pro vByte bezahlt."],
      ["Du hast eine 0,05-BTC-Münze und zahlst 0,01 BTC. Was passiert?", ["Sie wird ganz ausgegeben, der Rest kommt als Wechselgeld zurück", "Sie wird geteilt", "Das geht nicht"], "Wie beim Bargeld."],
      ["Was ist die Mempool?", ["Der Warteraum für unbestätigte Transaktionen", "Ein Mining-Pool", "Eine Börse"], "Miner nehmen zuerst die Transaktionen mit hoher Gebühr."],
      ["Warum ist Lightning so günstig?", ["Zahlungen laufen über Kanäle außerhalb der Blockchain", "Weil es ein anderer Coin ist", "Weil Miner verzichten"], "Nur Öffnen und Schließen eines Kanals kosten Platz in der Blockchain."],
      ["Wer bekommt die Gebühr?", ["Der Miner, der den Block findet", "Eine Bitcoin-Firma", "Der Staat"], "Gebühren sind Teil des Miner-Lohns."]]],
    ["golem", "Der 51-%-Golem", "Ich habe die meiste Rechenleistung. Ich ändere die Regeln!", [
      ["Was ist ein Hash?", ["Ein digitaler Fingerabdruck von Daten", "Ein Passwort", "Eine Adresse"], "Ein Zeichen anders, und der Hash ist ein völlig anderer."],
      ["Womit wird eine Bitcoin-Zahlung unterschrieben?", ["Mit dem privaten Schlüssel", "Mit dem öffentlichen Schlüssel", "Mit dem Börsen-Passwort"], "Geprüft wird mit dem öffentlichen Schlüssel."],
      ["Jemand ändert einen alten Block. Was passiert?", ["Sein Hash ändert sich, die Kette passt nicht mehr", "Niemand merkt es", "Der Block wird gelöscht"], "Jeder Block enthält den Hash des vorherigen."],
      ["Kann eine Miner-Mehrheit mehr als 21 Mio. Bitcoin erzeugen?", ["Nein, die Nodes lehnen solche Blöcke ab", "Ja, ab 51 %", "Ja, ab 90 %"], "Nodes stimmen nicht ab, sie prüfen die Regeln."],
      ["Warum braucht Bitcoin-Mining Strom?", ["Weil Miner raten müssen, bis ein Hash passt", "Für die Kühlung von Börsen", "Für das Drucken von Coins"], "Proof of Work: echter Aufwand schützt das Netz."]]],
  ];
  const BK = "satsland-boss", bossWon = () => { try { return JSON.parse(localStorage.getItem(BK)) || {}; } catch(e){ return {}; } };
  function boss(k){
    const [img, name, taunt, Q] = BOSSES[k], bg = document.createElement("div"); bg.className = "bossbg";
    let i = 0, hp = 4, lives = 2, t = 0, timer = 0, lock = false;
    const order = Q.map(q => q).sort(() => Math.random() - .5);
    bg.innerHTML = `<div class="boss" role="dialog" aria-label="Boss-Kampf"><div class="bt"><b>👹 ${name}</b><button class="bx" type="button" aria-label="Schließen">×</button></div>
      <div class="arena"><div class="bimg">${art(img)}</div><div class="bubble">${taunt}</div></div>
      <div class="bars"><span>Boss</span><div class="hp"><i style="width:100%"></i></div><span>Du</span><span class="lives">❤️❤️</span></div><div id="bq"></div></div>`;
    document.body.appendChild(bg);
    const B = bg.querySelector(".boss"), im = bg.querySelector(".bimg"), bub = bg.querySelector(".bubble"), box = bg.querySelector("#bq");
    const close = () => { clearInterval(timer); bg.remove(); };
    bg.querySelector(".bx").onclick = close;
    const hud = () => { bg.querySelector(".hp i").style.width = hp/4*100 + "%"; bg.querySelector(".lives").textContent = "❤️".repeat(lives) + "🖤".repeat(2 - lives); };
    function ask(){
      if (hp <= 0 || lives <= 0 || i >= order.length) return end();
      const [q, opts, why] = order[i], mix = opts.map((o, n) => [Math.random(), n, o]).sort((a, b) => a[0] - b[0]);
      box.innerHTML = `<div class="tm"><i style="width:100%"></i></div><p class="bq">${i + 1}. ${q}</p><div class="opts">${mix.map(([, n, o]) => `<button type="button" data-n="${n}">${o}</button>`).join("")}</div><p class="why" hidden></p>`;
      t = 15; lock = false; clearInterval(timer);
      timer = setInterval(() => { t -= .1; box.querySelector(".tm i").style.width = Math.max(0, t/15*100) + "%"; if (t <= 0) answer(-1); }, 100);
      box.querySelector(".opts").onclick = e => { const b = e.target.closest("button"); if (b) answer(+b.dataset.n); };
    }
    function answer(n){
      if (lock) return; lock = true; clearInterval(timer);
      const ok = n === 0, [, , why] = order[i];
      box.querySelectorAll(".opts button").forEach(b => { b.disabled = true; if (+b.dataset.n === 0) b.classList.add("ok"); else if (+b.dataset.n === n) b.classList.add("no"); });
      const w = box.querySelector(".why"); w.hidden = false; w.textContent = (n < 0 ? "⏰ Zeit um! " : ok ? "Treffer! " : "Autsch. ") + why;
      if (ok){ hp--; im.classList.remove("ouch"); void im.offsetWidth; im.classList.add("ouch"); bub.textContent = pickOne(["Autsch!", "Das tat weh!", "Grrr …", "Unmöglich!"]); }
      else { lives--; B.classList.remove("hit"); void B.offsetWidth; B.classList.add("hit"); bub.textContent = pickOne(["Hahaha!", "Zu langsam!", "Daneben!", "Ich bin unbesiegbar!"]); }
      hud(); i++; setTimeout(ask, 1900);
    }
    function end(){
      clearInterval(timer); const win = hp <= 0;
      if (win){ im.classList.add("down"); bub.textContent = "Neiiin … besiegt!"; const w = bossWon(); w[k] = lives === 2 ? "perfect" : (w[k] === "perfect" ? "perfect" : true); try { localStorage.setItem(BK, JSON.stringify(w)); } catch(e){} confetti(); }
      box.innerHTML = `<div class="end"><b>${win ? "🏆 Boss besiegt!" : "💀 Der Boss gewinnt diesmal"}</b><p class="muted">${win ? (lives === 2 ? "Ohne einen Fehler! ✨ Du bekommst die Glanz-Bosskarte." : "Die Boss-Karte liegt jetzt in deinem Album. Ohne Fehler gibt es die Glanzkarte.") : "Lies die Erklärungen in den Welten nochmal und versuch es erneut."}</p>
        <div class="acts" style="justify-content:center;display:flex;gap:8px;margin-top:10px">${win ? "" : '<button class="btn" type="button" data-a="again">↺ Nochmal</button>'}<button class="btn ghost" type="button" data-a="close">Schließen</button></div></div>`;
      box.querySelector(".end").onclick = e => { const a = e.target.closest("button"); if (!a) return; close(); if (a.dataset.a === "again") boss(k); else if (win) location.reload(); };
    }
    hud(); setTimeout(ask, 1400);
  }
  function bossCard(k){ const won = bossWon()[k], [img, name] = BOSSES[k];
    return `<span class="tcard bosscard ${won ? "got" : "lock"} ${won === "perfect" ? "shiny" : ""}"><span class="tn">B${k + 1}</span><span class="tart">${won ? art(img) : "?"}</span><b>${won ? name : "Boss " + (k + 1)}</b><small>${won === "perfect" ? "✨ Glanzkarte" : won ? "🏆 besiegt" : "Kapitel " + (k + 1)}</small></span>`; }

  // ---------- Spaß-Schicht: Level, Konfetti, Einblenden ----------
  const ICON = {eigenschaften: "⚔️", inflation: "🛒", halving: "⏳", hashing: "🧬", blockchain: "🔗", bahnhof: "🚉", seed: "🔑", betrug: "🕵️", sparplan: "🐷", lightning: "⚡", mining: "⛏", nodes: "🖥", schluessel: "🔐", utxo: "👛", wallets: "🗄", fomo: "🎢", hebel: "💥", geschichte: "📜", krypto: "🟠"};
  // Sats-Level nach geschafften Welten (angelehnt an die Bitcoin-Tierwelt von Garnele bis Wal)
  const LEVELS = [[0, "🦠", "Plankton", "plankton"], [1, "🦐", "Garnele", "shrimp"], [3, "🦀", "Krabbe", "crab"], [6, "🐟", "Fisch", "fish"], [9, "🐬", "Delfin", "dolphin"], [12, "🦈", "Hai", "shark"], [15, "🐳", "Buckelwal", "humpback"], [19, "🐋", "Wal", "whale"]];
  const count = s => PATH.filter(([id]) => done(s, id)).length;
  function level(n){ let L = LEVELS[0]; for (const l of LEVELS) if (n >= l[0]) L = l; return {n, ico: L[1], name: L[2], art: L[3]}; }
  const calm = false;   // Effekte immer zeigen; viele Firmen-PCs melden "Bewegung reduzieren", obwohl Animationen gewünscht sind
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
    el.className = "lvl"; el.href = here ? "../" : "#pth"; el.title = "Dein Sats-Level: mehr Welten schaffen, um aufzusteigen";
    el.innerHTML = `<span class="li">${art(L.art)}</span><span><b>${L.name}</b><small>${L.n} von ${PATH.length} Welten</small></span><i><u style="width:${L.n/PATH.length*100}%"></u></i>`;
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
    badge(); intro(); reveal(); guide();
    if (here && ICON[here]){ const h = document.querySelector("h1"); if (h && !h.previousElementSibling){ const i = document.createElement("span"); i.className = "wico"; i.setAttribute("aria-hidden", "true"); i.innerHTML = art(CARD[here]); h.before(i);
      const k = chapterOf(here), c = CHAPTERS[k], p = document.createElement("p"); p.className = "chap"; p.innerHTML = `Kapitel ${k + 1} · ${c[0]} ${c[1]} · Welt ${c[3].indexOf(here) + 1} von ${c[3].length}`; i.after(p); } }
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
  return {PATH, CHAPTERS, ART, art, BOSSES, boss, bossWon, bossCard, CARD, daily, streak, say, GK, chapterOf, LEVELS, level, count, load, done, visit, quiz, renderNext, nextAfter, sha256, confetti, toast};
})();
