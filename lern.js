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
                     : `<b>Stark, alle bisherigen Welten geschafft!</b><a href="${root}lernen/">Zur Übersicht →</a>`;
  }
  return {PATH, load, done, visit, quiz, renderNext, nextAfter};
})();
