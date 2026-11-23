/* =========================================================
   APP LOGIC — In de voetsporen van Jean de La Fontaine
   Vanilla JS · localStorage · geen build nodig
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- storage ---------------- */
  const LS = { profile: "flf_profile", progress: "flf_progress", board: "flf_leaderboard", teacher: "flf_teacher_device", videos: "flf_videos", docs: "flf_docs", feedback: "flf_feedback" };

  let pendingFeedbackCh = null; // check-in na H2/H4/H6

  /* ---------------- bestandsopslag (IndexedDB, voor grotere bestanden zoals pdf/video) ---------------- */
  const IDB = (function () {
    let dbp = null;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise(function (res, rej) {
        try {
          const r = indexedDB.open("flf_files", 1);
          r.onupgradeneeded = function () { r.result.createObjectStore("files"); };
          r.onsuccess = function () { res(r.result); };
          r.onerror = function () { rej(r.error); };
        } catch (e) { rej(e); }
      });
      return dbp;
    }
    return {
      put: function (key, blob) { return open().then(function (db) { return new Promise(function (res, rej) { const tx = db.transaction("files", "readwrite"); tx.objectStore("files").put(blob, key); tx.oncomplete = function () { res(); }; tx.onerror = function () { rej(tx.error); }; }); }); },
      get: function (key) { return open().then(function (db) { return new Promise(function (res, rej) { const tx = db.transaction("files", "readonly"); const rq = tx.objectStore("files").get(key); rq.onsuccess = function () { res(rq.result); }; rq.onerror = function () { rej(rq.error); }; }); }); },
      del: function (key) { return open().then(function (db) { return new Promise(function (res) { const tx = db.transaction("files", "readwrite"); tx.objectStore("files").delete(key); tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); }); }
    };
  })();
  function playFileModal(blob, name, kind) {
    const body = $("#modal-body"); body.innerHTML = "";
    const url = URL.createObjectURL(blob);
    body.append(h("h3", {}, (kind === "video" ? "🎬 " : "📄 ") + (name || "Bestand")));
    if (kind === "video") body.append(h("video", { src: url, controls: "", style: "max-width:100%;border-radius:10px;margin-top:8px" }));
    else body.append(h("a", { href: url, download: name || "bestand", class: "btn btn-gold", target: "_blank" }, "⬇️ Openen / downloaden"));
    $("#modal-root").classList.remove("hidden");
  }

  /* ---------------- tekst-naar-spraak (Frans voorlezen) ---------------- */
  function speak(text, lang) {
    try {
      if (!("speechSynthesis" in window)) { toast("Voorlezen wordt niet ondersteund in deze browser."); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const L = lang || "fr-FR";
      u.lang = L;
      u.rate = 0.9;
      const pref = L.slice(0, 2).toLowerCase();     // "fr" of "nl"
      const voices = window.speechSynthesis.getVoices();
      // kies een stem in de juiste taal; anders geen expliciete stem (u.lang stuurt de engine)
      const exact = voices.find((v) => v.lang && v.lang.toLowerCase().replace("_", "-") === L.toLowerCase());
      const same = voices.find((v) => v.lang && v.lang.toLowerCase().indexOf(pref) === 0);
      u.voice = exact || same || null;
      window.speechSynthesis.speak(u);
    } catch (e) { /* stil falen */ }
  }
  if ("speechSynthesis" in window) { window.speechSynthesis.onvoiceschanged = function () {}; }
  const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ---------------- docent-vergrendeling ----------------
     Alleen een apparaat waarop ooit de juiste docentcode is ingevoerd,
     mag de klassen-ranglijst resetten. De autorisatie wordt op DIT apparaat
     bewaard (localStorage). Andere laptops zonder de code kunnen niet resetten.
     Wijzig TEACHER_PIN in je eigen geheime code. */
  const TEACHER_PIN = "docent-2027";
  const isTeacher = () => load(LS.teacher, null) === "granted";
  function grantTeacherAccess() {
    const pin = window.prompt("Docentcode invoeren om dit apparaat te machtigen voor het resetten van de ranglijst:");
    if (pin == null) return;
    if (pin.trim() === TEACHER_PIN) {
      save(LS.teacher, "granted");
      toast("✅ Docentmodus geactiveerd op dit apparaat.");
      refreshDocentNav();
      go("docentbeheer");
    } else {
      toast("❌ Onjuiste docentcode.");
    }
  }

  const defaultProgress = () => ({ feathers: 0, badges: [], stepsDone: {}, answers: {}, product: null, streak: 0, ability: 0, routeLock: null, collection: { mots: [], animaux: [], morales: [], idees: [] } });

  /* ---------------- adaptief: vaardigheidsscore → leerroute ---------------- */
  const ABILITY_MIN = -6, ABILITY_MAX = 8;
  function levelForKey(key) {
    if (key === "steun") return { key: "steun", label: "🟢 Steun-route", cls: "lvl-a1", nl: "Rustig tempo met extra hulp", rec: "A1" };
    if (key === "uitdaging") return { key: "uitdaging", label: "🔴 Uitdaging-route", cls: "lvl-b1", nl: "Extra moeilijke opdrachten", rec: "B1" };
    return { key: "basis", label: "🟡 Basis-route", cls: "lvl-a2", nl: "Opdrachten op jouw niveau", rec: "A2" };
  }
  function abilityLevel() {
    if (progress && progress.routeLock) { const l = levelForKey(progress.routeLock); l.locked = true; return l; }
    const a = progress ? (progress.ability || 0) : 0;
    if (a <= -2) return levelForKey("steun");
    if (a >= 4) return levelForKey("uitdaging");
    return levelForKey("basis");
  }

  /* ---------------- streak: beloning bij X keer op rij meteen goed ---------------- */
  const STREAK_GOAL = 3;      // elke 3 keer meteen-goed op rij → bonus
  const STREAK_BONUS = 5;     // bonus-veren
  function registerFirstTry(ok) {
    if (!progress) return 0;
    if (ok) {
      progress.streak = (progress.streak || 0) + 1;
      progress.ability = Math.min(ABILITY_MAX, (progress.ability || 0) + 1);
      save(LS.progress, progress);
      refreshChrome();
      if (progress.streak % STREAK_GOAL === 0) streakReward(progress.streak);
    } else {
      progress.streak = 0;
      progress.ability = Math.max(ABILITY_MIN, (progress.ability || 0) - 1);
      save(LS.progress, progress);
      refreshChrome();
    }
    return progress.streak || 0;
  }
  function streakReward(n) {
    progress.feathers += STREAK_BONUS;
    save(LS.progress, progress);
    flyFeathers(6); syncBoard(); refreshChrome();
    setTimeout(function () {
      showModal("🔥", n + " keer op rij goed!",
        "<p>Je had <strong>" + n + " vragen meteen goed</strong> op rij! 🎉</p><p>Streak-bonus: <strong>+" + STREAK_BONUS + " veren</strong> 🪶</p><p>Blijf scherp voor de volgende bonus!</p>");
    }, 300);
  }

  /* ---------------- data-versie / eenmalige reset ----------------
     Verhoog DATA_VERSION om bij de volgende keer laden alle voortgang én
     de ranglijst op elk apparaat één keer schoon te vegen. */
  const DATA_VERSION = 5;
  (function migrate() {
    if (load("flf_version", 0) !== DATA_VERSION) {
      localStorage.removeItem(LS.profile);
      localStorage.removeItem(LS.progress);
      localStorage.removeItem(LS.board);
      save("flf_version", DATA_VERSION);
    }
  })();

  let profile = load(LS.profile, null);
  let progress = load(LS.progress, defaultProgress());
  let board = load(LS.board, null);
  if (!board) { board = seedBoard(); save(LS.board, board); }

  /* ---------------- verzameling voor de eigen fabel ---------------- */
  function getCollection() {
    if (!progress.collection) progress.collection = { mots: [], animaux: [], morales: [], idees: [] };
    ["mots", "animaux", "morales", "idees"].forEach((k) => { if (!progress.collection[k]) progress.collection[k] = []; });
    return progress.collection;
  }
  function inCollection(bucket, fr) { return getCollection()[bucket].some((x) => (x.fr || x) === fr); }
  function toggleCollection(bucket, item) {
    const col = getCollection();
    const fr = item.fr || item;
    const i = col[bucket].findIndex((x) => (x.fr || x) === fr);
    const added = i === -1;
    if (added) col[bucket].push(item); else col[bucket].splice(i, 1);
    save(LS.progress, progress);
    return added;
  }
  function collectionCount() { const c = getCollection(); return c.mots.length + c.animaux.length + c.morales.length + c.idees.length; }

  function seedBoard() {
    // Lege ranglijst: geen voorbeeld-klasgenoten. Spelers verschijnen zodra ze veren verdienen.
    return [];
  }

  /* ---------------- tiny DOM helper ---------------- */
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    props = props || {};
    for (const k in props) {
      const v = props[k];
      if (v == null) continue;
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "dataset") Object.assign(e.dataset, v);
      else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    }
    kids.flat().forEach((c) => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  const $ = (s, r) => (r || document).querySelector(s);
  const isImg = (a) => typeof a === "string" && a.slice(0, 5) === "data:";

  function avatarInto(node, a) {
    node.innerHTML = "";
    if (isImg(a)) node.append(h("img", { src: a, alt: "avatar" }));
    else node.textContent = a || "🙂";
  }

  /* ---------------- reward config ---------------- */
  const STEP_FEATHERS = { narrative: 2, quiz: 8, order: 8, match: 8, hotspots: 8, tour: 10, reflect: 6, writer: 12, commission: 12, product: 8, escape: 15, certificate: 20, perspective: 8, sort: 8, peertip: 6 };
  const TOTAL_STEPS = CHAPTERS.reduce((n, c) => n + c.steps.length, 0);

  /* ---------------- progress helpers ---------------- */
  const stepKey = (chId, i) => chId + ":" + i;
  const isStepDone = (chId, i) => !!progress.stepsDone[stepKey(chId, i)];
  const chapterDone = (ch) => ch.steps.every((_, i) => isStepDone(ch.id, i));
  const chapterProgressPct = (ch) => Math.round(ch.steps.filter((_, i) => isStepDone(ch.id, i)).length / ch.steps.length * 100);
  function chapterUnlocked(num) {
    if (isTeacher()) return true;            // docent navigeert vrij; leerlingen houden de vergrendeling
    if (num <= 1) return true;
    return chapterDone(CHAPTERS[num - 2]);
  }
  const stepsDoneCount = () => Object.keys(progress.stepsDone).filter((k) => progress.stepsDone[k]).length;

  function completeStep(ch, i, mistakes) {
    const key = stepKey(ch.id, i);
    if (progress.stepsDone[key]) return false;
    progress.stepsDone[key] = true;
    const step = ch.steps[i];
    let reward = STEP_FEATHERS[step.type] || 4;
    const tracked = (mistakes !== undefined && mistakes !== null);
    const m = mistakes || 0;
    if (tracked && m > 0) reward = Math.max(Math.ceil(reward * 0.4), reward - m * 2); // minder veren na fouten
    progress.feathers += reward;
    save(LS.progress, progress);
    flyFeathers(reward);
    if (!tracked) toast("🪶 +" + reward + " veren!");
    else if (m === 0) toast("🔥 Meteen goed! +" + reward + " veren");
    else toast("🪶 +" + reward + " veren (na " + m + " foutje" + (m > 1 ? "s" : "") + ")");
    syncBoard();
    refreshChrome();
    // sync voortgang naar Firestore (docent-volging)
    if (profile && typeof fbSaveProgress === "function") {
      fbSaveProgress(profile.name, profile.avatar, progress).catch(function() {});
    }
    // badge on chapter completion
    if (chapterDone(ch) && progress.badges.indexOf(ch.badge) === -1) {
      progress.badges.push(ch.badge);
      save(LS.progress, progress);
      syncBoard();
      const b = BADGES[ch.badge];
      setTimeout(() => {
        const next = CHAPTERS[ch.num]; // ch.num is 1-based → next index
        const extra = next ? "<p>Nieuw hoofdstuk ontgrendeld: <strong>" + next.num + ". " + next.title + "</strong></p>" : "";
        showModal("🎖️", "Badge verdiend!", "<p>Je hebt de badge <strong>" + b.icon + " " + b.name + "</strong> behaald!</p>" + extra);
      }, 500);
      // Pauzeherinnering na elk afgerond hoofdstuk (ADHD-vriendelijk)
      if (["ch2","ch4","ch6"].includes(ch.id)) {
        pendingFeedbackCh = ch.id;
      } else {
        setTimeout(() => showPauzeReminder(), 2200);
      }
    }
    return true;
  }

  /* ---------------- leaderboard sync ---------------- */
  function syncBoard() {
    if (!profile) return;
    const key = profile.name.trim().toLowerCase();
    let row = board.find((r) => !r.seed && r.name.trim().toLowerCase() === key && r.me);
    if (!row) { row = { me: true }; board.push(row); }
    row.name = profile.name;
    row.avatar = profile.avatar;
    row.feathers = progress.feathers;
    row.badges = progress.badges.length;
    save(LS.board, board);
  }

  /* ---------------- chrome (topbar, progress) ---------------- */
  function refreshChrome() {
    if (!profile) return;
    $("#chip-feathers").textContent = "🪶 " + progress.feathers;
    $("#chip-name").textContent = profile.name;
    avatarInto($("#chip-avatar"), profile.avatar);
    const cs = $("#chip-streak"), streak = progress.streak || 0;
    if (cs) { if (streak >= 2) { cs.textContent = "🔥 " + streak; cs.classList.remove("hidden"); } else { cs.classList.add("hidden"); } }
    const pct = Math.round(stepsDoneCount() / TOTAL_STEPS * 100);
    $("#global-progress-fill").style.width = pct + "%";
    $("#global-progress-label").textContent = pct + "%";
  }

  /* ---------------- effects ---------------- */
  function toast(msg) {
    const t = h("div", { class: "toast" }, msg);
    $("#toast-root").append(t);
    setTimeout(() => t.remove(), 3000);
  }
  function flyFeathers(n) {
    const chip = $("#chip-feathers");
    if (!chip) return;
    const r = chip.getBoundingClientRect();
    for (let i = 0; i < Math.min(n, 6); i++) {
      const f = h("div", { class: "feather-fly" }, "🪶");
      f.style.left = (r.left + r.width / 2) + "px";
      f.style.top = r.top + "px";
      f.style.animationDelay = (i * 90) + "ms";
      document.body.append(f);
      setTimeout(() => f.remove(), 1300);
    }
  }
  function showModal(emoji, title, bodyHtml) {
    const body = $("#modal-body");
    body.innerHTML = "";
    body.append(h("div", { class: "modal-emoji" }, emoji), h("h3", {}, title), h("div", { html: bodyHtml }));
    $("#modal-root").classList.remove("hidden");
  }
  function closeModal() {
    $("#modal-root").classList.add("hidden");
    if (pendingFeedbackCh) {
      const chId = pendingFeedbackCh;
      pendingFeedbackCh = null;
      setTimeout(() => showFeedbackModal(chId), 350);
    }
  }

  /* =========================================================
     ONBOARDING
     ========================================================= */
  function initOnboarding() {
    const grid = $("#avatar-grid");
    let chosen = null;
    grid.innerHTML = "";
    AVATARS.forEach((a) => {
      const btn = h("button", { class: "avatar-opt", type: "button" }, a);
      btn.addEventListener("click", () => { pick(a, btn); });
      grid.append(btn);
    });

    function pick(a, node) {
      chosen = a;
      grid.querySelectorAll(".avatar-opt").forEach((n) => n.classList.remove("selected"));
      if (node) node.classList.add("selected");
      validate();
    }

    const nameInput = $("#student-name");
    const startBtn = $("#start-journey");
    const upload = $("#avatar-upload");

    upload.addEventListener("change", () => {
      const file = upload.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) { $("#avatar-upload-name").textContent = "Kies een afbeelding."; return; }
      const reader = new FileReader();
      reader.onload = () => {
        chosen = reader.result;
        grid.querySelectorAll(".avatar-opt").forEach((n) => n.classList.remove("selected"));
        // show as extra selected tile
        let tile = grid.querySelector(".avatar-opt.upload-tile");
        if (!tile) { tile = h("button", { class: "avatar-opt upload-tile", type: "button" }); grid.prepend(tile); tile.addEventListener("click", () => pick(chosen, tile)); }
        avatarInto(tile, reader.result);
        tile.classList.add("selected");
        $("#avatar-upload-name").textContent = "Foto gekozen ✓";
        validate();
      };
      reader.readAsDataURL(file);
    });

    function validate() {
      startBtn.disabled = !(nameInput.value.trim().length >= 2 && chosen);
    }
    nameInput.addEventListener("input", validate);

    // prefill if editing
    if (profile) {
      nameInput.value = profile.name;
      chosen = profile.avatar;
      if (!isImg(profile.avatar)) {
        const match = [...grid.children].find((n) => n.textContent === profile.avatar);
        if (match) match.classList.add("selected");
      } else {
        const tile = h("button", { class: "avatar-opt upload-tile selected", type: "button" });
        avatarInto(tile, profile.avatar); grid.prepend(tile);
        tile.addEventListener("click", () => pick(chosen, tile));
      }
      validate();
    }

    startBtn.addEventListener("click", () => {
      const name = nameInput.value.trim();
      if (name.length < 2 || !chosen) { $("#onboarding-error").textContent = "Vul een naam in en kies een plaatje."; return; }
      profile = { name, avatar: chosen };
      save(LS.profile, profile);
      syncBoard();
      $("#screen-onboarding").classList.remove("active");
      $("#app-shell").classList.remove("hidden");
      showBanqueLauncher();
      refreshChrome();
      go("intro");
    });
  }

  function editProfile() {
    $("#app-shell").classList.add("hidden");
    $("#screen-onboarding").classList.add("active");
    initOnboarding();
    window.scrollTo(0, 0);
  }

  /* =========================================================
     ROUTER
     ========================================================= */
  let currentRoute = { name: null, param: null };
  let activeWorld = null;
  function go(name, param) {
    if (activeWorld) { try { activeWorld.dispose(); } catch (e) {} activeWorld = null; }
    currentRoute = { name: name, param: param };
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.nav === name));
    const view = $("#view");
    view.innerHTML = "";
    window.scrollTo(0, 0);
    if (name === "map") renderMap(view);
    else if (name === "dashboard") renderDashboard(view);
    else if (name === "leaderboard") renderLeaderboard(view);
    else if (name === "chapter") renderChapter(view, param);
    else if (name === "fables") renderFables(view);
    else if (name === "fable") renderFable(view, param);
    else if (name === "atelier") renderAtelier(view);
    else if (name === "videotheque") renderVideotheque(view);
    else if (name === "world") renderWorld(view);
    else if (name === "belevenis") launchImmersive(view, param);
    else if (name === "intro") renderIntro(view);
    else if (name === "klastips") renderKlastips(view);
    else if (name === "docentbeheer") renderDocentBeheer(view);
  }

  /* =========================================================
     INTRODUCTIE — Franse welkomstpagina A1/A2
     ========================================================= */
  const LS_INTRO = "flf_intro_tekst";
  function introDefaults() {
    return {
      jean: "Jean de La Fontaine était un écrivain français (1621–1695).\nIl a écrit des fables — des histoires courtes avec des animaux et une morale.\nDans cette app, tu vas le découvrir toi-même !",
      opdracht: "Fabels lezen in het Frans — met woordhulp en vragen.\nZelf bepalen wat de moraal betekent.\nJe eigen fabel schrijven in het Frans.",
      uitleg: "Ga naar de Leerreis — daar zie je de kaart met alle onderdelen.\nKlik op een fabel om hem te lezen. Beantwoord daarna de vragen.\nSchrijf je eigen fabel in het Atelier.\nVerdien punten en bekijk de Ranglijst."
    };
  }

  function renderIntro(view) {
    const saved = load(LS_INTRO, null);
    const data = saved || introDefaults();

    // helper: woordchip fr = nl
    function woordChip(fr, nl) {
      return h("span", { class: "intro-chip" },
        h("strong", {}, fr),
        h("span", {}, " = " + nl));
    }

    // --- DOCENT: bewerken knop ---
    if (isTeacher()) {
      const editBar = h("div", { style: "text-align:right;margin-bottom:8px" });
      const editBtn = h("button", { class: "btn", style: "font-size:.8rem;padding:5px 12px;background:var(--gold);color:#fff;border:none;border-radius:8px;cursor:pointer" }, "✏️ Intro bewerken");
      editBtn.addEventListener("click", function() { renderIntroEditor(view); });
      editBar.append(editBtn);
      view.append(editBar);
    }

    // --- HEADER ---
    view.append(h("div", { class: "intro-hero" },
      h("img", { src: "img/jean_portrait.jpg", alt: "Jean de La Fontaine", class: "intro-portrait" }),
      h("div", { class: "intro-hero-txt" },
        h("h1", { class: "intro-title" }, "Bienvenue !"),
        h("p",  { class: "intro-subtitle" }, "= Welkom !"))));

    // --- SECTIE 1: Kort over Jean ---
    const s1 = h("div", { class: "activity-card intro-section" });
    s1.append(h("h2", { class: "intro-h2" }, "🪶 Jean de La Fontaine"));
    data.jean.split("\n").forEach(function(zin) { if (zin.trim()) s1.append(h("p", { class: "intro-fr" }, zin)); });
    const chips1 = h("div", { class: "intro-chips" });
    chipsGet().forEach(function(p) { chips1.append(woordChip(p[0], p[1])); });
    s1.append(chips1);
    view.append(s1);

    // --- SECTIE 2: Jouw opdracht ---
    const s2 = h("div", { class: "activity-card intro-section" });
    s2.append(h("h2", { class: "intro-h2" }, "✏️ Ton travail — ", h("span", { class: "intro-h2-nl" }, "Jouw opdracht")));
    s2.append(h("p", { style: "margin-bottom:10px;font-size:.95rem;color:var(--ink)" }, "In deze app doe je drie dingen:"));
    const icoOpdracht = ["📚","💬","✒️"];
    data.opdracht.split("\n").forEach(function(regel, i) {
      if (!regel.trim()) return;
      const rij = h("div", { class: "intro-stap" });
      rij.append(
        h("div", { class: "intro-stap-num" }, icoOpdracht[i] || "•"),
        h("div", { class: "intro-stap-body" },
          h("p", { style: "font-size:.97rem;color:var(--ink);margin:0" }, regel)));
      s2.append(rij);
    });
    view.append(s2);

    // --- SECTIE 3: Hoe werkt de app ---
    const s3 = h("div", { class: "activity-card intro-section" });
    s3.append(h("h2", { class: "intro-h2" }, "🗺️ Comment ça marche ? — ", h("span", { class: "intro-h2-nl" }, "Hoe werkt de app?")));
    const icoUitleg = ["1","2","3","★"];
    data.uitleg.split("\n").forEach(function(regel, i) {
      if (!regel.trim()) return;
      const rij = h("div", { class: "intro-stap" });
      rij.append(
        h("div", { class: "intro-stap-num", style: "font-size:.8rem" }, icoUitleg[i] || "•"),
        h("div", { class: "intro-stap-body" },
          h("p", { style: "font-size:.97rem;color:var(--ink);margin:0" }, regel)));
      s3.append(rij);
    });
    view.append(s3);

    // --- AFSLUITING + KNOP ---
    const fin = h("div", { class: "intro-big" });
    fin.append(h("span", { class: "intro-fin" }, "Tu es prêt(e) ?  = Ben je klaar?"));
    fin.append(h("p", {}, "Klik op de knop en begin je leeravontuur!"));
    fin.append(h("button", { class: "btn btn-gold big", onClick: () => go("map") }, "🗺️ Commencer ! — Beginnen!"));
    view.append(fin);
  }

  function renderIntroEditor(view) {
    const data = load(LS_INTRO, null) || introDefaults();
    view.innerHTML = "";
    view.append(h("div", { class: "view-head" },
      h("h2", {}, "✏️ Intro bewerken"),
      h("p", {}, "Pas de tekst aan. Elke regel = één alinea of stap. Sla op om de wijzigingen te bewaren.")));

    function veld(label, key, rows) {
      const wrap = h("div", { class: "activity-card", style: "margin-bottom:16px" });
      wrap.append(h("label", { style: "font-weight:700;display:block;margin-bottom:6px;color:var(--royal)" }, label));
      const ta = h("textarea", { style: "width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--parchment-dark);border-radius:8px;font-family:var(--font-serif);font-size:.95rem;line-height:1.6;resize:vertical;min-height:" + (rows * 32) + "px" });
      ta.value = data[key];
      ta.dataset.key = key;
      wrap.append(ta);
      return wrap;
    }

    const form = h("div", {});
    form.append(veld("🪶 Over Jean (elke regel = één zin)", "jean", 4));
    form.append(veld("✏️ Jouw opdracht (elke regel = één stap)", "opdracht", 3));
    form.append(veld("🗺️ Hoe werkt de app? (elke regel = één stap)", "uitleg", 4));

    const btnBar = h("div", { style: "display:flex;gap:12px;margin-top:4px" });
    const saveBtn = h("button", { class: "btn btn-gold" }, "💾 Opslaan");
    const resetBtn = h("button", { class: "btn", style: "background:var(--wine);color:#fff" }, "↩️ Standaard herstellen");
    const cancelBtn = h("button", { class: "btn" }, "Annuleren");
    saveBtn.addEventListener("click", function() {
      const nieuw = {};
      form.querySelectorAll("textarea").forEach(function(ta) { nieuw[ta.dataset.key] = ta.value.trim(); });
      save(LS_INTRO, nieuw);
      toast("✅ Intro opgeslagen!");
      go("intro");
    });
    resetBtn.addEventListener("click", function() {
      save(LS_INTRO, introDefaults());
      toast("↩️ Standaardtekst hersteld.");
      go("intro");
    });
    cancelBtn.addEventListener("click", function() { go("intro"); });
    btnBar.append(saveBtn, resetBtn, cancelBtn);
    form.append(btnBar);
    view.append(form);
  }

  /* =========================================================
     KLASTIPS — gedeelde tips via Firestore
     ========================================================= */
  /* =========================================================
     DOCENTBEHEER — bewerkbaar door docent via PIN
     ========================================================= */
  const LS_DB = "flf_docentbeheer";
  const LS_VOCAB = "flf_vocab_overrides";
  const LS_CHIPS = "flf_intro_chips";

  // Debounced Firebase sync — zodat atelier-typing niet elke toetsaanslag synct
  let _fbSyncTimer = null;
  function scheduleFbSync() {
    if (!profile || typeof fbSaveProgress !== "function") return;
    clearTimeout(_fbSyncTimer);
    _fbSyncTimer = setTimeout(function() {
      fbSaveProgress(profile.name, profile.avatar, progress).catch(function() {});
    }, 4000); // 4 seconden na laatste toetsaanslag
  }

  function vocabGet(fabelId) {
    const all = load(LS_VOCAB, {});
    return all[fabelId] || null;
  }
  function vocabToText(arr) { return arr.map(function(p) { return p[0] + " = " + p[1]; }).join("\n"); }
  function vocabFromText(txt) {
    return txt.split("\n").map(function(r) { return r.trim(); }).filter(Boolean).map(function(r) {
      const i = r.indexOf("="); if (i < 0) return null;
      return [r.slice(0, i).trim(), r.slice(i + 1).trim()];
    }).filter(Boolean);
  }
  function chipsGet() {
    return load(LS_CHIPS, null) || [["un écrivain","een schrijver"],["des fables","fabels"],["des animaux","dieren"],["une morale","een moraal"],["découvrir","ontdekken"]];
  }
  function dbDefaults() {
    return {
      aankondiging: "",
      atelierOpdracht: "Volg de 7 stappen. Bij elke stap krijg je Franse voorbeeldwoorden en -zinnen. Zo schrijf je zelf, zonder Translate.",
      leerreisBericht: ""
    };
  }
  function dbGet() { return Object.assign({}, dbDefaults(), load(LS_DB, {})); }

  function renderDocentBeheer(view) {
    if (!isTeacher()) { go("map"); return; }
    const data = dbGet();
    const introData = load(LS_INTRO, null) || introDefaults();

    view.append(h("div", { class: "view-head" },
      h("h2", {}, "🛠️ Docentbeheer"),
      h("p", {}, "Pas teksten en instructies aan voor de hele app. Wijzigingen zijn zichtbaar voor alle leerlingen op dit apparaat.")));

    function sectie(titel, uitleg, fields) {
      const card = h("div", { class: "activity-card", style: "margin-bottom:20px" });
      card.append(h("h3", { style: "color:var(--royal);margin:0 0 4px" }, titel));
      card.append(h("p", { style: "font-size:.85rem;color:var(--ink-soft);margin:0 0 14px" }, uitleg));
      fields.forEach(function(f) {
        const lbl = h("label", { style: "font-weight:600;font-size:.88rem;display:block;margin-bottom:4px;color:var(--ink)" }, f.label);
        const ta = h("textarea", { style: "width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid var(--parchment-dark);border-radius:8px;font-family:var(--font-serif);font-size:.93rem;line-height:1.6;resize:vertical;min-height:" + (f.rows * 30) + "px;margin-bottom:12px" });
        ta.value = f.value;
        ta.dataset.veld = f.key;
        ta.dataset.store = f.store;
        card.append(lbl, ta);
      });
      return card;
    }

    const form = h("div", {});

    // Intro pagina
    form.append(sectie("ℹ️ Intropagina", "Tekst op de welkomstpagina. Elke regel = één alinea of stap.", [
      { label: "Over Jean (elke regel = 1 zin)", key: "jean", store: "intro", value: introData.jean, rows: 4 },
      { label: "Jouw opdracht (elke regel = 1 stap)", key: "opdracht", store: "intro", value: introData.opdracht, rows: 3 },
      { label: "Hoe werkt de app? (elke regel = 1 stap)", key: "uitleg", store: "intro", value: introData.uitleg, rows: 4 }
    ]));

    // Leerreis
    form.append(sectie("🗺️ Leerreis", "Optionele aankondiging bovenaan de leerreis-pagina (laat leeg om te verbergen).", [
      { label: "Aankondiging / bericht aan leerlingen", key: "leerreisBericht", store: "db", value: data.leerreisBericht, rows: 2 }
    ]));

    // Atelier
    form.append(sectie("✒️ Atelier", "De instructietekst bovenaan het schrijfatelier.", [
      { label: "Atelier-opdracht (intro-tekst)", key: "atelierOpdracht", store: "db", value: data.atelierOpdracht, rows: 3 }
    ]));

    // Aankondiging (globaal)
    form.append(sectie("📢 Globale aankondiging", "Verschijnt bovenaan elke pagina als een gekleurde balk (laat leeg om te verbergen).", [
      { label: "Aankondiging voor alle pagina's", key: "aankondiging", store: "db", value: data.aankondiging, rows: 2 }
    ]));

    // Intro woordchips
    const chipsCard = h("div", { class: "activity-card", style: "margin-bottom:20px" });
    chipsCard.append(h("h3", { style: "color:var(--royal);margin:0 0 4px" }, "🏷️ Woordchips op de intropagina"));
    chipsCard.append(h("p", { style: "font-size:.85rem;color:var(--ink-soft);margin:0 0 10px" }, "Elke regel: Frans woord = Nederlandse vertaling"));
    const chipsTA = h("textarea", { style: "width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid var(--parchment-dark);border-radius:8px;font-family:var(--font-serif);font-size:.93rem;line-height:1.6;resize:vertical;min-height:120px" });
    chipsTA.value = vocabToText(chipsGet());
    chipsTA.dataset.store = "chips";
    chipsCard.append(chipsTA);
    form.append(chipsCard);

    // Fabel vocab
    const vocabCard = h("div", { class: "activity-card", style: "margin-bottom:20px" });
    vocabCard.append(h("h3", { style: "color:var(--royal);margin:0 0 4px" }, "📚 Woordhulp per fabel"));
    vocabCard.append(h("p", { style: "font-size:.85rem;color:var(--ink-soft);margin:0 0 14px" }, "Elke regel: Frans woord = Nederlandse vertaling. Laat een fabel leeg om de standaardwoorden te gebruiken."));
    const vocabTAs = {};
    FABLES.forEach(function(f) {
      const lbl = h("label", { style: "font-weight:600;font-size:.88rem;display:block;margin-bottom:4px;color:var(--ink)" }, f.titleNl + " (" + f.titleFr + ")");
      const override = vocabGet(f.id);
      const ta = h("textarea", { style: "width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid var(--parchment-dark);border-radius:8px;font-family:var(--font-serif);font-size:.93rem;line-height:1.6;resize:vertical;min-height:120px;margin-bottom:14px" });
      ta.value = vocabToText(override || f.vocab);
      ta.dataset.fabelId = f.id;
      ta.dataset.store = "vocab";
      vocabTAs[f.id] = ta;
      vocabCard.append(lbl, ta);
    });
    form.append(vocabCard);

    const btnBar = h("div", { style: "display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;margin-bottom:32px" });
    const saveBtn = h("button", { class: "btn btn-gold" }, "💾 Alles opslaan");
    const resetBtn = h("button", { class: "btn", style: "background:var(--wine);color:#fff" }, "↩️ Alles herstellen");
    saveBtn.addEventListener("click", function() {
      const nieuwIntro = Object.assign({}, load(LS_INTRO, null) || introDefaults());
      const nieuwDB = dbGet();
      const nieuwVocab = load(LS_VOCAB, {});
      form.querySelectorAll("textarea").forEach(function(ta) {
        if (ta.dataset.store === "intro") nieuwIntro[ta.dataset.veld] = ta.value.trim();
        else if (ta.dataset.store === "db") nieuwDB[ta.dataset.veld] = ta.value.trim();
        else if (ta.dataset.store === "chips") save(LS_CHIPS, vocabFromText(ta.value));
        else if (ta.dataset.store === "vocab") nieuwVocab[ta.dataset.fabelId] = vocabFromText(ta.value);
      });
      save(LS_INTRO, nieuwIntro);
      save(LS_DB, nieuwDB);
      save(LS_VOCAB, nieuwVocab);
      updateAankondiging();
      toast("✅ Wijzigingen opgeslagen!");
    });
    resetBtn.addEventListener("click", function() {
      if (!confirm("Weet je zeker dat je alles wilt terugzetten naar de standaardtekst?")) return;
      save(LS_INTRO, introDefaults());
      save(LS_DB, dbDefaults());
      localStorage.removeItem(LS_VOCAB);
      localStorage.removeItem(LS_CHIPS);
      updateAankondiging();
      toast("↩️ Standaardtekst hersteld.");
      go("docentbeheer");
    });
    btnBar.append(saveBtn, resetBtn);
    form.append(btnBar);
    view.append(form);

    // ── Leerlingen sectie ─────────────────────────────────
    const leerlingenCard = h("div", { class: "db-card", style: "margin-top:28px" });
    const leerlingenHead = h("div", { style: "display:flex;align-items:center;gap:10px;margin-bottom:14px" },
      h("h2", { style: "color:var(--royal);margin:0" }, "👥 Leerlingenvoortgang"),
      h("button", { class: "btn btn-ghost small", id: "btn-refresh-leerlingen" }, "🔄 Vernieuwen")
    );
    leerlingenCard.append(leerlingenHead);
    const leerlingenBody = h("div", { id: "leerlingen-body" },
      h("p", { style: "color:var(--ink-soft);font-style:italic" }, "Laden…")
    );
    leerlingenCard.append(leerlingenBody);
    view.append(leerlingenCard);

    function renderLeerlingenTable(data) {
      leerlingenBody.innerHTML = "";
      if (!data || data.length === 0) {
        leerlingenBody.append(h("p", { style: "color:var(--ink-soft);font-style:italic" }, "Nog geen leerlingen actief."));
        return;
      }
      data.forEach(function(leerling) {
        const stappen = Object.keys(leerling.stepsDone || {}).filter(function(k) { return leerling.stepsDone[k]; }).length;
        const kaart = h("div", { style: "border:1px solid var(--parchment-dark);border-radius:12px;padding:14px;margin-bottom:12px;background:var(--parchment)" });

        // Header rij
        const headerRij = h("div", { style: "display:flex;align-items:center;gap:10px;cursor:pointer" });
        const avatarSpan = h("span", { style: "font-size:1.4rem" }, leerling.avatar || "🙂");
        const naamSpan = h("strong", {}, leerling.name || "?");
        const verenSpan = h("span", { style: "color:var(--gold);font-weight:600" }, "🪶 " + (leerling.feathers || 0));
        const stappenSpan = h("span", { style: "color:var(--ink-soft);font-size:.85rem" }, stappen + " stap" + (stappen !== 1 ? "pen" : "") + " klaar");
        const toggleBtn = h("button", { class: "btn btn-ghost small", style: "margin-left:auto" }, "▼ Details");
        headerRij.append(avatarSpan, naamSpan, verenSpan, stappenSpan, toggleBtn);

        // Detail sectie (verborgen bij start)
        const detailSectie = h("div", { style: "display:none;margin-top:12px;border-top:1px solid var(--parchment-dark);padding-top:12px" });

        // Geschreven fabel
        const atelierTekst = [
          leerling.answers && leerling.answers["atelier:titre"] ? "📌 " + leerling.answers["atelier:titre"] : null,
          leerling.answers && leerling.answers["atelier:pers"] ? "Personages: " + leerling.answers["atelier:pers"] : null,
          leerling.answers && leerling.answers["atelier:prob"] ? leerling.answers["atelier:prob"] : null,
          leerling.answers && leerling.answers["atelier:fin"] ? leerling.answers["atelier:fin"] : null,
          leerling.answers && leerling.answers["atelier:mfr"] ? "Morale: " + leerling.answers["atelier:mfr"] : null,
        ].filter(Boolean).join("\n");

        if (atelierTekst) {
          detailSectie.append(
            h("h4", { style: "color:var(--royal);margin:0 0 6px" }, "✒️ Geschreven fabel"),
            h("pre", { style: "white-space:pre-wrap;background:#fff8f0;padding:10px;border-radius:8px;font-size:.85rem;line-height:1.5;border:1px solid var(--parchment-dark);margin:0 0 12px" }, atelierTekst)
          );
        }

        // Reflecties / open antwoorden
        const reflectAntwoorden = Object.keys(leerling.answers || {}).filter(function(k) {
          return /:r\d+$/.test(k) && leerling.answers[k] && leerling.answers[k].trim();
        });
        if (reflectAntwoorden.length > 0) {
          const reflectDiv = h("div", {});
          reflectDiv.append(h("h4", { style: "color:var(--royal);margin:0 0 6px" }, "💬 Reflecties"));
          const ul = h("ul", { style: "margin:0 0 12px;padding-left:18px;font-size:.85rem;line-height:1.6" });
          reflectAntwoorden.forEach(function(k) { ul.append(h("li", {}, leerling.answers[k])); });
          reflectDiv.append(ul);
          detailSectie.append(reflectDiv);
        }

        // Peertips
        const peertipKeys = Object.keys(leerling.answers || {}).filter(function(k) { return k.startsWith("peertip_") && leerling.answers[k] && leerling.answers[k].trim(); });
        if (peertipKeys.length > 0) {
          const ptDiv = h("div", {});
          ptDiv.append(h("h4", { style: "color:var(--royal);margin:0 0 6px" }, "💡 Peertips"));
          const ul = h("ul", { style: "margin:0 0 12px;padding-left:18px;font-size:.85rem;line-height:1.6" });
          peertipKeys.forEach(function(k) { ul.append(h("li", {}, leerling.answers[k])); });
          ptDiv.append(ul);
          detailSectie.append(ptDiv);
        }

        if (!atelierTekst && reflectAntwoorden.length === 0 && peertipKeys.length === 0) {
          detailSectie.append(h("p", { style: "color:var(--ink-soft);font-style:italic;font-size:.85rem" }, "Nog geen open antwoorden ingevuld."));
        }

        // Verwijder-knop (docent kan leerling resetten)
        const verwijderBtn = h("button", { class: "btn btn-ghost small", style: "color:#c0392b;border-color:#c0392b;margin-top:8px" }, "🗑 Verwijder uit overzicht");
        verwijderBtn.addEventListener("click", function() {
          if (!confirm("Verwijder " + leerling.name + " uit het docent-overzicht?")) return;
          if (typeof fbDeleteProgress === "function") {
            fbDeleteProgress(leerling.name).then(function() {
              toast("🗑 " + leerling.name + " verwijderd.");
              kaart.remove();
            }).catch(function() { toast("Verwijderen mislukt."); });
          }
        });
        detailSectie.append(verwijderBtn);

        // Toggle
        let open = false;
        headerRij.addEventListener("click", function() {
          open = !open;
          detailSectie.style.display = open ? "block" : "none";
          toggleBtn.textContent = open ? "▲ Sluiten" : "▼ Details";
        });

        kaart.append(headerRij, detailSectie);
        leerlingenBody.append(kaart);
      });
    }

    // Laad leerlingendata
    function laadLeerlingen() {
      leerlingenBody.innerHTML = "<p style='color:var(--ink-soft);font-style:italic'>Laden…</p>";
      if (typeof fbLoadAllProgress !== "function") {
        leerlingenBody.innerHTML = "<p style='color:#c0392b'>Firebase niet beschikbaar.</p>";
        return;
      }
      fbLoadAllProgress().then(function(data) {
        renderLeerlingenTable(data);
      }).catch(function() {
        leerlingenBody.innerHTML = "<p style='color:#c0392b'>Kon leerlingendata niet laden.</p>";
      });
    }

    document.getElementById("btn-refresh-leerlingen").addEventListener("click", laadLeerlingen);
    laadLeerlingen();
  }

  function updateAankondiging() {
    const tekst = dbGet().aankondiging || "";
    let balk = document.getElementById("docent-aankondiging");
    if (!tekst) { if (balk) balk.remove(); return; }
    if (!balk) {
      balk = document.createElement("div");
      balk.id = "docent-aankondiging";
      balk.style.cssText = "background:var(--gold);color:#fff;text-align:center;padding:8px 16px;font-family:var(--font-ui);font-size:.9rem;font-weight:600;position:sticky;top:0;z-index:900";
      const shell = document.getElementById("app-shell");
      if (shell) shell.prepend(balk); else document.body.prepend(balk);
    }
    balk.textContent = "📢 " + tekst;
  }

  function renderKlastips(view) {
    view.append(h("div", { class: "view-head" },
      h("h2", {}, "💬 Klastips"),
      h("p", {}, "Hier staan alle schrijftips van jouw klasgenoten. Lees ze en leer van elkaar!")
    ));

    const wrap = h("div", { class: "klastips-wrap" });
    const loading = h("p", { class: "peertips-loading" }, "📚 Tips laden...");
    wrap.append(loading);
    view.append(wrap);

    if (typeof fbLoadPeertips !== "function") {
      loading.textContent = "Verbinding met de klas niet beschikbaar.";
      return;
    }

    fbLoadPeertips().then(function(tips) {
      wrap.innerHTML = "";
      if (!tips || !tips.length) {
        wrap.append(h("p", { class: "peertips-empty" }, "Nog geen tips geplaatst. Wees de eerste!"));
        return;
      }
      tips.forEach(function(t) {
        const item = h("div", { class: "klastip-card parchment" });
        item.append(
          h("span", { class: "peertip-name" }, "✒️ " + (t.name || "Anoniem")),
          h("p", { class: "peertip-text" }, t.tip)
        );
        wrap.append(item);
      });
    }).catch(function() {
      wrap.innerHTML = "<p class='peertips-empty'>Tips ophalen mislukt. Controleer je verbinding.</p>";
    });
  }

  /* =========================================================
     MAP / LEERREIS
     ========================================================= */
  function renderMap(view) {
    const leerreisBericht = dbGet().leerreisBericht;
    if (leerreisBericht) {
      view.append(h("div", { style: "background:var(--royal);color:#fff;border-radius:12px;padding:12px 18px;margin-bottom:14px;font-family:var(--font-ui);font-size:.93rem" },
        h("strong", {}, "📢 "), leerreisBericht));
    }
    view.append(h("div", { class: "view-head" },
      h("h2", {}, "🗺️ Jouw leerreis"),
      h("p", {}, "Volg het pad van Jean de La Fontaine. Voltooi elk hoofdstuk om het volgende te ontgrendelen.")
    ));
    const path = h("div", { class: "map-path" });
    CHAPTERS.forEach((ch) => {
      const unlocked = chapterUnlocked(ch.num);
      const done = chapterDone(ch);
      const pct = chapterProgressPct(ch);
      const b = BADGES[ch.badge];
      const card = h("div", { class: "chapter-card " + (done ? "done " : "") + (unlocked ? "unlocked" : "locked") },
        h("div", { class: "chapter-emblem" }, h("span", { class: "ch-num" }, ch.num), ch.emoji),
        h("div", { class: "chapter-info" },
          h("h3", {}, ch.title),
          h("p", { class: "ch-goal" }, ch.goal),
          h("div", { class: "chapter-badgeline" },
            h("div", { class: "mini-bar" }, h("i", { style: "width:" + pct + "%" })),
            h("span", {}, pct + "%"),
            h("span", {}, "· Badge: " + b.icon + " " + b.name)
          )
        ),
        h("div", { class: "chapter-cta" },
          h("span", { class: "status-pill " + (done ? "done" : unlocked ? "open" : "locked") }, done ? "Voltooid ✓" : unlocked ? "Beschikbaar" : "🔒 Op slot"),
          unlocked
            ? h("button", { class: "btn " + (done ? "btn-ghost" : "btn-gold") + " small", onClick: () => go("chapter", ch.num) }, done ? "Herbekijk" : "Start")
            : h("span", { class: "lock-hint", style: "font-size:.78rem;color:#7a684a" }, "Rond H" + (ch.num - 1) + " af")
        )
      );
      path.append(card);
    });
    view.append(path);
  }

  /* =========================================================
     CHAPTER VIEW
     ========================================================= */
  function renderChapter(view, num) {
    const ch = CHAPTERS[num - 1];
    if (!chapterUnlocked(ch.num)) { go("map"); return; }
    let cur = ch.steps.findIndex((_, i) => !isStepDone(ch.id, i));
    if (cur === -1) cur = 0;

    view.append(h("button", { class: "back-link", onClick: () => go("map") }, "← Terug naar de leerreis"));
    view.append(h("div", { class: "chapter-hero" },
      h("span", { class: "hero-emoji" }, ch.emoji),
      h("h2", {}, "Hoofdstuk " + ch.num + " · " + ch.title),
      h("p", { class: "hero-sub" }, ch.subtitle)
    ));

    // immersieve belevenis van dit hoofdstuk
    if (IMMERSIVE["ch" + ch.num]) {
      const btns = h("div", { class: "chapter-belevenis" },
        h("button", { class: "btn btn-gold", onClick: () => go("belevenis", "ch" + ch.num) },
          (IMMERSIVE["ch" + ch.num].pano ? "🌐 Betreed de 360°-belevenis" : "🏛️ Betreed de belevenis")));
      if (ch.num === 2) btns.append(h("a", { class: "btn btn-ghost small", href: "https://en.chateauversailles.fr/discover/resources/360deg-virtual-tours", target: "_blank", rel: "noopener" }, "🔗 Officiële 360°-tour van Versailles"));
      view.append(btns);
    }

    const tracker = h("div", { class: "step-tracker" });
    const host = h("div", {});
    view.append(tracker, host);

    function drawTracker() {
      tracker.innerHTML = "";
      ch.steps.forEach((s, i) => {
        const dot = h("div", { class: "step-dot " + (i === cur ? "active " : "") + (isStepDone(ch.id, i) ? "done" : "") },
          (isStepDone(ch.id, i) ? "✓ " : (i + 1) + ". ") + shortType(s));
        dot.addEventListener("click", () => { cur = i; drawTracker(); drawStep(); });
        tracker.append(dot);
      });
    }
    function drawStep() {
      host.innerHTML = "";
      const step = ch.steps[cur];
      const done = isStepDone(ch.id, cur);
      const onDone = () => {
        const wasNew = completeStep(ch, cur);
        drawTracker();
        // advance
        const nextUndone = ch.steps.findIndex((_, i) => !isStepDone(ch.id, i));
        if (nextUndone !== -1) { cur = nextUndone; drawTracker(); drawStep(); }
        else { drawStep(); if (wasNew) showChapterComplete(ch); }
      };
      host.append(RENDER[step.type](step, ch, cur, done, onDone));
      // continue button for narrative-like already-done
      drawTracker();
    }
    drawTracker();
    drawStep();
  }

  function shortType(s) {
    return ({ narrative: "Intro", quiz: "Quiz", order: "Tijdlijn", match: "Koppel", hotspots: "Zoek", tour: "Belevenis", reflect: "Reflectie", writer: "Schrijf", commission: "Commissie", product: "Publiceer", escape: "Escape", certificate: "Certificaat" })[s.type] || "Stap";
  }

  function showChapterComplete(ch) {
    if (ch.num < 6) {
      showModal("🏆", "Hoofdstuk voltooid!", "<p>Je hebt <strong>Hoofdstuk " + ch.num + "</strong> afgerond. Ga terug naar de leerreis voor het volgende avontuur!</p>");
    }
  }

  /* =========================================================
     RENDERERS PER ACTIVITY TYPE
     ========================================================= */
  const RENDER = {};

  function jeanSay(paras) {
    return h("div", { class: "jean-say" },
      h("div", { class: "mini-avatar" }, h("img", { src: "img/jean_portrait.jpg", alt: "Jean de La Fontaine" })),
      h("div", { class: "say-text", html: paras.map((p) => "<p style='margin:.3em 0'>" + p + "</p>").join("") })
    );
  }
  function completeBtn(label, done, onDone, extraDisabled) {
    if (done) return h("div", { style: "text-align:center;margin-top:14px" }, h("span", { class: "status-pill done" }, "✓ Voltooid"));
    return h("button", { class: "btn btn-gold big block", disabled: extraDisabled ? "" : null, onClick: onDone }, label);
  }

  /* ---- narrative ---- */
  RENDER.narrative = function (step, ch, idx, done, onDone) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, step.title), jeanSay(step.jean));

    // Afbeeldingen
    if (step.images && step.images.length) {
      const gallery = h("div", { class: "narrative-gallery" });
      step.images.forEach((im) => {
        gallery.append(h("figure", { class: "narrative-figure" },
          h("img", { src: im.src, alt: im.cap || "", loading: "lazy" }),
          im.cap ? h("figcaption", {}, im.cap) : null));
      });
      card.append(gallery);
    }

    // Leesfragment met niveaulaag-toggle
    if (step.readText) {
      let showSimple = false;
      const textWrap = h("div", { class: "read-block" });
      function renderReadText() {
        textWrap.innerHTML = "";
        const src = showSimple ? step.readTextSimple : step.readText;
        const frag = h("div", { class: "read-fragment" + (showSimple ? " is-simple" : ""), html: src });
        textWrap.append(frag);
        if (step.readTextSimple) {
          if (!showSimple) {
            const sBtn = h("button", { class: "btn-simple-toggle" }, "📖 Te moeilijk? Lees de makkelijkere versie");
            sBtn.addEventListener("click", function() { showSimple = true; renderReadText(); });
            textWrap.append(sBtn);
          } else {
            const oBtn = h("button", { class: "btn-simple-toggle is-back" }, "↩️ Terug naar de originele tekst");
            oBtn.addEventListener("click", function() { showSimple = false; renderReadText(); });
            textWrap.append(oBtn);
          }
        }
      }
      renderReadText();
      card.append(textWrap);
    }

    // Begripsvragen — Verder alleen actief na alle goede antwoorden
    if (step.check && step.check.length && !done) {
      let answeredCount = 0;
      const checkWrap = h("div", { class: "read-check" });
      const weitBtn = h("button", { class: "btn btn-gold big block", style: "margin-top:16px" }, "Verder ✒️");
      weitBtn.disabled = true;
      weitBtn.addEventListener("click", function() { onDone(); });

      step.check.forEach(function(q) {
        const qBlock = h("div", { class: "check-q" });
        qBlock.append(h("span", { class: "check-label" }, q.v));
        const optsWrap = h("div", { class: "check-opts" });
        let solved = false;
        q.options.forEach(function(opt, oi) {
          const btn = h("button", { class: "check-opt" }, opt);
          btn.addEventListener("click", function() {
            if (solved) return;
            if (oi === q.correct) {
              solved = true;
              btn.classList.add("correct");
              optsWrap.querySelectorAll(".check-opt").forEach(function(b) { b.disabled = true; });
              answeredCount++;
              if (answeredCount === step.check.length) { weitBtn.disabled = false; }
            } else {
              btn.classList.add("wrong");
              setTimeout(function() { btn.classList.remove("wrong"); }, 500);
            }
          });
          optsWrap.append(btn);
        });
        qBlock.append(optsWrap);
        checkWrap.append(qBlock);
      });
      card.append(checkWrap, weitBtn);
    } else {
      card.append(completeBtn("Verder ✒️", done, onDone));
    }

    return card;
  };


  /* ---- perspective (keuzepad) ---- */
  RENDER.perspective = function (step, ch, idx, done, onDone) {
    const card = h("div", { class: "activity-card" });
    card.append(h("h3", {}, step.title));
    card.append(h("p", { class: "step-intro" }, step.intro));

    let chosen = null;
    let mistakes = 0;

    const optWrap = h("div", { class: "perspective-options" });
    const questionArea = h("div", { class: "perspective-questions hidden" });
    card.append(optWrap, questionArea);

    if (done) {
      card.append(h("div", { style: "text-align:center;margin-top:14px" }, h("span", { class: "status-pill done" }, "✓ Voltooid")));
      return card;
    }

    step.options.forEach(function(opt) {
      const optCard = h("div", { class: "perspective-card" },
        h("div", { class: "perspective-label" }, opt.label),
        h("div", { class: "perspective-fr" }, opt.fr),
        h("div", { class: "perspective-desc" }, opt.desc)
      );
      optCard.addEventListener("click", function() {
        if (chosen) return;
        chosen = opt;
        optWrap.querySelectorAll(".perspective-card").forEach(function(c) {
          c.classList.toggle("selected", c === optCard);
          c.classList.toggle("dimmed", c !== optCard);
        });
        buildQuestions(opt);
        questionArea.classList.remove("hidden");
      });
      optWrap.append(optCard);
    });

    function buildQuestions(opt) {
      questionArea.innerHTML = "";
      const roleTag = h("div", { class: "perspective-role-tag" }, "Jouw rol: " + opt.label);
      questionArea.append(roleTag);

      let answered = 0;
      opt.questions.forEach(function(q, qi) {
        const qBlock = h("div", { class: "q-block" });
        qBlock.append(h("p", { class: "q-text" }, (qi + 1) + ". " + q.q));
        const btnRow = h("div", { class: "options-grid" });
        let solved = false;
        q.options.forEach(function(opt_txt, oi) {
          const btn = h("button", { class: "option-btn" }, opt_txt);
          btn.addEventListener("click", function() {
            if (solved) return;
            if (oi === q.answer) {
              solved = true;
              btn.classList.add("correct");
              btnRow.querySelectorAll(".option-btn").forEach(function(b) { b.disabled = true; });
              const exp = h("p", { class: "explain-text" }, "✓ " + q.explain);
              qBlock.append(exp);
              answered++;
              if (answered === opt.questions.length) {
                const finBtn = h("button", { class: "btn btn-gold big block", style: "margin-top:16px" }, "Voltooid ✒️");
                finBtn.addEventListener("click", function() { onDone(mistakes); });
                questionArea.append(finBtn);
              }
            } else {
              mistakes++;
              btn.classList.add("wrong");
              setTimeout(function() { btn.classList.remove("wrong"); }, 500);
            }
          });
          btnRow.append(btn);
        });
        qBlock.append(btnRow);
        questionArea.append(qBlock);
      });
    }

    return card;
  };

  /* ---- quiz ---- */
  function normAns(s) { return (s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[«».,!?;:'’]/g, ""); }
  function penaltyShuffle(s) { const a = s.split(""); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a.join(""); }
  function penaltyScramble(s) { return s.replace(/\S+/g, function (w) { return w.length > 1 ? penaltyShuffle(w) : w; }); }
  function penaltyGaps(s) { return s.replace(/\S+/g, function (w) { if (w.length <= 3) return w; let o = w[0]; for (let i = 1; i < w.length - 1; i++) { o += /[0-9a-zà-ÿœæ]/i.test(w[i]) ? "·" : w[i]; } return o + w[w.length - 1]; }); }
  // Verschillende "leermoment"-opdrachten bij een fout (à la Blooket). Kiest willekeurig een variant.
  function buildPenalty(correctText, explain, onCleared) {
    const box = h("div", { class: "penalty-box" });
    const kinds = ["type", "scramble", "gaps", "timer", "read"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    function fail(inp) { if (inp) { inp.classList.add("penalty-wrong"); setTimeout(function () { inp.classList.remove("penalty-wrong"); }, 500); } toast("Nog niet precies — probeer nog eens."); }
    function typingUI(title, hintNode) {
      box.append(h("div", { class: "penalty-title" }, title));
      if (hintNode) box.append(hintNode);
      const inp = h("input", { class: "text-input penalty-input", placeholder: "Typ hier...", autocomplete: "off" });
      const chk = h("button", { class: "btn btn-gold small" }, "Controleer ✍️");
      chk.addEventListener("click", function () { if (normAns(inp.value) === normAns(correctText)) onCleared(); else fail(inp); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") chk.click(); });
      box.append(h("div", { class: "penalty-row" }, inp, chk));
      setTimeout(function () { inp.focus(); }, 30);
    }
    if (kind === "type") {
      typingUI("✍️ Leermoment — schrijf het juiste antwoord over:", h("div", { class: "penalty-answer" }, "« " + correctText + " »"));
    } else if (kind === "scramble") {
      typingUI("🔤 Leermoment — de letters staan door elkaar. Typ het juiste antwoord:", h("div", { class: "penalty-answer scrambled" }, penaltyScramble(correctText)));
    } else if (kind === "gaps") {
      typingUI("🧩 Leermoment — vul aan en typ het volledige antwoord:", h("div", { class: "penalty-answer scrambled" }, penaltyGaps(correctText)));
    } else if (kind === "timer") {
      box.append(h("div", { class: "penalty-title" }, "⏳ Time-out! Denk goed na."));
      const msg = h("div", { class: "penalty-answer" }, "");
      const btn = h("button", { class: "btn btn-gold small", disabled: "" }, "Verder");
      box.append(msg, h("div", { class: "penalty-row" }, btn));
      let n = 4; msg.textContent = "Wacht " + n + " seconden en denk na over het juiste antwoord...";
      const iv = setInterval(function () {
        n--;
        if (n > 0) { msg.textContent = "Nog " + n + " seconden..."; }
        else { clearInterval(iv); msg.innerHTML = "Het juiste antwoord is: <strong>« " + correctText + " »</strong>"; btn.disabled = false; }
      }, 1000);
      btn.addEventListener("click", function () { if (!btn.disabled) onCleared(); });
    } else {
      box.append(h("div", { class: "penalty-title" }, "📖 Leermoment — lees goed en onthoud:"));
      box.append(h("div", { class: "penalty-answer" }, "« " + correctText + " »"));
      box.append(h("div", { html: "<p style='margin:.3em 0'>" + (explain || "") + "</p>" }));
      const btn = h("button", { class: "btn btn-gold small", disabled: "" }, "✅ Ik snap het");
      box.append(h("div", { class: "penalty-row" }, btn));
      setTimeout(function () { btn.disabled = false; }, 2500);
      btn.addEventListener("click", function () { if (!btn.disabled) onCleared(); });
    }
    return box;
  }
  // Eén quizvraag. Bij een fout: "leermoment" — je moet het juiste antwoord overschrijven om verder te gaan.
  function renderQuizQ(q, cb, o) {
    o = o || {};
    const block = h("div", { class: "quiz-q" }, h("div", { class: "q-text" }, (o.num ? o.num + ". " : "") + q.q));
    const opts = h("div", { class: "quiz-options" });
    const fb = h("div", { class: "q-feedback" });
    const gate = h("div", {});
    const correctText = q.options[q.answer];
    if (o.done) {
      q.options.forEach((t, oi) => opts.append(h("button", { class: "quiz-opt locked" + (oi === q.answer ? " correct" : "") }, t)));
      fb.className = "q-feedback good show"; fb.innerHTML = "✔ " + q.explain;
      block.append(opts, fb); return block;
    }
    let solved = false, wentWrong = false;
    const wrongBtns = [];
    shuffle(q.options.map((t, oi) => ({ t: t, correct: oi === q.answer }))).forEach((opt) => {
      const btn = h("button", { class: "quiz-opt" }, opt.t);
      if (!opt.correct) wrongBtns.push(btn);
      btn.addEventListener("click", () => {
        if (solved) return;
        if (opt.correct) {
          btn.classList.add("correct", "locked");
          [...opts.children].forEach((c) => { c.classList.add("locked"); c.disabled = true; });
          const st = registerFirstTry(true);
          const streakTxt = st >= 2 ? " (" + st + " op rij 🔥) " : " ";
          fb.className = "q-feedback good show"; fb.innerHTML = "🔥 Meteen goed!" + streakTxt + q.explain;
          solved = true; if (cb.onCorrect) cb.onCorrect(true);
        } else {
          if (!wentWrong) { wentWrong = true; registerFirstTry(false); if (cb.onWrong) cb.onWrong(); }
          btn.classList.add("wrong");
          [...opts.children].forEach((c) => { c.classList.add("locked"); c.disabled = true; });
          fb.className = "q-feedback bad show"; fb.innerHTML = "❌ Niet goed. " + q.explain;
          showGate();
        }
      });
      opts.append(btn);
    });
    function showGate() {
      gate.innerHTML = "";
      gate.append(buildPenalty(correctText, q.explain, function () {
        solved = true;
        [...opts.children].forEach((c) => { if (c.textContent === correctText) c.classList.add("correct"); });
        fb.className = "q-feedback good show"; fb.innerHTML = "✔ Goed onthouden! " + q.explain;
        gate.innerHTML = "";
        if (cb.onCorrect) cb.onCorrect(false);
      }));
    }
    block.append(opts);
    // adaptief: extra hulp op de steun-route → een hint die één fout antwoord wegneemt
    if (abilityLevel().key === "steun" && wrongBtns.length > 1) {
      const hint = h("button", { class: "btn btn-ghost small hint-btn" }, "💡 Hint (haal een fout antwoord weg)");
      hint.addEventListener("click", () => {
        if (solved) return;
        const remaining = wrongBtns.filter((b) => !b.disabled);
        if (remaining.length > 1) { const b = remaining[Math.floor(Math.random() * remaining.length)]; b.disabled = true; b.classList.add("eliminated"); }
        if (wrongBtns.filter((b) => !b.disabled).length <= 1) hint.remove();
      });
      block.append(hint);
    }
    block.append(fb, gate);
    return block;
  }

  RENDER.quiz = function (step, ch, idx, done) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, step.title));
    if (step.intro) card.append(h("p", { style: "white-space:pre-wrap" }, step.intro));
    const total = step.questions.length;
    let doneCount = done ? total : 0, mistakes = 0;
    const finish = h("div", {});
    function markDone() {
      if (doneCount >= total && !isStepDone(ch.id, idx)) {
        finish.innerHTML = "";
        const wasNew = completeStep(ch, idx, mistakes);
        finish.append(h("div", { style: "text-align:center;margin-top:12px" }, h("span", { class: "status-pill done" }, "✓ Quiz voltooid")));
        maybeAdvance(ch, idx, wasNew);
      }
    }
    step.questions.forEach((q, qi) => {
      card.append(renderQuizQ(q, {
        onCorrect: () => { doneCount++; markDone(); },
        onWrong: () => { mistakes++; }
      }, { num: qi + 1, done: done }));
    });
    card.append(finish);
    if (done) finish.append(h("div", { style: "text-align:center;margin-top:12px" }, h("span", { class: "status-pill done" }, "✓ Quiz voltooid")));

    // adaptief: bonus-uitdaging met moeilijkere vragen — gaat automatisch open voor sterke leerlingen
    if (step.challenge && step.challenge.length) {
      const lv = abilityLevel();
      const wrap = h("details", { class: "fable-challenge" }, h("summary", {}, "⭐ Extra uitdaging (bonus) — moeilijkere vragen"));
      const body = h("div", { class: "challenge-body" });
      const cTotal = step.challenge.length; let cDone = 0;
      const bonusKey = stepKey(ch.id, idx) + ":chalbonus";
      function grantBonus() {
        if (progress.answers[bonusKey]) return;
        progress.answers[bonusKey] = true; progress.feathers += 3; save(LS.progress, progress);
        flyFeathers(4); syncBoard(); refreshChrome(); toast("⭐ Bonus! +3 veren voor de extra uitdaging");
      }
      step.challenge.forEach((q, ci) => {
        body.append(renderQuizQ(q, { onCorrect: () => { cDone++; if (cDone >= cTotal) grantBonus(); }, onWrong: () => { } }, { num: ci + 1 }));
      });
      wrap.append(body);
      if (lv.key === "uitdaging") { wrap.open = true; wrap.prepend(h("div", { class: "adapt-note" }, "🔴 Jij lust wel een uitdaging — probeer deze bonusvragen!")); }
      else if (lv.key === "steun") wrap.prepend(h("div", { class: "adapt-note steun" }, "🟢 Optioneel: probeer deze extra vragen als je durft."));
      card.append(wrap);
    }
    return card;
  };

  /* ---- order / timeline ---- */
  RENDER.order = function (step, ch, idx, done, onDone) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, step.title), h("p", {}, step.intro));
    const correct = [...step.items].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    // shuffle for display
    const shuffled = shuffle([...step.items]);
    if (done) shuffled.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    const list = h("ul", { class: "order-list" });
    shuffled.forEach((it) => {
      const li = h("li", { class: "order-item" + (done ? " correct-slot" : ""), draggable: done ? null : "true" },
        h("span", { class: "handle" }, done ? "✓" : "⠿"),
        h("span", { class: "year" }, it.year),
        h("span", {}, it.label));
      li._data = it;
      if (!done) enableDrag(li, list);
      list.append(li);
    });
    card.append(list);
    const feedback = h("p", { style: "text-align:center;font-weight:800;min-height:1.4em" });
    card.append(feedback);
    if (!done) {
      const btn = h("button", { class: "btn btn-gold big block", onClick: () => {
        const order = [...list.children].map((li) => li._data);
        let ok = true;
        order.forEach((it, i) => {
          const good = it.year === correct[i].year;
          list.children[i].classList.toggle("correct-slot", good);
          list.children[i].classList.toggle("wrong-slot", !good);
          if (!good) ok = false;
        });
        if (ok) { feedback.style.color = "#3f6b4b"; feedback.textContent = "Perfect! De tijdlijn klopt. ✓";
          const wasNew = completeStep(ch, idx); btn.remove(); maybeAdvance(ch, idx, wasNew); }
        else { feedback.style.color = "#7a2231"; feedback.textContent = "Nog niet helemaal — sleep de rode items naar de juiste plek."; }
      } }, "Controleer volgorde");
      card.append(btn);
    } else {
      card.append(h("div", { style: "text-align:center;margin-top:6px" }, h("span", { class: "status-pill done" }, "✓ Voltooid")));
    }
    return card;
  };

  function enableDrag(li, list) {
    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = list.querySelector(".dragging");
      if (!dragging) return;
      const after = [...list.querySelectorAll(".order-item:not(.dragging)")].find((el) => {
        const box = el.getBoundingClientRect();
        return e.clientY < box.top + box.height / 2;
      });
      if (after) list.insertBefore(dragging, after); else list.append(dragging);
    });
    // touch fallback: tap to move up
    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("handle")) {
        const prev = li.previousElementSibling;
        if (prev) list.insertBefore(li, prev);
      }
    });
  }

  /* ---- match / vocab ---- */
  RENDER.match = function (step, ch, idx, done) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, step.title), h("p", {}, step.intro));
    const wrap = h("div", { class: "match-wrap" });
    const leftCol = h("div", { class: "match-col" }, h("h4", {}, step.leftLabel || "A"));
    const rightCol = h("div", { class: "match-col" }, h("h4", {}, step.rightLabel || "B"));
    const rights = shuffle([...step.pairs]);
    let selLeft = null, matched = 0;
    const total = step.pairs.length;

    step.pairs.forEach((p) => {
      const li = h("div", { class: "match-item" + (done ? " matched" : "") }, p.left);
      li._val = p.left;
      if (!done) li.addEventListener("click", () => {
        if (li.classList.contains("matched")) return;
        leftCol.querySelectorAll(".match-item").forEach((n) => n.classList.remove("selected"));
        li.classList.add("selected"); selLeft = { node: li, pair: p };
      });
      leftCol.append(li);
    });
    rights.forEach((p) => {
      const ri = h("div", { class: "match-item" + (done ? " matched" : "") }, p.right);
      if (!done) ri.addEventListener("click", () => {
        if (ri.classList.contains("matched") || !selLeft) return;
        if (selLeft.pair.right === p.right) {
          selLeft.node.classList.remove("selected"); selLeft.node.classList.add("matched");
          ri.classList.add("matched"); selLeft = null; matched++;
          if (matched === total) { const wasNew = completeStep(ch, idx); fb.textContent = "Alles goed gekoppeld! ✓"; maybeAdvance(ch, idx, wasNew); }
        } else {
          ri.classList.add("pulse-wrong");
          setTimeout(() => ri.classList.remove("pulse-wrong"), 350);
        }
      });
      rightCol.append(ri);
    });
    wrap.append(leftCol, rightCol);
    card.append(wrap);
    const fb = h("p", { style: "text-align:center;font-weight:800;color:#3f6b4b;min-height:1.3em" }, done ? "Alles goed gekoppeld! ✓" : "");
    card.append(fb);
    if (done) card.append(h("div", { style: "text-align:center" }, h("span", { class: "status-pill done" }, "✓ Voltooid")));
    return card;
  };

  /* ---- hotspots (Versailles) ---- */
  RENDER.hotspots = function (step, ch, idx, done) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, step.title), h("p", {}, step.intro));
    const foundSet = new Set(done ? step.spots.map((s) => s.id) : []);
    const tags = h("div", { class: "hotspot-tags" });
    const scene = buildVersailles((id) => {
      if (foundSet.has(id)) return;
      foundSet.add(id);
      updateTags();
      const g = scene.querySelector('[data-id="' + id + '"]');
      if (g) g.classList.add("found");
      const spot = step.spots.find((s) => s.id === id);
      toast("Gevonden: " + spot.label);
      if (foundSet.size >= step.needed) { const wasNew = completeStep(ch, idx); maybeAdvance(ch, idx, wasNew); updateTags(); }
    }, foundSet);
    function updateTags() {
      tags.innerHTML = "";
      step.spots.forEach((s) => {
        const f = foundSet.has(s.id);
        tags.append(h("span", { class: "hs-tag" + (f ? " found" : "") }, (f ? "✓ " : "🔍 ") + s.label + " — " + s.fr));
      });
    }
    card.append(h("div", { class: "scene-wrap" }, scene), tags);
    updateTags();
    if (done) card.append(h("div", { style: "text-align:center;margin-top:10px" }, h("span", { class: "status-pill done" }, "✓ Alle symbolen gevonden")));
    return card;
  };

  /* ---- tour / belevenis: loop mee met de koning door Versailles ---- */
  RENDER.tour = function (step, ch, idx, done) {
    const card = h("div", { class: "activity-card tour-card" }, h("h3", {}, step.title));
    if (step.intro) card.append(h("p", {}, step.intro));
    let i = 0;
    const seen = new Set(done ? step.rooms.map((_, k) => k) : [0]);
    const stage = h("div", { class: "tour-stage" });
    const dots = h("div", { class: "tour-dots" });
    const prevBtn = h("button", { class: "btn btn-ghost small" }, "◀ Vorige");
    const nextBtn = h("button", { class: "btn btn-royal small" }, "Volgende ▶");
    const controls = h("div", { class: "tour-controls" }, prevBtn, dots, nextBtn);
    const finishWrap = h("div", {});

    function draw() {
      const r = step.rooms[i];
      stage.innerHTML = "";
      stage.append(
        h("div", { class: "tour-photo" },
          h("img", { src: r.img, alt: r.name }),
          h("span", { class: "tour-counter" }, (i + 1) + " / " + step.rooms.length)),
        h("div", { class: "tour-info" },
          h("div", { class: "tour-roomname" }, r.name),
          h("div", { class: "tour-fr" }, "« " + r.fr + " »"),
          h("p", { class: "tour-text", html: r.text }),
          r.fact ? h("div", { class: "tour-fact" }, "💡 " + r.fact) : null)
      );
      dots.innerHTML = "";
      step.rooms.forEach((_, k) => {
        const d = h("span", { class: "tour-dot" + (k === i ? " active" : "") + (seen.has(k) ? " seen" : "") });
        d.addEventListener("click", () => { i = k; seen.add(k); draw(); });
        dots.append(d);
      });
      prevBtn.disabled = (i === 0);
      nextBtn.classList.toggle("hidden", i >= step.rooms.length - 1);
      finishWrap.innerHTML = "";
      if (i >= step.rooms.length - 1) {
        if (done) {
          finishWrap.append(h("div", { style: "text-align:center;margin-top:10px" }, h("span", { class: "status-pill done" }, "✓ Rondleiding voltooid")));
        } else {
          finishWrap.append(h("button", { class: "btn btn-gold big block", onClick: () => {
            if (seen.size < step.rooms.length) { toast("Bekijk eerst alle zalen met ▶ Volgende"); return; }
            const wasNew = completeStep(ch, idx); maybeAdvance(ch, idx, wasNew);
          } }, "Rondleiding afronden ✓"));
        }
      }
    }
    prevBtn.addEventListener("click", () => { if (i > 0) { i--; seen.add(i); draw(); } });
    nextBtn.addEventListener("click", () => { if (i < step.rooms.length - 1) { i++; seen.add(i); draw(); } });
    card.append(stage, controls, finishWrap);
    draw();
    return card;
  };

  /* ---- escape room ---- */
  RENDER.escape = function (step, ch, idx, done) {
    const wrap = h("div", { class: "escape-wrap" }, h("h3", {}, "🔐 " + step.title), h("p", { html: step.story }));

    // reading passage (verplicht leeswerk om de vragen te kunnen beantwoorden)
    if (step.reading) {
      wrap.append(h("div", { class: "escape-reading" },
        h("div", { class: "reading-doc", html: step.reading })));
    }

    const total = step.clues.length;
    const found = new Set();
    const progressLabel = h("div", { class: "clue-progress" });
    function updateProgress() {
      progressLabel.textContent = "🗝️ Opgelost: " + (done ? total : found.size) + " / " + total;
    }

    const list = h("div", { class: "clue-list" });
    let tryBtn = null; // set later
    function refreshLock() {
      if (tryBtn) tryBtn.disabled = (found.size < total);
    }

    step.clues.forEach((c, i) => {
      const symSpan = h("div", { class: "clue-symbol" }, done ? c.symbol : "🔒");
      const head = h("div", { class: "clue-head" },
        h("div", { class: "clue-ico" }, c.ico),
        h("div", { class: "clue-label" }, c.label),
        symSpan,
        done ? null : h("span", { class: "clue-toggle" }, "▾"));
      const quiz = h("div", { class: "clue-quiz" });
      const node = h("div", { class: "clue" + (done ? " found" : "") }, head);

      if (!done) {
        const qtext = h("div", { class: "clue-q" }, "❓ " + c.question);
        const opts = h("div", { class: "clue-opts" });
        const fb = h("div", { class: "clue-fb" });
        // antwoorden husselen zodat het juiste antwoord niet steeds op dezelfde plek staat
        const shuffledOpts = shuffle(c.options.map((text, oi) => ({ text: text, correct: oi === c.answer })));
        const wrongB = [];
        shuffledOpts.forEach((opt) => {
          const b = h("button", { class: "clue-opt", type: "button" }, opt.text);
          if (!opt.correct) wrongB.push(b);
          b.addEventListener("click", (e) => {
            e.stopPropagation();
            if (node.classList.contains("found")) return;
            if (opt.correct) {
              node.classList.add("found");
              symSpan.textContent = c.symbol;
              found.add(i);
              b.classList.add("correct");
              [...opts.children].forEach((x) => { x.disabled = true; });
              fb.className = "clue-fb good show";
              fb.textContent = "✔ " + c.explain;
              updateProgress(); refreshLock();
            } else {
              b.classList.add("wrong"); b.disabled = true;
              fb.className = "clue-fb bad show";
              fb.textContent = "✘ Dat klopt niet — lees de tekst hierboven nog eens goed en probeer opnieuw.";
            }
          });
          opts.append(b);
        });
        quiz.append(qtext, opts, fb);
        // adaptief: extra hulp op de steun-route → hint die één fout antwoord wegneemt
        if (abilityLevel().key === "steun" && wrongB.length > 1) {
          const hintBtn = h("button", { class: "btn btn-ghost small hint-btn", type: "button" }, "💡 Hint (haal een fout antwoord weg)");
          hintBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (node.classList.contains("found")) return;
            const rem = wrongB.filter((x) => !x.disabled);
            if (rem.length > 1) { const x = rem[Math.floor(Math.random() * rem.length)]; x.disabled = true; x.classList.add("eliminated"); }
            if (wrongB.filter((x) => !x.disabled).length <= 1) hintBtn.remove();
          });
          quiz.append(hintBtn);
        }
        head.addEventListener("click", () => {
          if (node.classList.contains("found")) return;
          quiz.classList.toggle("open");
          const t = head.querySelector(".clue-toggle");
          if (t) t.textContent = quiz.classList.contains("open") ? "▴" : "▾";
        });
        node.append(quiz);
      }
      list.append(node);
    });
    wrap.append(progressLabel, list);
    updateProgress();

    const chest = h("div", { class: "chest" + (done ? " open" : "") }, done ? "🧰" : "🔒");
    const codeLen = step.code.length;
    const boxes = [];
    const codeRow = h("div", { class: "code-inputs" });
    for (let i = 0; i < codeLen; i++) {
      const b = h("input", { class: "code-box", maxlength: "1", type: "text", value: done ? step.code[i] : "" });
      if (done) b.disabled = true;
      b.addEventListener("input", () => { b.value = b.value.toUpperCase(); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
      boxes.push(b); codeRow.append(b);
    }
    const hint = (!done && abilityLevel().key === "uitdaging")
      ? h("div", { class: "lock-hint" }, "🔴 Uitdaging: kraak het slot zónder codehint. Leg de gevonden letters op de juiste volgorde!")
      : h("div", { class: "lock-hint" }, "💡 " + step.codeHint);
    const msg = h("p", { style: "min-height:1.3em;font-weight:800;text-align:center" });
    const panel = h("div", { class: "lock-panel" }, chest, codeRow, hint);

    if (!done) {
      tryBtn = h("button", { class: "btn btn-gold", onClick: () => {
        if (found.size < total) {
          msg.style.color = "#f3b0b6"; msg.textContent = "Los eerst álle aanwijzingen op door de vragen goed te beantwoorden.";
          return;
        }
        const guess = boxes.map((b) => b.value.toUpperCase()).join("");
        if (guess === step.code.toUpperCase()) {
          chest.classList.add("open"); chest.textContent = "🧰";
          msg.style.color = "#e8c86a"; msg.innerHTML = "✓ " + step.success;
          boxes.forEach((b) => b.disabled = true);
          const wasNew = completeStep(ch, idx); tryBtn.remove(); maybeAdvance(ch, idx, wasNew);
        } else {
          msg.style.color = "#f3b0b6"; msg.textContent = "De code klopt niet. Leg de gevonden letters op volgorde en probeer opnieuw!";
          chest.style.transform = "translateX(0)"; chest.animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 300 });
        }
      } }, "🔓 Open het slot");
      panel.append(tryBtn);
      refreshLock();
    } else {
      msg.style.color = "#e8c86a"; msg.innerHTML = "✓ " + step.success;
    }
    panel.append(msg);
    wrap.append(panel);
    return wrap;
  };

  /* ---- reflect ---- */
  RENDER.reflect = function (step, ch, idx, done) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, step.title), h("p", {}, step.intro));
    const areas = [];
    step.questions.forEach((q, qi) => {
      const key = ch.id + ":" + idx + ":r" + qi;
      const ta = h("textarea", { class: "textarea-input", placeholder: "Jouw antwoord..." }, progress.answers[key] || "");
      ta.value = progress.answers[key] || "";
      ta.addEventListener("input", () => { progress.answers[key] = ta.value; save(LS.progress, progress); scheduleFbSync(); });
      card.append(h("div", { class: "field-block" }, h("label", {}, (qi + 1) + ". " + q), ta));
      areas.push(ta);
    });
    if (!done) {
      const btn = h("button", { class: "btn btn-gold big block", onClick: () => {
        if (areas.some((a) => a.value.trim().length < 2)) { toast("Vul eerst alle vragen in ✍️"); return; }
        const wasNew = completeStep(ch, idx); btn.replaceWith(h("div", { style: "text-align:center" }, h("span", { class: "status-pill done" }, "✓ Opgeslagen"))); maybeAdvance(ch, idx, wasNew);
      } }, "Opslaan in portfolio ✓");
      card.append(btn);
    } else {
      card.append(h("div", { style: "text-align:center" }, h("span", { class: "status-pill done" }, "✓ Opgeslagen in portfolio")));
    }
    return card;
  };

  /* ---- writer (ch5) ---- */
  RENDER.writer = function (step, ch, idx, done) {
    const K = (f) => ch.id + ":" + idx + ":" + f;
    const g = (f) => progress.answers[K(f)] || "";
    const card = h("div", { class: "activity-card" }, h("h3", {}, step.title));
    card.append(jeanSay(["Volg de stappen, gebruik de inspiratiekaarten en schrijf jouw eigen fabel. Combineer Nederlands en Frans — durf te proberen!"]));

    // inspire cards
    card.append(h("h4", { style: "font-family:var(--font-ui);color:var(--ink-soft)" }, "✨ Inspiratiekaarten — klik om een dier toe te voegen"));
    const inspire = h("div", { class: "inspire-cards" });
    const persField = h("input", { class: "text-input", placeholder: "bv. le renard, la tortue" });
    persField.value = g("pers");
    INSPIRE_ANIMALS.forEach((a) => {
      inspire.append(h("div", { class: "inspire-card", onClick: () => {
        const cur = persField.value.trim();
        persField.value = cur ? cur + ", " + a.fr : a.fr;
        persField.dispatchEvent(new Event("input"));
      } }, h("span", { class: "ic-emoji" }, a.emoji), h("div", {}, a.nl), h("div", { class: "ic-fr" }, a.fr)));
    });
    card.append(inspire);

    // fields
    const fields = [
      ["titre", "📕 Titel van je fabel (FR of NL)", "bv. Le Chat et la Souris"],
      ["pers", "🐾 Personages (dieren)", "bv. le renard, la tortue"],
      ["lieu", "🌳 Waar speelt het? (le lieu)", "bv. dans la forêt (in het bos)"],
      ["prob", "⚡ Het probleem / conflict", "Wat gaat er mis?"],
      ["fin", "🎬 De afloop", "Hoe eindigt het verhaal?"]
    ];
    const grid = h("div", {});
    const inputs = {};
    fields.forEach(([f, label, ph]) => {
      let inp;
      if (f === "pers") inp = persField;
      else if (f === "prob" || f === "fin") inp = h("textarea", { class: "textarea-input", placeholder: ph });
      else inp = h("input", { class: "text-input", placeholder: ph });
      if (f !== "pers") inp.value = g(f);
      inp.addEventListener("input", () => { progress.answers[K(f)] = inp.value; save(LS.progress, progress); scheduleFbSync(); updatePreview(); });
      inputs[f] = inp;
      grid.append(h("div", { class: "field-block" }, h("label", {}, label), inp));
    });
    // moral fields
    const moralFr = h("input", { class: "text-input", placeholder: "La morale (Frans, mag simpel)" });
    const moralNl = h("input", { class: "text-input", placeholder: "De moraal (Nederlands)" });
    moralFr.value = g("mfr"); moralNl.value = g("mnl");
    [["mfr", moralFr], ["mnl", moralNl]].forEach(([f, inp]) => inp.addEventListener("input", () => { progress.answers[K(f)] = inp.value; save(LS.progress, progress); scheduleFbSync(); updatePreview(); }));
    grid.append(h("div", { class: "field-block" }, h("label", {}, "💡 Moraal in het Frans"), moralFr));
    grid.append(h("div", { class: "field-block" }, h("label", {}, "💡 Moraal in het Nederlands"), moralNl));
    card.append(grid);

    // preview
    card.append(h("h4", { style: "font-family:var(--font-ui);color:var(--ink-soft)" }, "📜 Voorbeeld van jouw fabel"));
    const preview = h("div", { class: "fabel-preview" });
    card.append(preview);
    function updatePreview() {
      const t = inputs.titre.value || "(titel)";
      const pers = inputs.pers.value || "(personages)";
      const lieu = inputs.lieu.value ? " " + inputs.lieu.value : "";
      const prob = inputs.prob.value || "(het probleem)";
      const fin = inputs.fin.value || "(de afloop)";
      const mfr = moralFr.value, mnl = moralNl.value;
      preview.textContent =
        "« " + t + " »\n\n" +
        "Personages: " + pers + lieu + ".\n\n" +
        prob + "\n\n" + fin + "\n\n" +
        "— Morale — \n" + (mfr ? mfr + "\n" : "") + (mnl ? "(" + mnl + ")" : "");
    }
    updatePreview();

    // checklist
    const checkItems = [
      "Mijn fabel heeft minstens twee dieren",
      "Er is een duidelijk probleem of conflict",
      "Er is een afloop / einde",
      "Ik heb een moraal geschreven",
      "Ik heb minstens 3 Franse woorden gebruikt"
    ];
    card.append(h("h4", { style: "font-family:var(--font-ui);color:var(--ink-soft)" }, "✅ Checklist"));
    const ul = h("ul", { class: "checklist" });
    const checks = [];
    checkItems.forEach((c, ci) => {
      const box = h("input", { type: "checkbox" });
      box.checked = progress.answers[K("chk" + ci)] === true;
      if (done) box.disabled = true;
      box.addEventListener("change", () => { progress.answers[K("chk" + ci)] = box.checked; save(LS.progress, progress); });
      ul.append(h("li", {}, box, c));
      checks.push(box);
    });
    card.append(ul);

    if (!done) {
      const btn = h("button", { class: "btn btn-gold big block", onClick: () => {
        if (!inputs.titre.value.trim() || (!moralFr.value.trim() && !moralNl.value.trim())) { toast("Geef je fabel een titel en een moraal ✍️"); return; }
        if (!checks.every((c) => c.checked)) { toast("Vink eerst de hele checklist af ✅"); return; }
        const wasNew = completeStep(ch, idx);
        btn.replaceWith(h("div", { style: "text-align:center" }, h("span", { class: "status-pill done" }, "✓ Fabel opgeslagen")));
        maybeAdvance(ch, idx, wasNew);
      } }, "Mijn fabel is klaar ✓");
      card.append(btn);
    } else {
      card.append(h("div", { style: "text-align:center" }, h("span", { class: "status-pill done" }, "✓ Fabel opgeslagen in portfolio")));
    }
    return card;
  };

  /* ---- La Commission Royale: feedback op de eigen fabel (ch5) ---- */
  function readStudentFable() {
    const a = progress.answers || {};
    const g = (k) => (a[k] || "").toString().trim();
    const atelierAnimals = Array.isArray(a["atelier:animals"]) ? a["atelier:animals"] : [];
    const atelierTraits = Array.isArray(a["atelier:traits"]) ? a["atelier:traits"] : [];
    const persStr = g("ch5:1:pers");
    let animals = atelierAnimals.slice();
    if (!animals.length && persStr) animals = persStr.split(/[,;/]+/).map((s) => s.trim()).filter(Boolean);
    const title = g("ch5:1:titre");
    const moral = g("ch5:1:mfr") || g("ch5:1:mnl") || g("atelier:morale");
    const probleme = g("ch5:1:prob") || g("atelier:probleme");
    const afloop = g("ch5:1:fin");
    const story = g("atelier:story");
    const lieu = g("ch5:1:lieu") || g("atelier:lieu");
    const dial = [g("atelier:dial1"), g("atelier:dial2")].filter(Boolean);
    const text = [title, persStr, animals.join(" "), probleme, afloop, moral, story, dial.join(" "), atelierTraits.join(" ")].join(" ").toLowerCase();
    return {
      title: title, animals: animals, traits: atelierTraits, moral: moral, probleme: probleme, afloop: afloop, story: story, lieu: lieu, dial: dial, text: text,
      hasAnything: !!(title || animals.length || moral || probleme || story || afloop)
    };
  }

  RENDER.commission = function (step, ch, idx, done) {
    const f = readStudentFable();
    const card = h("div", { class: "activity-card commission" }, h("h3", {}, "⚜️ " + step.title));
    card.append(jeanSay(["Welkom bij de <strong>Commission Royale</strong>, mon élève. Je bent geen leerling die een opdracht maakt — je bent een <strong>schrijver die feedback krijgt</strong>.", "Vier lezers uit verschillende tijden bekijken jouw fabel. Zo ontdek je wat al sterk is en wat je nog mooier kunt maken. De pen blijft van jou!"]));

    if (!f.hasAnything) {
      card.append(h("div", { class: "commission-empty" },
        h("p", {}, "De commissie kan nog niets beoordelen — je hebt nog geen fabel geschreven."),
        h("button", { class: "btn btn-gold", onClick: () => go("atelier") }, "✒️ Ga eerst je fabel schrijven")));
      return card;
    }

    // overzicht van de fabel
    const persLine = f.animals.length ? f.animals.join(", ") : "(nog geen dieren gekozen)";
    card.append(h("div", { class: "commission-fable" },
      h("strong", {}, "📕 " + (f.title || "Jouw fabel")),
      h("div", { class: "cf-line" }, "Personages: " + persLine),
      f.probleme ? h("div", { class: "cf-line" }, "Probleem: " + f.probleme) : null,
      f.moral ? h("div", { class: "cf-line" }, "Moraal: " + f.moral) : null));

    // heuristieken
    const nAnimals = f.animals.length;
    const hasMoral = !!f.moral;
    const hasConflict = !!(f.probleme || f.afloop);
    const hasDialogue = f.dial.length > 0;
    const hasEnd = !!f.afloop || (f.story && f.story.length > 120);
    const hasTraits = f.traits.length > 0;
    const powerWords = ["fort", "faible", "roi", "lion", "loup", "puissant", "riche", "pauvre", "impôt", "raison du plus fort", "sterkste", "macht", "koning", "onrecht", "arm", "rijk", "baas"];
    const subversive = powerWords.some((w) => f.text.indexOf(w) !== -1);

    function reviewer(icon, name, sub, bodyNodes) {
      return h("div", { class: "reviewer" },
        h("div", { class: "rev-head" }, h("span", { class: "rev-ico" }, icon), h("div", {}, h("div", { class: "rev-name" }, name), h("div", { class: "rev-sub" }, sub))),
        h("div", { class: "rev-body" }, bodyNodes));
    }

    // 1. De Koninklijke Censor
    let verdict, verdictCls, verdictWhy;
    if (subversive) { verdict = "À modifier"; verdictCls = "verdict-mod"; verdictWhy = "Jouw fabel bevat verborgen kritiek op de machtigen. Aan het hof is dat gevaarlijk! Maar juist dít maakt een échte La Fontaine-fabel: verpak je boodschap slim achter je dieren, dan blijft ze veilig én scherp."; }
    else if (!hasMoral) { verdict = "À modifier"; verdictCls = "verdict-mod"; verdictWhy = "Zonder duidelijke les weet het hof niet wat je bedoelt. Voeg een moraal toe, dan is je boodschap helder."; }
    else { verdict = "Acceptée par la cour"; verdictCls = "verdict-ok"; verdictWhy = "Een charmante fabel met een nette les — de koning zou glimlachen. Durf gerust nog een klein prikkeltje toe te voegen; La Fontaine deed dat ook."; }
    const censor = reviewer("👑", "1. De Koninklijke Censor (Versailles, 1680)", "Adviseur aan het hof van Lodewijk XIV", [
      h("p", {}, "Ik lees welke boodschap er in je dieren verborgen zit. " + (subversive ? "Je dieren lijken te staan voor machtigen en zwakken — dat is riskant maar knap." : "Kies je dieren bewust als symbolen: de leeuw voor de koning, de mier voor het gewone volk.")),
      h("div", { class: "verdict-box" }, h("div", { class: "verdict-title" }, "⚖️ Het oordeel van Versailles:"), h("div", { class: "verdict-badge " + verdictCls }, verdict), h("p", { class: "verdict-why" }, verdictWhy))
    ]);

    // 2. Jean de La Fontaine als mentor — coachvragen
    const coachPool = [];
    if (nAnimals < 2) coachPool.push("Je fabel heeft nu " + (nAnimals || "geen") + " dier(en). Welk tweede dier zou een mooi contrast geven met het eerste?");
    if (!hasMoral) coachPool.push("Wat is precies de les die je lezer moet meenemen? Kun je die in één zin zeggen?");
    if (!hasConflict) coachPool.push("Welk probleem of conflict drijft je verhaal — wat gaat er mis?");
    coachPool.push("Welke menselijke eigenschap wil je met je dieren laten zien?");
    coachPool.push("Als je je fabel hardop voorleest: waar wil je dat de lezer glimlacht of even nadenkt?");
    coachPool.push("Wat zou er gebeuren als je dieren een andere keuze maakten? Verandert dan je moraal?");
    const coachQs = coachPool.slice(0, 3);
    const mentor = reviewer("🪶", "2. Jean de La Fontaine (jouw mentor)", "Ervaren fabelschrijver die je begeleidt", [
      h("p", {}, "Ik schrijf niks voor je — jij bent de schrijver. Maar denk eens na over deze vragen:"),
      h("ul", { class: "coach-list" }, coachQs.map((q) => h("li", {}, q)))
    ]);

    // 3. De moderne lezer
    const modernTip = !hasDialogue
      ? "Voeg een korte dialoog toe — jongeren houden van personages die écht praten."
      : (!hasConflict ? "Kies een probleem dat jongeren herkennen (ruzie, jaloezie, groepsdruk) achter je dieren."
        : "Laat één sterke emotie voelen (angst, trots, blijdschap) — dan blijft je fabel hangen.");
    const modern = reviewer("🧑‍🎓", "3. De moderne lezer", "Een Franse scholier van vandaag", [
      h("p", {}, "Snap ik de boodschap? Is het probleem nog herkenbaar? Welke emotie voel ik?"),
      h("div", { class: "modern-tip" }, "💡 Tip om je fabel relevanter te maken: " + modernTip)
    ]);

    // 4. De literatuuronderzoeker
    const research = [];
    if (!hasConflict) research.push("Zorg voor een duidelijk conflict met opbouw → hoogtepunt → afloop.");
    if (nAnimals && !hasTraits) research.push("Geef je dieren een duidelijke eigenschap, zo worden het echte symbolen.");
    if (!hasMoral) research.push("Sluit af met een scherpe moraal — dat is het hart van de fabel.");
    if (!hasEnd) research.push("Werk de afloop iets verder uit, zodat de moraal echt landt.");
    research.push("Probeer een verrassende wending — dat maakt je fabel origineel.");
    const researcher = reviewer("🔬", "4. De literatuuronderzoeker", "Expert in literaire kwaliteit", [
      h("p", {}, "Ik kijk naar opbouw, conflict, symboliek, moraal en originaliteit. Drie concrete punten:"),
      h("ul", { class: "coach-list" }, research.slice(0, 3).map((r) => h("li", {}, r)))
    ]);

    card.append(censor, mentor, modern, researcher);

    // Mon plan d'amélioration
    const sterk = [];
    if (nAnimals >= 2) sterk.push("Je hebt meerdere personages (" + f.animals.join(", ") + ").");
    else if (nAnimals === 1) sterk.push("Je hebt al een hoofdpersonage gekozen.");
    if (hasMoral) sterk.push("Je fabel heeft een moraal — het hart van elke fabel.");
    if (hasConflict) sterk.push("Er zit een duidelijk probleem/conflict in je verhaal.");
    if (hasDialogue) sterk.push("Je laat je personages praten met een dialoog.");
    if (subversive) sterk.push("Je durft een boodschap te verstoppen — heel La Fontaine!");
    if (!sterk.length) sterk.push("Je bent begonnen — de eerste versie staat er, dat is de moeilijkste stap!");

    const beter = [];
    if (nAnimals < 2) beter.push("een tweede dier toevoegen voor contrast");
    if (!hasMoral) beter.push("een duidelijke moraal in één zin");
    if (!hasConflict) beter.push("een scherper probleem/conflict");
    if (!hasDialogue) beter.push("een korte dialoog tussen je dieren");
    if (!hasEnd) beter.push("de afloop wat verder uitwerken");
    if (!beter.length) beter.push("een verrassende wending of een extra Franse uitdrukking");

    const stap = !hasMoral ? "Schrijf jouw moraal in één krachtige zin op."
      : (nAnimals < 2 ? "Kies een tweede dier en bedenk hoe het botst met het eerste."
        : (!hasDialogue ? "Schrijf één zin dialoog waarin een dier iets zegt."
          : "Lees je fabel hardop en verbeter de zin die het minst lekker loopt."));

    const plan = h("div", { class: "amelioration" },
      h("h3", {}, "🎯 Mon plan d'amélioration"),
      h("div", { class: "plan-block plan-sterk" }, h("strong", {}, "1. Dit is al sterk aan jouw fabel:"), h("ul", {}, sterk.map((s) => h("li", {}, s)))),
      h("div", { class: "plan-block plan-beter" }, h("strong", {}, "2. Dit kun je verbeteren:"), h("ul", {}, beter.map((s) => h("li", {}, s)))),
      h("div", { class: "plan-block plan-stap" }, h("strong", {}, "3. Eén concrete stap voor je volgende versie:"), h("p", {}, "👉 " + stap)));
    card.append(plan);

    // reflectie + afronden
    const key = ch.id + ":" + idx + ":plan";
    const ta = h("textarea", { class: "textarea-input", placeholder: "Wat neem je mee naar je volgende versie? (jouw eigen woorden)" });
    ta.value = progress.answers[key] || "";
    ta.addEventListener("input", () => { progress.answers[key] = ta.value; save(LS.progress, progress); scheduleFbSync(); });
    card.append(h("div", { class: "field-block", style: "margin-top:14px" }, h("label", {}, "✍️ Mijn verbeterplan in eigen woorden:"), ta));

    if (!done) {
      const btn = h("button", { class: "btn btn-gold big block", onClick: () => {
        if (ta.value.trim().length < 5) { toast("Schrijf kort op wat je meeneemt ✍️"); return; }
        const wasNew = completeStep(ch, idx);
        btn.replaceWith(h("div", { style: "text-align:center" }, h("span", { class: "status-pill done" }, "✓ Feedback ontvangen")));
        maybeAdvance(ch, idx, wasNew);
      } }, "Ik ga mijn fabel verbeteren ✒️");
      card.append(btn);
    } else {
      card.append(h("div", { style: "text-align:center" }, h("span", { class: "status-pill done" }, "✓ Feedback ontvangen — jij blijft de schrijver!")));
    }
    return card;
  };

  /* ---- product (ch6) ---- */
  RENDER.product = function (step, ch, idx, done) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, step.title));
    card.append(h("p", {}, "Kies in welke vorm je je fabel presenteert en upload je eindproduct (of een foto/screenshot ervan)."));
    const options = [
      { id: "tekst", emoji: "📝", name: "Geschreven fabel" },
      { id: "strip", emoji: "🗯️", name: "Stripverhaal" },
      { id: "podcast", emoji: "🎙️", name: "Podcast" },
      { id: "video", emoji: "🎬", name: "Video" },
      { id: "digitaal", emoji: "💻", name: "Digitaal verhaal" }
    ];
    const grid = h("div", { class: "product-choice" });
    let chosen = progress.product && progress.product.type;
    options.forEach((o) => {
      const el = h("div", { class: "product-opt" + (chosen === o.id ? " selected" : "") },
        h("span", { class: "po-emoji" }, o.emoji), h("div", { class: "po-name" }, o.name));
      if (!done) el.addEventListener("click", () => {
        chosen = o.id;
        grid.querySelectorAll(".product-opt").forEach((n) => n.classList.remove("selected"));
        el.classList.add("selected");
        progress.product = Object.assign({}, progress.product, { type: o.id, name: o.name }); save(LS.progress, progress);
        updateBtn();
      });
      grid.append(el);
    });
    card.append(grid);

    // upload
    const fileName = h("span", { class: "upload-hint" }, progress.product && progress.product.file ? "Geüpload: " + progress.product.file : "");
    const preview = h("div", {});
    if (progress.product && progress.product.fileData) preview.append(h("img", { src: progress.product.fileData, style: "max-width:220px;border-radius:12px;margin-top:10px;border:2px solid var(--parchment-dark)" }));
    if (!done) {
      const fileInput = h("input", { type: "file", hidden: "", id: "product-file", accept: "image/*,audio/*,video/*,.pdf,.docx,.txt" });
      const label = h("label", { class: "btn btn-ghost small", for: "product-file" }, "📎 Bestand uploaden");
      fileInput.addEventListener("change", () => {
        const f = fileInput.files[0]; if (!f) return;
        progress.product = Object.assign({}, progress.product, { file: f.name });
        fileName.textContent = "Geüpload: " + f.name;
        if (f.type.startsWith("image/") && f.size < 2_500_000) {
          const r = new FileReader(); r.onload = () => { progress.product.fileData = r.result; save(LS.progress, progress); preview.innerHTML = ""; preview.append(h("img", { src: r.result, style: "max-width:220px;border-radius:12px;margin-top:10px;border:2px solid var(--parchment-dark)" })); }; r.readAsDataURL(f);
        } else { save(LS.progress, progress); }
      });
      card.append(h("div", { style: "display:flex;gap:12px;align-items:center;margin:10px 0;flex-wrap:wrap" }, label, fileInput, fileName), preview);
    } else {
      card.append(h("div", { style: "margin:10px 0" }, fileName), preview);
    }

    const btnWrap = h("div", {});
    card.append(btnWrap);
    function updateBtn() {
      btnWrap.innerHTML = "";
      if (done) { btnWrap.append(h("div", { style: "text-align:center" }, h("span", { class: "status-pill done" }, "✓ Gepubliceerd"))); return; }
      const btn = h("button", { class: "btn btn-gold big block", disabled: chosen ? null : "" , onClick: () => {
        if (!chosen) { toast("Kies eerst een presentatievorm"); return; }
        const wasNew = completeStep(ch, idx); updateBtn(); maybeAdvance(ch, idx, wasNew);
      } }, "Publiceer mijn eindproduct 🚀");
      btnWrap.append(btn);
    }
    updateBtn();
    return card;
  };

  /* ---- certificate (ch6 final) ---- */
  RENDER.certificate = function (step, ch, idx, done) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, step.title));
    const host = h("div", {});
    function drawCert() {
      host.innerHTML = "";
      const dateStr = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
      const cert = h("div", { class: "certificate" },
        h("div", { class: "cert-seal" }, "🏛️"),
        h("h2", {}, "Certificaat van Voltooiing"),
        h("p", { class: "cert-body" }, "Hierbij wordt verklaard dat"),
        h("div", { class: "cert-name" }, profile.name),
        h("p", { class: "cert-body" }, "met succes de leerreis « In de voetsporen van Jean de La Fontaine » heeft voltooid, alle zes hoofdstukken heeft afgerond en de titel verdient van:"),
        h("h2", { style: "color:var(--gold-deep)" }, "🏛️ Meester van de Moraal"),
        h("p", { class: "cert-body" }, "Verzamelde veren: 🪶 " + progress.feathers + "  ·  Badges: " + (progress.badges.length) + "/6"),
        h("div", { class: "cert-sign" }, "Jean de La Fontaine"),
        h("p", { class: "cert-body", style: "font-size:.95rem;color:var(--ink-soft)" }, "Château-Thierry · " + dateStr)
      );
      host.append(cert);
      host.append(h("div", { class: "no-print", style: "text-align:center;margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap" },
        h("button", { class: "btn btn-royal", onClick: () => window.print() }, "🖨️ Print / Download PDF"),
        h("button", { class: "btn btn-ghost", onClick: () => go("dashboard") }, "Naar mijn dashboard")
      ));
    }
    if (done) { drawCert(); }
    else {
      card.append(jeanSay(["Je hebt de hele reis afgelegd, mon élève. Klik hieronder om je welverdiende certificaat te ontvangen!"]));
      const btn = h("button", { class: "btn btn-gold big block", onClick: () => {
        const wasNew = completeStep(ch, idx);
        btn.remove(); drawCert();
        if (wasNew) setTimeout(() => showModal("🎓", "Meesterschap bereikt!", "<p>Gefeliciteerd, <strong>" + profile.name + "</strong>! Je bent nu <strong>Meester van de Moraal</strong>. Chapeau!</p>"), 700);
      } }, "🎓 Ontvang mijn certificaat");
      card.append(btn);
    }
    card.append(host);
    return card;
  };

  function maybeAdvance(ch, idx, wasNew) {
    // re-render chapter to reflect completion + advance, but only if the
    // student is still viewing this chapter (don't yank them back from another view)
    setTimeout(() => {
      if (wasNew && currentRoute.name === "chapter" && currentRoute.param === ch.num) go("chapter", ch.num);
    }, 900);
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */
  /* ---- adaptieve leerroute (dashboard) ---- */
  function renderAdaptiveCard() {
    const lv = abilityLevel();
    const a = progress.ability || 0;
    const card = h("div", { class: "dash-card" }, h("h3", {}, "🎯 Jouw adaptieve leerroute"));
    card.append(h("span", { class: "adapt-level " + lv.cls }, lv.label));
    card.append(h("p", { style: "margin:.5em 0" }, lv.nl + "."));
    // uitleg wat de app aanpast
    if (lv.key === "steun") card.append(h("p", { class: "doc-note" }, "Je krijgt extra hulp: een 💡 hint bij vragen en aanbevolen 🟢 A1-fabels. Maak rustig fouten — daar leer je van."));
    else if (lv.key === "uitdaging") card.append(h("p", { class: "doc-note" }, "Je gaat hard! Je krijgt aanbevolen 🔴 B1-fabels en de extra uitdaging staat meteen open."));
    else card.append(h("p", { class: "doc-note" }, "Je zit op je niveau. Blijf scherp — bij veel goede antwoorden ga je naar de uitdaging-route, bij fouten krijg je extra hulp."));
    if (lv.locked) card.append(h("p", { class: "doc-note", style: "color:var(--wine)" }, "🔒 Je docent heeft jouw route op deze stand vastgezet."));
    card.append(h("button", { class: "btn btn-royal small", onClick: () => go("fables") }, "📚 Ga naar aanbevolen fabels (" + lv.rec + ")"));
    // docent: route handmatig vastzetten per leerling (op dit apparaat)
    if (isTeacher()) {
      const cur = progress.routeLock || "";
      const lockRow = h("div", { class: "route-lock" });
      [["", "Automatisch"], ["steun", "🟢 Steun"], ["basis", "🟡 Basis"], ["uitdaging", "🔴 Uitdaging"]].forEach((o) => {
        const b = h("button", { class: "filter-chip" + (cur === o[0] ? " active" : "") }, o[1]);
        b.addEventListener("click", () => { progress.routeLock = o[0] || null; save(LS.progress, progress); toast(o[0] ? "Route vastgezet: " + o[1] : "Route weer automatisch"); go("dashboard"); });
        lockRow.append(b);
      });
      card.append(h("p", { class: "doc-note", style: "margin:10px 0 4px;font-weight:800" }, "🔒 Docent — route van deze leerling vastzetten:"), lockRow);
      card.append(h("p", { class: "doc-note" }, "Vaardigheidsscore: " + a + " (−6 t/m 8)" + (progress.routeLock ? " · nu handmatig vastgezet" : " · automatisch")));
    }
    return card;
  }

  /* ---- docent: beoordelingsrubric & planning ---- */
  function renderDocsCard() {
    const teacher = isTeacher();
    const card = h("div", { class: "dash-card" }, h("h3", {}, "📋 Beoordeling & planning"));
    const items = [["rubric", "📊 Beoordelingsrubric"], ["planning", "🗓️ Planning"]];
    let anyForStudent = false;
    items.forEach(function (pair) {
      const key = pair[0], label = pair[1];
      const docs = load(LS.docs, {});
      const info = docs[key];
      const row = h("div", { class: "doc-row" }, h("span", { class: "doc-label" }, label));
      if (info && info.type === "link") {
        anyForStudent = true;
        row.append(h("a", { href: info.link, target: "_blank", rel: "noopener", class: "btn btn-ghost small" }, "🔗 Openen"));
      } else if (info && info.type === "file") {
        anyForStudent = true;
        const dl = h("button", { class: "btn btn-ghost small" }, "📄 " + (info.name || "Openen"));
        dl.addEventListener("click", function () { IDB.get("doc_" + key).then(function (b) { if (!b) { toast("Bestand staat niet op dit apparaat."); return; } playFileModal(b, info.name, "doc"); }); });
        row.append(dl);
      } else {
        row.append(h("span", { class: "doc-empty" }, "nog niet toegevoegd"));
      }
      card.append(row);
      if (teacher) {
        const fi = h("input", { type: "file", accept: ".pdf,.doc,.docx,image/*", hidden: "" });
        const up = h("label", { class: "btn btn-gold small" }, "📎 Bestand", fi);
        fi.addEventListener("change", function () {
          const f = fi.files[0]; if (!f) return;
          if (f.size > 20 * 1024 * 1024) { toast("Bestand te groot (max 20 MB) — gebruik liever een link."); return; }
          IDB.put("doc_" + key, f).then(function () { const d = load(LS.docs, {}); d[key] = { type: "file", name: f.name }; save(LS.docs, d); toast("✔ " + label + " opgeslagen."); go("dashboard"); }).catch(function () { toast("Opslaan mislukt op dit apparaat."); });
        });
        const linkBtn = h("button", { class: "btn btn-ghost small" }, "🔗 Link");
        linkBtn.addEventListener("click", function () { const u = window.prompt("Plak de link naar de " + label + " (bv. Google Drive/Classroom):"); if (u == null || !u.trim()) return; const d = load(LS.docs, {}); d[key] = { type: "link", link: u.trim() }; save(LS.docs, d); IDB.del("doc_" + key); toast("✔ Link opgeslagen."); go("dashboard"); });
        const controls = h("div", { class: "doc-teacher" }, up, linkBtn);
        if (info) { const rm = h("button", { class: "teacher-link" }, "verwijderen"); rm.addEventListener("click", function () { const d = load(LS.docs, {}); delete d[key]; save(LS.docs, d); IDB.del("doc_" + key); go("dashboard"); }); controls.append(rm); }
        card.append(controls);
      }
    });
    if (teacher) card.append(h("p", { class: "doc-note" }, "Docent: dit staat op dít apparaat. Voor álle leerlingen: gebruik een link (Drive/Classroom), of stel het op elk apparaat in."));
    else if (!anyForStudent) card.append(h("p", { class: "doc-empty" }, "Je docent heeft nog geen rubric of planning toegevoegd."));
    return card;
  }

  /* ---- leerling: privé fabelvideo inleveren (alleen jij + docent zien 'm) ---- */
  function renderSubmissionCard() {
    const teacher = isTeacher();
    const card = h("div", { class: "dash-card" }, h("h3", {}, "🎬 Mijn fabelvideo (privé inleveren)"));
    card.append(h("p", { class: "doc-note" }, "Alleen jij en je docent zien jouw video — andere leerlingen niet."));

    // Inleverlink (docent stelt in: Google Classroom / Form met bestandsupload → centraal & privé)
    const submit = (load(LS.docs, {}).submit) || null;
    if (submit && submit.link) {
      card.append(h("a", { href: submit.link, target: "_blank", rel: "noopener", class: "btn btn-gold block", style: "margin:4px 0 10px" }, "📤 Lever je video in bij je docent"));
      card.append(h("p", { class: "doc-note" }, "Je video gaat rechtstreeks naar je docent. Klasgenoten kunnen 'm niet zien."));
    } else if (!teacher) {
      card.append(h("p", { class: "doc-empty" }, "Je docent heeft nog geen inleverplek ingesteld. Je kunt hieronder wel alvast een kopie op dit apparaat bewaren."));
    }
    if (teacher) {
      const setBtn = h("button", { class: "btn btn-ghost small" }, submit ? "🔗 Inleverlink wijzigen" : "🔗 Inleverlink instellen");
      setBtn.addEventListener("click", function () { const u = window.prompt("Plak de inleverlink voor de video's (Google Classroom-opdracht of Google Form met bestandsupload):", (submit && submit.link) || ""); if (u == null) return; const d = load(LS.docs, {}); if (u.trim()) d.submit = { link: u.trim() }; else delete d.submit; save(LS.docs, d); toast("✔ Inleverlink opgeslagen."); go("dashboard"); });
      card.append(h("div", { class: "doc-teacher" }, setBtn));
      const help = h("details", { class: "doc-help" },
        h("summary", {}, "❔ Hoe maak ik een privé-inleverplek? (Google Classroom of Form)"),
        h("div", { class: "doc-help-body", html:
          "<strong>Google Classroom (aanrader):</strong>" +
          "<ol><li>Ga naar classroom.google.com → je klas → <em>Schoolwerk</em> → <em>Maken → Opdracht</em>.</li>" +
          "<li>Geef 'm een titel (bv. « Ma fable — video ») en zet bij <em>Inleveren</em> dat leerlingen een bestand toevoegen.</li>" +
          "<li>Klik <em>Opgeven</em>, open de opdracht en kopieer de link.</li>" +
          "<li>Plak die hier via « Inleverlink instellen ». Alleen jij ziet de inzendingen.</li></ol>" +
          "<strong>Of een Google Form:</strong> maak een formulier, voeg een vraag van het type <em>Bestand uploaden</em> toe, en deel de formulier-link. Antwoorden komen alleen bij jou binnen." }));
      card.append(help);
    }

    const status = h("div", { class: "submit-status" });
    function refresh() {
      status.innerHTML = "";
      const meta = progress.answers["myvideo"];
      if (meta && meta.name) {
        status.append(h("div", { class: "submit-done" }, "✓ Ingeleverd: " + meta.name));
        const play = h("button", { class: "btn btn-ghost small" }, "▶️ Bekijk mijn video");
        play.addEventListener("click", function () { IDB.get("myvideo").then(function (b) { if (!b) { toast("Video staat niet op dit apparaat."); return; } playFileModal(b, meta.name, "video"); }); });
        const rm = h("button", { class: "teacher-link" }, "opnieuw inleveren");
        rm.addEventListener("click", function () { delete progress.answers["myvideo"]; save(LS.progress, progress); IDB.del("myvideo"); refresh(); });
        status.append(play, rm);
      }
    }
    const fi = h("input", { type: "file", accept: "video/*", hidden: "" });
    const up = h("label", { class: "btn btn-gold small" }, "📤 Video inleveren", fi);
    fi.addEventListener("change", function () {
      const f = fi.files[0]; if (!f) return;
      IDB.put("myvideo", f).then(function () { progress.answers["myvideo"] = { name: f.name }; save(LS.progress, progress); toast("✔ Je video is privé ingeleverd."); refresh(); }).catch(function () { toast("Opslaan mislukt (bestand te groot voor dit apparaat?)."); });
    });
    card.append(up, status);
    refresh();
    return card;
  }

  function renderDashboard(view) {
    view.append(h("div", { class: "view-head" }, h("h2", {}, "📊 Dashboard"), h("p", {}, "Jouw voortgang, badges en portfolio.")));
    view.append(renderGrowthPath());
    const grid = h("div", { class: "dash-grid" });

    // profile card
    const pctAll = Math.round(stepsDoneCount() / TOTAL_STEPS * 100);
    const av = h("div", { class: "profile-avatar" }); avatarInto(av, profile.avatar);
    const profCard = h("div", { class: "dash-card" },
      h("div", { class: "profile-head" }, av,
        h("div", {}, h("div", { class: "profile-name" }, profile.name), h("div", { class: "profile-role" }, "Leerling-schrijver van Jean"))),
      h("div", { class: "stat-row" },
        h("div", { class: "stat" }, h("span", { class: "big" }, "🪶 " + progress.feathers), h("span", { class: "lbl" }, "Veren")),
        h("div", { class: "stat" }, h("span", { class: "big" }, progress.badges.length + "/6"), h("span", { class: "lbl" }, "Badges")),
        h("div", { class: "stat" }, h("span", { class: "big" }, pctAll + "%"), h("span", { class: "lbl" }, "Voltooid"))
      ),
      h("div", { style: "margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center" },
        h("button", { class: "btn btn-ghost small", onClick: editProfile }, "✏️ Naam/plaatje wijzigen"),
        h("button", { class: "btn btn-royal small", onClick: () => go("leaderboard") }, "🏆 Ranglijst"))
    );

    // badges
    const shelf = h("div", { class: "badge-shelf" });
    Object.keys(BADGES).forEach((id) => {
      const b = BADGES[id], earned = progress.badges.indexOf(id) !== -1;
      shelf.append(h("div", { class: "badge" + (earned ? " earned" : "") },
        h("div", { class: "badge-ico" }, b.icon), h("div", { class: "badge-name" }, b.name)));
    });
    const badgeCard = h("div", { class: "dash-card" }, h("h3", {}, "🎖️ Behaalde badges"), shelf);

    // chapters
    const list = h("div", { class: "chapter-mini-list" });
    CHAPTERS.forEach((ch) => {
      const done = chapterDone(ch), unlocked = chapterUnlocked(ch.num);
      list.append(h("div", { class: "chapter-mini" },
        h("span", { class: "cm-ico" }, ch.emoji),
        h("span", { class: "cm-name" }, "H" + ch.num + " · " + ch.title),
        h("span", { class: "cm-state", style: done ? "background:var(--gold);color:#3a2a0c" : unlocked ? "background:#3f6b4b22;color:var(--forest)" : "background:#c9b79433;color:#7a684a" },
          done ? "Voltooid" : unlocked ? chapterProgressPct(ch) + "%" : "🔒")));
    });
    const chapCard = h("div", { class: "dash-card" }, h("h3", {}, "📚 Hoofdstukken"), list);

    // portfolio (reflections + fabel + product)
    const portfolio = buildPortfolio();

    const fbCard = renderFeedbackCard();
    if (fbCard) grid.append(fbCard);
    grid.append(profCard, renderAdaptiveCard(), badgeCard, renderDocsCard(), renderSubmissionCard(), renderPrepCard(), chapCard, portfolio);
    view.append(grid);

    view.append(h("div", { class: "danger-zone" }, h("button", { class: "reset-link", onClick: () => {
      if (confirm("Weet je zeker dat je ALLE voortgang wilt wissen? Dit kan niet ongedaan worden gemaakt.")) {
        progress = defaultProgress(); save(LS.progress, progress);
        board = board.filter((r) => !r.me); save(LS.board, board);
        syncBoard(); refreshChrome(); go("dashboard"); toast("Voortgang gewist.");
      }
    } }, "Voortgang wissen")));
  }

  function buildPortfolio() {
    const card = h("div", { class: "dash-card" }, h("h3", {}, "🗂️ Mijn portfolio"));
    let any = false;
    // fabel-kit (verzameling met ★)
    const col = getCollection();
    if (collectionCount() > 0) {
      any = true;
      card.append(h("h4", { class: "pf-sub" }, "⭐ Mijn fabel-kit"));
      if (col.animaux.length) card.append(h("div", { class: "kit-row" }, h("strong", {}, "Dieren: "), kitChips("animaux", "—")));
      if (col.morales.length) card.append(h("div", { class: "kit-row" }, h("strong", {}, "Moralen: "), kitChips("morales", "—")));
      if (col.mots.length) card.append(h("div", { class: "kit-row" }, h("strong", {}, "Woorden: "), kitChips("mots", "—")));
    }
    // atelier-fabel
    const atelierStory = (progress.answers["atelier:story"] || "").trim();
    if (atelierStory) {
      any = true;
      card.append(h("h4", { class: "pf-sub" }, "✒️ Mijn fabel (uit het atelier)"));
      card.append(h("div", { class: "fabel-preview" }, atelierStory));
    }
    // fabel (schrijfwerkplaats H5)
    const K = "ch5:1:";
    const titre = progress.answers[K + "titre"];
    if (titre) {
      any = true;
      card.append(h("div", { style: "margin-bottom:10px" },
        h("strong", {}, "📕 Mijn fabel: "), titre,
        h("div", { class: "fabel-preview", style: "margin-top:6px" },
          (progress.answers[K + "pers"] ? "Personages: " + progress.answers[K + "pers"] + "\n" : "") +
          (progress.answers[K + "prob"] ? progress.answers[K + "prob"] + "\n\n" : "") +
          (progress.answers[K + "fin"] ? progress.answers[K + "fin"] + "\n\n" : "") +
          (progress.answers[K + "mfr"] ? "Morale: " + progress.answers[K + "mfr"] + "\n" : "") +
          (progress.answers[K + "mnl"] ? "(" + progress.answers[K + "mnl"] + ")" : ""))));
    }
    // product
    if (progress.product && progress.product.name) {
      any = true;
      card.append(h("div", { style: "margin-bottom:10px" }, h("strong", {}, "🚀 Eindproduct: "), progress.product.name + (progress.product.file ? " — " + progress.product.file : "")));
      if (progress.product.fileData) card.append(h("img", { src: progress.product.fileData, style: "max-width:200px;border-radius:10px;border:2px solid var(--parchment-dark)" }));
    }
    // reflections
    const reflectKeys = Object.keys(progress.answers).filter((k) => /:r\d+$/.test(k) && progress.answers[k]);
    if (reflectKeys.length) {
      any = true;
      card.append(h("strong", {}, "💭 Reflecties:"));
      const ul = h("ul", { style: "font-family:var(--font-serif);line-height:1.5" });
      reflectKeys.slice(0, 8).forEach((k) => ul.append(h("li", {}, progress.answers[k])));
      card.append(ul);
    }
    if (!any) card.append(h("p", { style: "color:var(--ink-soft);font-style:italic" }, "Nog niets in je portfolio. Werk de hoofdstukken af om hier je fabel, reflecties en eindproduct te verzamelen."));
    return card;
  }

  /* =========================================================
     LEADERBOARD
     ========================================================= */
  function renderLeaderboard(view) {
    view.append(h("div", { class: "view-head" }, h("h2", {}, "🏆 Ranglijst van de klas"), h("p", {}, "Wie verzamelt de meeste veren? Blijf spelen om te stijgen!")));
    const sorted = [...board].sort((a, b) => (b.feathers - a.feathers) || (b.badges - a.badges));
    const card = h("div", { class: "dash-card" });
    if (!sorted.length) { card.append(h("div", { class: "board-empty" }, "Nog geen spelers.")); view.append(card); return; }
    const table = h("table", { class: "board-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "#"), h("th", {}, "Speler"), h("th", {}, "🪶 Veren"), h("th", {}, "🎖️ Badges"))));
    const tb = h("tbody", {});
    sorted.forEach((r, i) => {
      const av = h("span", { class: "board-avatar" }); avatarInto(av, r.avatar);
      const rankCls = i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "";
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
      tb.append(h("tr", { class: "board-row" + (r.me ? " me" : "") },
        h("td", {}, h("span", { class: "rank-badge " + rankCls }, medal)),
        h("td", {}, av, r.name + (r.me ? " (jij)" : "")),
        h("td", {}, "🪶 " + r.feathers),
        h("td", {}, "🎖️ " + r.badges)));
    });
    table.append(tb);
    card.append(table);
    view.append(card);
    view.append(h("p", { style: "text-align:center;color:#c9b48a;font-style:italic;margin-top:14px" }, "De ranglijst wordt automatisch opgeslagen op dit apparaat."));

    // ---- docent-zone: alleen dit (gemachtigde) apparaat kan de ranglijst resetten ----
    if (isTeacher()) {
      view.append(h("div", { class: "teacher-zone" },
        h("span", { class: "teacher-badge" }, "🔓 Docentmodus actief op dit apparaat"),
        h("button", { class: "btn teacher-reset", onClick: resetLeaderboard }, "🗑️ Ranglijst van de klas resetten"),
        h("button", { class: "teacher-link", onClick: () => {
          if (confirm("Docentmodus op dit apparaat uitschakelen? Je kunt de ranglijst dan niet meer resetten tot je de code opnieuw invoert.")) {
            localStorage.removeItem(LS.teacher); toast("Docentmodus uitgeschakeld."); go("leaderboard");
          }
        } }, "Docentmodus uitschakelen")));
    } else {
      view.append(h("div", { class: "teacher-zone" },
        h("button", { class: "teacher-link", onClick: grantTeacherAccess }, "🔒 Docent — ranglijst beheren")));
    }
  }

  function resetLeaderboard() {
    if (!isTeacher()) { toast("Alleen een gemachtigd docent-apparaat kan dit."); return; }
    if (!confirm("Weet je zeker dat je de ranglijst van de klas wilt resetten? Alle behaalde scores op dit apparaat worden gewist.")) return;
    board = seedBoard();
    save(LS.board, board);
    syncBoard();          // eigen rij van de huidige gebruiker weer toevoegen
    refreshChrome();
    go("leaderboard");
    toast("🏆 Ranglijst gereset.");
  }

  /* =========================================================
     VERSAILLES SVG SCENE (hotspots)
     ========================================================= */
  function buildVersailles(onFind, foundSet) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    // viewBox afgestemd op de echte foto (img/versailles.jpg, ~1024x619)
    svg.setAttribute("viewBox", "0 0 1024 619");
    // echte foto van het Château de Versailles als achtergrond
    const img = document.createElementNS(NS, "image");
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", "img/versailles.jpg");
    img.setAttribute("href", "img/versailles.jpg");
    img.setAttribute("x", "0"); img.setAttribute("y", "0");
    img.setAttribute("width", "1024"); img.setAttribute("height", "619");
    img.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.append(img);
    // subtiele donkere gloed onderaan zodat de verstopte markers opvallen
    const shade = document.createElementNS(NS, "rect");
    shade.setAttribute("x", "0"); shade.setAttribute("y", "470");
    shade.setAttribute("width", "1024"); shade.setAttribute("height", "149");
    shade.setAttribute("fill", "#000"); shade.setAttribute("opacity", "0.12");
    svg.append(shade);

    // Hotspot groups — glanzende symbolen verstopt over de echte foto
    const spot = (id, inner, x, y) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "hotspot" + (foundSet.has(id) ? " found" : ""));
      g.setAttribute("data-id", id);
      g.setAttribute("transform", `translate(${x},${y})`);
      g.innerHTML = `<circle r="30" fill="rgba(255,255,255,.12)" stroke="rgba(232,200,106,.6)" stroke-width="2"/>` + inner;
      g.style.cursor = "pointer";
      g.addEventListener("click", () => onFind(id));
      svg.append(g);
      return g;
    };
    // sun — in de lucht boven het paleis
    spot("sun", `<circle r="20" fill="#f2c94c" stroke="#d9a520" stroke-width="2"/>${[...Array(8)].map((_,i)=>{const a=i*Math.PI/4;return `<line x1="${Math.cos(a)*22}" y1="${Math.sin(a)*22}" x2="${Math.cos(a)*32}" y2="${Math.sin(a)*32}" stroke="#d9a520" stroke-width="3"/>`;}).join("")}`, 300, 120);
    // crown — bovenop het centrale paviljoen
    spot("crown", `<polygon points="-18,10 -18,-6 -9,4 0,-12 9,4 18,-6 18,10" fill="#f2c94c" stroke="#b8860b" stroke-width="2"/><circle cx="-9" cy="-8" r="3" fill="#d64550"/><circle cx="9" cy="-8" r="3" fill="#d64550"/><circle cx="0" cy="-15" r="3" fill="#3a6ea5"/>`, 512, 360);
    // mirror — bij een van de vensters van de vleugel
    spot("mirror", `<rect x="-15" y="-28" width="30" height="56" rx="15" fill="#cfe6ff" stroke="#7fa8d8" stroke-width="3"/><line x1="-6" y1="-22" x2="-1" y2="20" stroke="#fff" stroke-width="4" opacity="0.7"/>`, 210, 470);
    // garden — standbeeld/heg op de binnenplaats
    spot("garden", `<circle cx="0" cy="0" r="17" fill="#4f7a3a"/><circle cx="-13" cy="6" r="11" fill="#5c8a45"/><circle cx="13" cy="6" r="11" fill="#5c8a45"/><rect x="-4" y="9" width="8" height="14" fill="#6b4a2a"/>`, 150, 560);
    // key — verstopt op de grond van de Cour de Marbre
    spot("key", `<circle cx="-8" cy="0" r="8" fill="none" stroke="#c79a3b" stroke-width="4"/><rect x="-2" y="-2" width="22" height="4" fill="#c79a3b"/><rect x="14" y="2" width="4" height="7" fill="#c79a3b"/><rect x="8" y="2" width="4" height="7" fill="#c79a3b"/>`, 860, 560);
    return svg;
  }

  /* ---------------- utils ---------------- */
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* =========================================================
     WOORDSPEL — Memory (fr ↔ nl)
     ========================================================= */
  function openMemoryGame(words, label) {
    const pairs = shuffle(words.slice()).slice(0, 6);
    const cards = [];
    pairs.forEach((w, i) => {
      cards.push({ pair: i, text: (w.emoji ? w.emoji + " " : "") + w.fr });
      cards.push({ pair: i, text: w.nl });
    });
    shuffle(cards);
    $("#banque-root").classList.add("hidden"); // sluit de banque zodat het spel vooraan staat
    const body = $("#modal-body");
    body.innerHTML = "";
    body.append(h("div", { class: "modal-emoji" }, "🎮"), h("h3", {}, "Memory — " + label),
      h("p", {}, "Vind elk Frans woord bij zijn vertaling. Klik twee kaarten om te draaien."));
    const grid = h("div", { class: "memory-grid" });
    const status = h("p", { style: "text-align:center;font-weight:800;min-height:1.3em" });
    let first = null, lock = false, matched = 0;
    cards.forEach((c) => {
      const card = h("div", { class: "mem-card" }, h("span", { class: "mem-face" }, c.text));
      card.addEventListener("click", () => {
        if (lock || card.classList.contains("flip") || card.classList.contains("done")) return;
        card.classList.add("flip");
        if (!first) { first = card; first._pair = c.pair; return; }
        if (first._pair === c.pair && first !== card) {
          first.classList.add("done"); card.classList.add("done"); matched++;
          first = null;
          if (matched === pairs.length) { status.style.color = "#3f6b4b"; status.textContent = "Bravo ! Alles gevonden 🎉"; }
        } else {
          lock = true; const a = first;
          setTimeout(() => { a.classList.remove("flip"); card.classList.remove("flip"); first = null; lock = false; }, 800);
        }
      });
      grid.append(card);
    });
    body.append(grid, status);
    $("#modal-root").classList.remove("hidden");
  }

  /* =========================================================
     GROEIPAD & FABEL-VOORBEREIDING (portfolio-verdieping)
     ========================================================= */
  const PREP_QUESTIONS = [
    "Wat heb ik in dit project geleerd?",
    "Welke nieuwe Franse woorden ken ik nu?",
    "Welke woorden wil ik in mijn eigen fabel gebruiken?",
    "Welke moraal spreekt mij het meest aan?",
    "Welke dieren wil ik gebruiken?",
    "Welke ideeën neem ik mee voor mijn fabel?"
  ];
  function fableGrowthStages() {
    const c = getCollection();
    const A = (f) => progress.answers["atelier:" + f];
    const prepFilled = PREP_QUESTIONS.some((_, i) => (progress.answers["prep:" + i] || "").trim().length > 1);
    const animalsChosen = c.animaux.length > 0 || ((A("animals") || []).length > 0);
    const moraleChosen = c.morales.length > 0 || !!A("morale");
    const story = (A("story") || "").trim();
    return [
      { label: "Woorden verzamelen", ok: collectionCount() >= 5, hint: "Bewaar ≥5 items met ★ in de Banque of fabels" },
      { label: "Dieren kiezen", ok: animalsChosen, hint: "Kies je fabeldieren (Atelier of ★)" },
      { label: "Moraal kiezen", ok: moraleChosen, hint: "Kies een moraal" },
      { label: "Reflecteren", ok: prepFilled, hint: "Vul je fabel-voorbereiding in" },
      { label: "Fabel schrijven", ok: !!story, hint: "Schrijf je fabel in het Atelier" }
    ];
  }
  function renderGrowthPath() {
    const stages = fableGrowthStages();
    const doneN = stages.filter((s) => s.ok).length;
    const card = h("div", { class: "dash-card growth-card" },
      h("h3", {}, "🌱 Mijn groeipad naar de eigen fabel"),
      h("p", { style: "margin-top:-4px;color:var(--ink-soft)" }, "Zo groeit jouw fabel stap voor stap uit alles wat je verzamelt en leert."));
    const track = h("div", { class: "growth-track" });
    stages.forEach((s, i) => {
      track.append(h("div", { class: "growth-node " + (s.ok ? "ok" : "todo"), title: s.hint },
        h("div", { class: "gn-dot" }, s.ok ? "✓" : (i + 1)),
        h("div", { class: "gn-label" }, s.label)));
    });
    card.append(track);
    card.append(h("div", { class: "mini-bar", style: "width:100%;margin-top:6px" }, h("i", { style: "width:" + Math.round(doneN / stages.length * 100) + "%" })));
    card.append(h("p", { style: "text-align:center;font-weight:800;color:var(--gold-deep);margin:8px 0 0" }, doneN + " / " + stages.length + " stappen — " + (doneN === stages.length ? "klaar om te schrijven! ✒️" : "ga zo door!")));
    return card;
  }
  function renderPrepCard() {
    const card = h("div", { class: "dash-card" }, h("h3", {}, "🎯 Mijn fabel-voorbereiding"),
      h("p", { style: "margin-top:-4px;color:var(--ink-soft)" }, "Beantwoord na elke module. Je antwoorden helpen je straks bij het schrijven."));
    PREP_QUESTIONS.forEach((q, i) => {
      const key = "prep:" + i;
      const ta = h("textarea", { class: "textarea-input", style: "min-height:60px", placeholder: "Jouw antwoord..." });
      ta.value = progress.answers[key] || "";
      ta.addEventListener("input", () => { progress.answers[key] = ta.value; save(LS.progress, progress); scheduleFbSync(); });
      card.append(h("div", { class: "field-block" }, h("label", {}, (i + 1) + ". " + q), ta));
    });
    card.append(h("button", { class: "btn btn-gold small", onClick: () => { toast("✓ Voorbereiding opgeslagen"); go("dashboard"); } }, "Opslaan & groeipad bijwerken"));
    return card;
  }
  function kitChips(bucket, emptyText) {
    const items = getCollection()[bucket];
    const wrap = h("div", { class: "kit-chips" });
    if (!items.length) { wrap.append(h("span", { class: "kit-empty" }, emptyText)); return wrap; }
    items.forEach((it) => {
      const label = (it.fr || it) + (it.nl ? " (" + it.nl + ")" : "");
      const chip = h("span", { class: "kit-chip" }, label,
        h("button", { class: "kit-x", title: "Verwijderen" }, "✕"));
      chip.querySelector(".kit-x").addEventListener("click", () => { toggleCollection(bucket, it); go(currentRoute.name || "dashboard"); });
      wrap.append(chip);
    });
    return wrap;
  }

  /* =========================================================
     BANQUE DE MOTS & DE PHRASES (zwevende taalhulp)
     ========================================================= */
  function initBanque() {
    const launcher = $("#banque-launcher");
    const root = $("#banque-root");
    const tabs = $("#banque-tabs");
    const body = $("#banque-body");
    const search = $("#banque-search");
    let active = "animaux";
    launcher.addEventListener("click", () => {
      root.classList.remove("hidden"); draw();
      if (progress) { progress.banqueClicks = (progress.banqueClicks || 0) + 1; save(LS.progress, progress); }
    });
    document.querySelectorAll("[data-close-banque]").forEach((el) => el.addEventListener("click", () => root.classList.add("hidden")));
    search.addEventListener("input", draw);

    function wordRow(frText, nl, emoji, saveBucket) {
      const row = h("div", { class: "banque-word" },
        h("button", { class: "bw-speak", title: "Voorlezen", onClick: () => speak(frText) }, "🔊"),
        h("span", { class: "bw-fr" }, (emoji ? emoji + " " : "") + frText),
        h("span", { class: "bw-nl" }, nl));
      if (saveBucket) {
        const on = inCollection(saveBucket, frText);
        const star = h("button", { class: "bw-star" + (on ? " on" : ""), title: "Bewaar voor mijn fabel" }, on ? "★" : "☆");
        star.addEventListener("click", () => {
          const added = toggleCollection(saveBucket, { fr: frText, nl: nl });
          star.classList.toggle("on", added); star.textContent = added ? "★" : "☆";
          toast(added ? "⭐ Bewaard in jouw fabel-kit" : "Verwijderd uit je kit");
        });
        row.append(star);
      }
      return row;
    }
    const bucketFor = (k) => (k === "animaux" ? "animaux" : k === "morales" ? "morales" : "mots");
    function drawTabs() {
      tabs.innerHTML = "";
      Object.keys(VOCAB).forEach((k) => {
        const b = h("button", { class: "banque-tab" + (active === k ? " active" : "") }, VOCAB[k].icon + " " + VOCAB[k].label);
        b.addEventListener("click", () => { active = k; search.value = ""; draw(); });
        tabs.append(b);
      });
      const pb = h("button", { class: "banque-tab" + (active === "phrases" ? " active" : "") }, "✍️ Zinnen");
      pb.addEventListener("click", () => { active = "phrases"; search.value = ""; draw(); });
      tabs.append(pb);
    }
    function draw() {
      drawTabs();
      body.innerHTML = "";
      const q = search.value.trim().toLowerCase();
      if (q) {
        let n = 0;
        Object.keys(VOCAB).forEach((k) => VOCAB[k].words.forEach((w) => {
          if (w.fr.toLowerCase().indexOf(q) !== -1 || w.nl.toLowerCase().indexOf(q) !== -1) { body.append(wordRow(w.fr, w.nl, w.emoji, bucketFor(k))); n++; }
        }));
        PHRASES.forEach((p) => { if (p.fr.toLowerCase().indexOf(q) !== -1 || p.nl.toLowerCase().indexOf(q) !== -1) { body.append(wordRow(p.fr, p.nl)); n++; } });
        if (!n) body.append(h("p", { class: "banque-empty" }, "Geen resultaten voor « " + search.value + " »."));
        return;
      }
      if (active === "phrases") {
        const cats = [];
        PHRASES.forEach((p) => { if (cats.indexOf(p.cat) === -1) cats.push(p.cat); });
        cats.forEach((c) => {
          body.append(h("div", { class: "banque-cat" }, c));
          PHRASES.filter((p) => p.cat === c).forEach((p) => body.append(wordRow(p.fr, p.nl)));
        });
      } else {
        body.append(h("button", { class: "btn btn-royal small block", style: "margin-bottom:10px", onClick: () => openMemoryGame(VOCAB[active].words, VOCAB[active].label) }, "🎮 Speel memory met deze woorden"));
        body.append(h("div", { class: "banque-cat" }, VOCAB[active].labelFr + " — " + VOCAB[active].label + "  ·  ☆ = bewaar voor je fabel"));
        VOCAB[active].words.forEach((w) => body.append(wordRow(w.fr, w.nl, w.emoji, bucketFor(active))));
      }
    }
  }
  function showBanqueLauncher() { const l = $("#banque-launcher"); if (l) l.classList.remove("hidden"); }

  /* =========================================================
     VOORBEELDFABELS
     ========================================================= */
  function renderFables(view) {
    view.append(h("div", { class: "view-head" }, h("h2", {}, "📚 Voorbeeldfabels"),
      h("p", {}, "Kies je niveau-route: 🟢 makkelijk (A1), 🟡 gemiddeld (A2) of 🔴 uitdaging (B1). Lees, luister en oefen.")));
    const lv = abilityLevel();
    view.append(h("div", { class: "adapt-banner " + lv.cls },
      h("span", {}, "🎯 Aanbevolen voor jou: " + lv.label + " — " + lv.nl + ". We tonen alvast niveau " + lv.rec + "; kies gerust zelf.")));
    const levels = ["Alle", "A1", "A2", "B1"];
    let active = lv.rec || "Alle";
    const filterRow = h("div", { class: "fable-filter" });
    const grid = h("div", { class: "fable-grid" });
    function draw() {
      filterRow.innerHTML = "";
      levels.forEach((lv) => {
        const chip = h("button", { class: "filter-chip" + (active === lv ? " active" : "") }, lv === "Alle" ? "Alle" : levelInfo(lv).label);
        chip.addEventListener("click", () => { active = lv; draw(); });
        filterRow.append(chip);
      });
      grid.innerHTML = "";
      FABLES.filter((f) => active === "Alle" || f.level === active).forEach((f) => {
        const li = levelInfo(f.level);
        grid.append(h("div", { class: "fable-card", onClick: () => go("fable", f.id) },
          h("div", { class: "fable-thumb" }, h("img", { src: f.img, alt: f.titleFr, loading: "lazy" }), h("span", { class: "fable-lvlbadge " + li.cls }, li.label)),
          h("div", { class: "fable-cardbody" },
            h("h3", {}, f.emoji + " " + f.titleFr),
            h("p", { class: "fable-nl" }, "« " + f.titleNl + " »"),
            h("span", { class: "fable-level" }, "lezen · luisteren · oefenen" + (f.challenge ? " · ⭐ extra uitdaging" : "")))));
      });
    }
    view.append(filterRow, grid);
    draw();
  }

  function renderFable(view, id) {
    const f = FABLES.find((x) => x.id === id);
    if (!f) { go("fables"); return; }
    view.append(h("button", { class: "back-link", onClick: () => go("fables") }, "← Terug naar de fabels"));
    view.append(h("div", { class: "fable-hero" },
      h("div", { class: "fable-hero-img" }, h("img", { src: f.img, alt: f.titleFr })),
      h("div", { class: "fable-hero-txt" },
        h("h2", {}, f.emoji + " " + f.titleFr),
        h("p", { class: "hero-sub" }, "« " + f.titleNl + " »"),
        h("span", { class: "fable-lvlbadge " + levelInfo(f.level).cls, style: "display:inline-block;margin:2px 0 8px" }, levelInfo(f.level).label),
        h("br"),
        h("button", { class: "btn btn-gold small", onClick: () => speak(f.lines.map((l) => l.fr).join(" ")) }, "🔊 Lees de hele fabel voor"))));

    // Vóór het lezen — activeer voorkennis
    if (f.predict) {
      const predictCard = h("div", { class: "activity-card read-predict" },
        h("h3", {}, "🔍 Vóór het lezen — wat verwacht je?"),
        h("p", { class: "predict-scenario" }, f.predict.scenario),
        h("p", { class: "predict-q" }, "💬 " + f.predict.v));
      view.append(predictCard);
    }

    // Leestips — uitklapbaar boven de tekst
    const tipsData = [
      { ico: "🔍", tip: "Snap je een woord niet? Kijk of er woordhulp staat onder de zin — de gekleurde chips helpen je verder." },
      { ico: "➡️", tip: "Begrijp je een zin niet? Lees gewoon door — de volgende zin maakt het vaak duidelijk." },
      { ico: "🔊", tip: "Lees de zin hardop of gebruik de 🔊 knop. Horen helpt soms meer dan lezen." },
      { ico: "🧠", tip: "Stel jezelf steeds de vraag: wie doet wat, en waarom? Dan snap je de hoofdgedachte." }
    ];
    const tipsToggle = h("details", { class: "leestips-block" },
      h("summary", { class: "leestips-summary" }, "💡 Leestips — hoe lees je een Franse tekst?"));
    const tipsList = h("ul", { class: "leestips-list" });
    tipsData.forEach(function(t) {
      tipsList.append(h("li", {}, h("span", { class: "tip-ico" }, t.ico), " " + t.tip));
    });
    tipsToggle.append(tipsList);
    view.append(tipsToggle);

    // tekst met glossen + niveaulaag-toggle
    const textCard = h("div", { class: "activity-card" }, h("h3", {}, "📖 De fabel (met Franse woordhulp)"));
    let fableSimple = false;
    const linesWrap = h("div", { class: "fable-lines-wrap" });

    function drawFableLines() {
      linesWrap.innerHTML = "";
      const lines = (fableSimple && f.linesSimple) ? f.linesSimple : f.lines;
      lines.forEach((l) => {
        linesWrap.append(h("div", { class: "fable-line" },
          h("button", { class: "bw-speak", title: "Voorlezen", onClick: () => speak(l.fr) }, "🔊"),
          h("span", { class: "fable-fr" }, l.fr)));
        if (l.w && l.w.length) {
          const gl = h("div", { class: "fable-gloss" });
          l.w.forEach((p) => gl.append(h("span", { class: "gloss-chip" }, p[0] + " = " + p[1])));
          linesWrap.append(gl);
        }
      });
      // moraal staat nu los, ná de vragen
    }
    drawFableLines();
    textCard.append(linesWrap);

    if (f.linesSimple) {
      const toggleBtn = h("button", { class: "btn-simple-toggle" }, "📖 Te moeilijk? Lees de makkelijkere versie");
      toggleBtn.addEventListener("click", function() {
        fableSimple = !fableSimple;
        toggleBtn.textContent = fableSimple ? "↩️ Terug naar de originele tekst" : "📖 Te moeilijk? Lees de makkelijkere versie";
        toggleBtn.classList.toggle("is-back", fableSimple);
        drawFableLines();
      });
      textCard.append(toggleBtn);
    }

    view.append(textCard);

    view.append(buildFableVocab(f));
    view.append(buildFableQuiz(f));

    // Moraal onthullen ná de vragen
    const moraalCard = h("div", { class: "activity-card moraal-card" },
      h("h3", {}, "💡 Wat is de moraal?"),
      h("p", { class: "moraal-intro" }, "Je hebt de fabel gelezen en de vragen beantwoord. Wat is volgens jou de boodschap van dit verhaal?"));
    const moraalReveal = h("div", { class: "moraal-reveal" },
      h("div", { class: "fable-moral" },
        h("button", { class: "bw-speak", title: "Voorlezen", onClick: () => speak(f.moral.fr) }, "🔊"),
        h("strong", {}, "Morale : "),
        h("span", { class: "fable-fr" }, f.moral.fr),
        h("div", { class: "moral-nl" }, "→ " + f.moral.nl)));
    moraalReveal.style.display = "none";
    const revealBtn = h("button", { class: "btn btn-gold" }, "🔓 Onthul de echte moraal");
    revealBtn.addEventListener("click", function() {
      moraalReveal.style.display = "block";
      revealBtn.style.display = "none";
    });
    moraalCard.append(revealBtn, moraalReveal);
    view.append(moraalCard);

    if (f.challenge && f.challenge.length) {
      const ch = buildFableChallenge(f);
      const lv = abilityLevel();
      if (lv.key === "uitdaging") { ch.open = true; ch.prepend(h("div", { class: "adapt-note" }, "🔴 Uitdaging-route: deze extra vragen staan voor jou open!")); }
      else if (lv.key === "steun") ch.prepend(h("div", { class: "adapt-note steun" }, "🟢 Geen zorgen — deze extra uitdaging is optioneel."));
      view.append(ch);
    }

    view.append(h("div", { style: "text-align:center;margin-top:16px" },
      h("button", { class: "btn btn-royal", onClick: () => go("atelier") }, "✒️ Ga naar het schrijfatelier")));
  }

  function buildFableVocab(f) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, "🃏 Oefen de woorden"),
      h("p", {}, "Klik op een kaart om de vertaling te zien. Klik op 🔊 om het woord te horen."));
    const grid = h("div", { class: "flash-grid" });
    const vocabList = vocabGet(f.id) || f.vocab;
    vocabList.forEach((pair) => {
      const card2 = h("div", { class: "flash-card" });
      const front = h("div", { class: "flash-front" },
        h("button", { class: "bw-speak", onClick: (e) => { e.stopPropagation(); speak(pair[0]); } }, "🔊"),
        h("span", {}, pair[0]));
      const back = h("div", { class: "flash-back hidden" }, pair[1]);
      card2.append(front, back);
      card2.addEventListener("click", () => { front.classList.toggle("hidden"); back.classList.toggle("hidden"); });
      grid.append(card2);
    });
    card.append(grid);
    return card;
  }

  function levelInfo(lvl) {
    return ({ A1: { cls: "lvl-a1", label: "🟢 A1 · makkelijk" }, A2: { cls: "lvl-a2", label: "🟡 A2 · gemiddeld" }, B1: { cls: "lvl-b1", label: "🔴 B1 · uitdaging" } })[lvl] || { cls: "", label: lvl };
  }
  function appendQuizQuestions(host, questions) {
    const total = questions.length; let doneCount = 0;
    const done = h("div", {});
    questions.forEach((q, qi) => {
      host.append(renderQuizQ(q, {
        onCorrect: () => { doneCount++; if (doneCount === total) { done.innerHTML = ""; done.append(h("div", { style: "text-align:center" }, h("span", { class: "status-pill done" }, "✓ Goed gedaan!"))); } },
        onWrong: () => { }
      }, { num: qi + 1 }));
    });
    host.append(done);
  }
  function buildFableQuiz(f) {
    const card = h("div", { class: "activity-card" }, h("h3", {}, "❓ Begrijp je de fabel?"));
    appendQuizQuestions(card, f.quiz);
    return card;
  }
  function buildFableChallenge(f) {
    const wrap = h("details", { class: "fable-challenge" }, h("summary", {}, "⭐ Extra uitdaging (moeilijker) — voor wie meer aankan"));
    const body = h("div", { class: "challenge-body" });
    appendQuizQuestions(body, f.challenge);
    wrap.append(body);
    return wrap;
  }

  /* =========================================================
     SCHRIJFATELIER — begeleide 7-staps fabeleditor
     ========================================================= */
  const ATELIER_PROBLEMS = [
    { fr: "L'un veut tromper l'autre.", nl: "De één wil de ander bedriegen." },
    { fr: "L'un est trop fier.", nl: "De één is te trots." },
    { fr: "L'un a faim et demande de l'aide.", nl: "De één heeft honger en vraagt om hulp." },
    { fr: "Ils font une course.", nl: "Ze houden een wedstrijd." },
    { fr: "L'un se moque de l'autre.", nl: "De één lacht de ander uit." },
    { fr: "L'un est en danger.", nl: "De één is in gevaar." }
  ];
  const ATELIER_STEPS = ["Dieren", "Eigenschappen", "Probleem", "Locatie", "Moraal", "Dialoog", "Verhaal"];

  function renderAtelier(view) {
    const AK = (f) => "atelier:" + f;
    const get = (f, dflt) => (progress.answers[AK(f)] !== undefined ? progress.answers[AK(f)] : dflt);
    const set = (f, v) => { progress.answers[AK(f)] = v; save(LS.progress, progress); scheduleFbSync(); };

    const atelierTekst = dbGet().atelierOpdracht || dbDefaults().atelierOpdracht;
    view.append(h("div", { class: "view-head" }, h("h2", {}, "✒️ Le Petit Atelier — schrijf je eigen fabel"),
      h("p", {}, atelierTekst)));
    view.append(h("div", { class: "atelier-dice" },
      h("button", { class: "btn btn-royal", onClick: () => rollInspiration() }, "🎲 Verras me!"),
      h("span", { class: "dice-hint" }, "Even geen idee? Laat het lot dieren, probleem én moraal voor je kiezen.")));

    let cur = get("step", 0);
    const stepper = h("div", { class: "atelier-stepper" });
    const host = h("div", { class: "atelier-host" });
    const preview = h("div", { class: "atelier-preview" });
    const sideKit = h("div", { class: "atelier-kit" });
    view.append(stepper);
    view.append(h("div", { class: "atelier-layout" }, host, h("div", { class: "atelier-side" },
      h("h4", {}, "📜 Jouw fabel tot nu toe"), preview,
      h("button", { class: "btn btn-ghost small block", onClick: () => $("#banque-launcher").click() }, "📖 Open Banque de mots"),
      sideKit)));

    function drawKit() {
      sideKit.innerHTML = "";
      const c = getCollection();
      if (!collectionCount()) { sideKit.append(h("p", { class: "kit-empty" }, "Tip: bewaar woorden met ★ in de Banque en de fabels — ze verschijnen hier.")); return; }
      sideKit.append(h("h4", {}, "⭐ Uit jouw fabel-kit"));
      if (c.animaux.length) {
        sideKit.append(h("div", { class: "kit-mini-label" }, "Dieren (klik = kies):"));
        const row = h("div", { class: "kit-chips" });
        c.animaux.forEach((a) => {
          const fr = a.fr || a;
          const chip = h("button", { class: "kit-chip pick" }, fr);
          chip.addEventListener("click", () => { let arr = get("animals", []).slice(); if (arr.indexOf(fr) === -1) { if (arr.length >= 2) arr.shift(); arr.push(fr); set("animals", arr); drawStep(); } });
          row.append(chip);
        });
        sideKit.append(row);
      }
      if (c.morales.length) {
        sideKit.append(h("div", { class: "kit-mini-label" }, "Moralen (klik = kies):"));
        const row = h("div", { class: "kit-chips" });
        c.morales.forEach((m) => {
          const fr = m.fr || m;
          const chip = h("button", { class: "kit-chip pick", title: fr }, fr.length > 26 ? fr.slice(0, 26) + "…" : fr);
          chip.addEventListener("click", () => { set("morale", fr); drawStep(); });
          row.append(chip);
        });
        sideKit.append(row);
      }
      if (c.mots.length) {
        sideKit.append(h("div", { class: "kit-mini-label" }, "Woorden:"));
        const row = h("div", { class: "kit-chips" });
        c.mots.forEach((w) => row.append(h("span", { class: "kit-chip" }, (w.fr || w) + (w.nl ? " (" + w.nl + ")" : ""))));
        sideKit.append(row);
      }
    }

    function drawStepper() {
      stepper.innerHTML = "";
      ATELIER_STEPS.forEach((s, i) => {
        const d = h("div", { class: "astep " + (i === cur ? "active " : "") + (i < cur ? "done" : "") }, (i + 1) + ". " + s);
        d.addEventListener("click", () => { cur = i; set("step", cur); drawStepper(); drawStep(); });
        stepper.append(d);
      });
    }

    function chip(label, selected, onClick) {
      const c = h("button", { class: "pick-chip" + (selected ? " selected" : ""), type: "button" }, label);
      c.addEventListener("click", onClick);
      return c;
    }
    function speakBtn(txt) { return h("button", { class: "bw-speak", onClick: (e) => { e.stopPropagation(); speak(txt); } }, "🔊"); }

    function drawPreview() {
      const a = get("animals", []);
      const tr = get("traits", []);
      const lieu = get("lieu", "");
      const prob = get("probleme", "");
      const morale = get("morale", "");
      const d1 = get("dial1", ""), d2 = get("dial2", "");
      const story = get("story", "");
      if (story.trim()) { preview.textContent = story; return; }
      let t = "";
      if (a.length) t += "Il était une fois " + a.join(" et ") + (tr.length ? " (" + tr.join(", ") + ")" : "") + (lieu ? " " + lieu : "") + ".\n\n";
      if (prob) t += prob + "\n\n";
      if (d1) t += "« " + d1 + " »\n";
      if (d2) t += "« " + d2 + " »\n";
      if (morale) t += "\nMorale : " + morale;
      preview.textContent = t || "(hier verschijnt je fabel terwijl je kiest)";
    }

    function rollInspiration() {
      const pick = (arr, n) => shuffle(arr.slice()).slice(0, n);
      set("animals", pick(VOCAB.animaux.words, 2).map((w) => w.fr));
      set("traits", pick(VOCAB.caractere.words, 2).map((w) => w.fr));
      set("lieu", pick(VOCAB.lieux.words, 1)[0].fr);
      set("morale", pick(VOCAB.morales.words, 1)[0].fr);
      set("probleme", pick(ATELIER_PROBLEMS, 1)[0].fr);
      toast("🎲 Verrassing! Dieren, probleem en moraal zijn ingevuld.");
      drawStepper(); drawStep(); drawPreview();
    }

    function drawStep() {
      host.innerHTML = "";
      const card = h("div", { class: "activity-card" });
      host.append(card);

      if (cur === 0) {
        card.append(h("h3", {}, "Stap 1 — Kies twee dieren"), h("p", {}, "Klik op twee dieren (les animaux)."));
        const chosen = get("animals", []);
        const grid = h("div", { class: "pick-grid" });
        VOCAB.animaux.words.forEach((w) => {
          const label = w.emoji + " " + w.fr + " (" + w.nl + ")";
          grid.append(chip(label, chosen.indexOf(w.fr) !== -1, () => {
            let arr = get("animals", []).slice();
            const i = arr.indexOf(w.fr);
            if (i !== -1) arr.splice(i, 1); else { if (arr.length >= 2) arr.shift(); arr.push(w.fr); }
            set("animals", arr); drawStep(); drawPreview();
          }));
        });
        card.append(grid);
      } else if (cur === 1) {
        card.append(h("h3", {}, "Stap 2 — Kies eigenschappen"), h("p", {}, "Welk karakter hebben je dieren? (le caractère)"));
        const chosen = get("traits", []);
        const grid = h("div", { class: "pick-grid" });
        VOCAB.caractere.words.forEach((w) => {
          grid.append(chip(w.fr + " (" + w.nl + ")", chosen.indexOf(w.fr) !== -1, () => {
            let arr = get("traits", []).slice();
            const i = arr.indexOf(w.fr);
            if (i !== -1) arr.splice(i, 1); else arr.push(w.fr);
            set("traits", arr); drawStep(); drawPreview();
          }));
        });
        card.append(grid);
      } else if (cur === 2) {
        card.append(h("h3", {}, "Stap 3 — Kies een probleem"), h("p", {}, "Wat gaat er mis in je fabel?"));
        const chosen = get("probleme", "");
        const grid = h("div", { class: "pick-list" });
        ATELIER_PROBLEMS.forEach((p) => {
          const row = h("div", { class: "pick-row" + (chosen === p.fr ? " selected" : "") },
            speakBtn(p.fr),
            h("div", {}, h("div", { class: "pr-fr" }, p.fr), h("div", { class: "pr-nl" }, p.nl)));
          row.addEventListener("click", () => { set("probleme", p.fr); drawStep(); drawPreview(); });
          grid.append(row);
        });
        card.append(grid);
      } else if (cur === 3) {
        card.append(h("h3", {}, "Stap 4 — Kies een locatie"), h("p", {}, "Waar speelt je fabel? (le lieu)"));
        const chosen = get("lieu", "");
        const grid = h("div", { class: "pick-grid" });
        VOCAB.lieux.words.forEach((w) => {
          grid.append(chip(w.fr + " (" + w.nl + ")", chosen === w.fr, () => { set("lieu", w.fr); drawStep(); drawPreview(); }));
        });
        card.append(grid);
      } else if (cur === 4) {
        card.append(h("h3", {}, "Stap 5 — Kies een moraal"), h("p", {}, "Welke les leert je fabel? (la morale)"));
        const chosen = get("morale", "");
        const grid = h("div", { class: "pick-list" });
        VOCAB.morales.words.forEach((w) => {
          const row = h("div", { class: "pick-row" + (chosen === w.fr ? " selected" : "") },
            speakBtn(w.fr),
            h("div", {}, h("div", { class: "pr-fr" }, w.fr), h("div", { class: "pr-nl" }, w.nl)));
          row.addEventListener("click", () => { set("morale", w.fr); drawStep(); drawPreview(); });
          grid.append(row);
        });
        card.append(grid);
      } else if (cur === 5) {
        card.append(h("h3", {}, "Stap 6 — Bouw dialogen"), h("p", {}, "Laat je dieren praten. Gebruik de voorbeeldzinnen hieronder."));
        const hints = ["« Bonjour ! Comme tu es beau ! »", "« Aide-moi, s'il te plaît. »", "« Je peux gagner ! »", "« Que fais-tu ici ? »"];
        const hintWrap = h("div", { class: "phrase-hints" });
        hints.forEach((hh) => hintWrap.append(h("button", { class: "phrase-hint", onClick: () => { speak(hh); } }, "🔊 " + hh)));
        card.append(hintWrap);
        const d1 = h("input", { class: "text-input", placeholder: "Dialoog 1 (bv. « Bonjour ! »)", value: get("dial1", "") });
        const d2 = h("input", { class: "text-input", placeholder: "Dialoog 2", value: get("dial2", "") });
        d1.value = get("dial1", ""); d2.value = get("dial2", "");
        d1.addEventListener("input", () => { set("dial1", d1.value); drawPreview(); });
        d2.addEventListener("input", () => { set("dial2", d2.value); drawPreview(); });
        card.append(h("div", { class: "field-block" }, h("label", {}, "Dialoog 1"), d1));
        card.append(h("div", { class: "field-block" }, h("label", {}, "Dialoog 2"), d2));
      } else if (cur === 6) {
        card.append(h("h3", {}, "Stap 7 — Schrijf je fabel"), h("p", {}, "Klik zin-blokken en woorden om ze in je verhaal te zetten, of typ zelf. Gebruik ook de Banque de mots."));
        const ta = h("textarea", { class: "textarea-input", style: "min-height:220px", placeholder: "Schrijf hier je fabel in het Frans... (of gebruik de blokken hieronder)" });
        ta.value = get("story", "");
        function insertBlock(text) {
          const s = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
          const e = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
          const before = ta.value.slice(0, s), after = ta.value.slice(e);
          const sep = (before && !/\s$/.test(before)) ? " " : "";
          ta.value = before + sep + text + " " + after;
          const pos = (before + sep + text + " ").length;
          try { ta.setSelectionRange(pos, pos); ta.focus(); } catch (err) {}
          set("story", ta.value); drawPreview(); updateChecklist();
        }
        function updateChecklist() {
          checklist.innerHTML = "";
          const st = get("story", "") || "";
          [["Minstens 2 dieren", get("animals", []).length >= 2],
           ["Een probleem/conflict", !!get("probleme", "")],
           ["Een moraal", !!get("morale", "") || /morale/i.test(st)],
           ["Een dialoog", !!(get("dial1", "") || get("dial2", "")) || /«/.test(st)],
           ["Een verhaal geschreven", st.trim().length >= 40]].forEach((it) => {
            checklist.append(h("div", { class: "check-item" + (it[1] ? " ok" : "") }, (it[1] ? "✅ " : "⬜ ") + it[0]));
          });
        }
        card.append(h("button", { class: "btn btn-ghost small", onClick: () => {
          drawPreview(); const scaffold = preview.textContent;
          if (ta.value.trim() && !confirm("Je huidige tekst overschrijven met de opzet uit stap 1-6?")) return;
          ta.value = scaffold === "(hier verschijnt je fabel terwijl je kiest)" ? "" : scaffold;
          set("story", ta.value); drawPreview(); updateChecklist();
        } }, "✨ Vul opzet in vanuit mijn keuzes"));
        // zinbouwstenen
        card.append(h("h4", { style: "font-family:var(--font-ui);color:var(--ink-soft);margin-bottom:4px" }, "🧱 Zinbouwstenen (klik = toevoegen)"));
        const blocks = ["Il était une fois", "Un jour,", "Soudain,", "Alors,", "Ensuite,", "Mais", "Finalement,", "dit-il.", "dit-elle.", "« Bonjour ! »", "« Aide-moi ! »", "La morale est :"];
        const blockWrap = h("div", { class: "block-wrap" });
        blocks.forEach((b) => { const btn = h("button", { class: "build-block", type: "button" }, b); btn.addEventListener("click", () => insertBlock(b)); blockWrap.append(btn); });
        card.append(blockWrap);
        // eigen bewaarde woorden
        const mots = getCollection().mots;
        if (mots.length) {
          card.append(h("h4", { style: "font-family:var(--font-ui);color:var(--ink-soft);margin-bottom:4px" }, "⭐ Jouw woorden (klik = toevoegen)"));
          const mw = h("div", { class: "block-wrap" });
          mots.forEach((w) => { const fr = w.fr || w; const btn = h("button", { class: "build-block word", type: "button" }, fr); btn.addEventListener("click", () => insertBlock(fr)); mw.append(btn); });
          card.append(mw);
        }
        ta.addEventListener("input", () => { set("story", ta.value); drawPreview(); updateChecklist(); });
        card.append(h("div", { class: "field-block" }, h("label", {}, "Ma fable"), ta));
        // live checklist
        card.append(h("h4", { style: "font-family:var(--font-ui);color:var(--ink-soft);margin-bottom:4px" }, "✅ Checklist"));
        const checklist = h("div", { class: "build-checklist" });
        card.append(checklist);
        updateChecklist();
        card.append(h("p", { style: "font-style:italic;color:var(--ink-soft)" }, "💡 Tip: je fabel wordt automatisch bewaard en verschijnt in je portfolio."));
      }

      // navigatie
      const nav = h("div", { class: "atelier-nav" },
        h("button", { class: "btn btn-ghost small", disabled: cur === 0 ? "" : null, onClick: () => { if (cur > 0) { cur--; set("step", cur); drawStepper(); drawStep(); } } }, "◀ Vorige"),
        cur < ATELIER_STEPS.length - 1
          ? h("button", { class: "btn btn-gold small", onClick: () => { cur++; set("step", cur); drawStepper(); drawStep(); } }, "Volgende ▶")
          : h("button", { class: "btn btn-gold small", onClick: () => { toast("✓ Je fabel is opgeslagen in je portfolio!"); } }, "✓ Klaar & opslaan"));
      card.append(nav);
      drawPreview();
      drawKit();
    }

    drawStepper();
    drawStep();
  }

  /* =========================================================
     VIDÉOTHÈQUE
     ========================================================= */
  function youtubeId(url) {
    if (!url) return null;
    url = url.trim();
    if (/^[\w-]{11}$/.test(url)) return url;
    const m = url.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/|\/live\/|\/v\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  // YouTube-thumbnail met afspeelknop. Bij file:// (dubbelklik) opent de video op YouTube;
  // op een echte server speelt hij direct in de pagina. Zo nooit een YouTube-foutbox.
  function youtubeFacade(id, title) {
    const frame = h("div", { class: "video-frame yt-facade" });
    const thumb = h("img", { class: "yt-thumb", src: "https://img.youtube.com/vi/" + id + "/hqdefault.jpg", alt: title || "video", loading: "lazy" });
    thumb.addEventListener("error", function () { thumb.src = "https://img.youtube.com/vi/" + id + "/0.jpg"; });
    const play = h("div", { class: "yt-play" }, "▶");
    frame.append(thumb, play);
    frame.addEventListener("click", function () {
      if (location.protocol === "file:") {
        window.open("https://www.youtube.com/watch?v=" + id, "_blank", "noopener");
      } else {
        frame.innerHTML = "";
        frame.append(h("iframe", { src: "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0", title: title, frameborder: "0", allowfullscreen: "", allow: "autoplay; encrypted-media; picture-in-picture; fullscreen" }));
      }
    });
    return frame;
  }

  // Universele video-weergave: YouTube, Vimeo, Google Drive, .mp4-link of lokaal bestand
  function videoNode(v) {
    if (v.local) {
      const frame = h("div", { class: "video-frame" });
      IDB.get("vid_" + v.id).then(function (blob) {
        if (!blob) { frame.append(h("div", { class: "video-bad" }, "⚠️ Video staat niet op dit apparaat")); return; }
        frame.append(h("video", { src: URL.createObjectURL(blob), controls: "", playsinline: "" }));
      }).catch(function () { frame.append(h("div", { class: "video-bad" }, "⚠️ Kon de video niet laden")); });
      return frame;
    }
    const url = (v.youtube || v.url || "").trim();
    const yid = youtubeId(url);
    if (yid) return youtubeFacade(yid, v.title);
    const vim = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vim) return h("div", { class: "video-frame" }, h("iframe", { src: "https://player.vimeo.com/video/" + vim[1], title: v.title, frameborder: "0", allowfullscreen: "", loading: "lazy" }));
    const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (drive) return h("div", { class: "video-frame" }, h("iframe", { src: "https://drive.google.com/file/d/" + drive[1] + "/preview", title: v.title, frameborder: "0", allowfullscreen: "", loading: "lazy" }));
    if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url)) return h("div", { class: "video-frame" }, h("video", { src: url, controls: "", playsinline: "" }));
    if (/^https?:\/\//i.test(url)) return h("div", { class: "video-frame video-link" }, h("a", { href: url, target: "_blank", rel: "noopener", class: "btn btn-gold" }, "▶️ Video openen"));
    return h("div", { class: "video-frame video-bad" }, "⚠️ Ongeldige video-link");
  }
  function renderVideotheque(view) {
    view.append(h("div", { class: "view-head" }, h("h2", {}, "🎬 Vidéothèque"),
      h("p", {}, "Kijk video's over fabels, uitleg en voorbeeld-eindproducten.")));
    const videos = load(LS.videos, []);
    const teacher = isTeacher();

    if (teacher) {
      view.append(buildVideoForm(view));
    } else {
      view.append(h("div", { class: "teacher-zone", style: "margin-top:0" },
        h("button", { class: "teacher-link", onClick: grantTeacherAccess }, "🔒 Docent — video's beheren")));
    }

    VIDEO_CATEGORIES.forEach((cat) => {
      const inCat = videos.filter((v) => v.cat === cat.id);
      const card = h("div", { class: "dash-card" },
        h("h3", {}, cat.icon + " " + cat.label),
        h("p", { style: "margin-top:-4px;color:var(--ink-soft)" }, cat.desc));
      if (!inCat.length) {
        card.append(h("p", { class: "board-empty" }, teacher ? "Nog geen video's. Voeg er hierboven een toe." : "Nog geen video's in deze categorie."));
      } else {
        const grid = h("div", { class: "video-grid" });
        inCat.forEach((v) => {
          const box = h("div", { class: "video-item" });
          box.append(videoNode(v));
          box.append(h("div", { class: "video-title" }, v.title));
          if (v.note) box.append(h("div", { class: "video-note" }, "📝 Opdracht: " + v.note));
          if (teacher) box.append(h("button", { class: "teacher-link", onClick: () => {
            if (confirm("Deze video verwijderen?")) { const arr = load(LS.videos, []).filter((x) => x.id !== v.id); save(LS.videos, arr); if (v.local) IDB.del("vid_" + v.id); go("videotheque"); }
          } }, "🗑️ Verwijderen"));
          grid.append(box);
        });
        card.append(grid);
      }
      view.append(card);
    });
  }
  function buildVideoForm() {
    const card = h("div", { class: "dash-card", style: "border-color:var(--gold)" }, h("h3", {}, "➕ Video toevoegen (docent)"));
    const title = h("input", { class: "text-input", placeholder: "Titel van de video" });
    const url = h("input", { class: "text-input", placeholder: "Plak een link: YouTube, Vimeo, Google Drive of .mp4" });
    const note = h("input", { class: "text-input", placeholder: "Optionele opdracht bij deze video" });
    const cat = h("select", { class: "text-input" });
    VIDEO_CATEGORIES.forEach((c) => cat.append(h("option", { value: c.id }, c.label)));
    const fileInput = h("input", { type: "file", accept: "video/*", hidden: "" });
    const fileName = h("span", { class: "upload-hint" });
    const fileLabel = h("label", { class: "btn btn-ghost small" }, "📤 Of upload een videobestand", fileInput);
    let chosenFile = null;
    fileInput.addEventListener("change", () => { chosenFile = fileInput.files[0] || null; fileName.textContent = chosenFile ? "Gekozen: " + chosenFile.name : ""; });
    card.append(
      h("div", { class: "field-block" }, h("label", {}, "Titel"), title),
      h("div", { class: "field-block" }, h("label", {}, "Video-link"), url),
      h("div", { class: "field-block" }, h("label", {}, "Categorie"), cat),
      h("div", { class: "field-block" }, h("label", {}, "Opdracht (optioneel)"), note),
      h("div", { style: "display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px" }, fileLabel, fileName),
      h("button", { class: "btn btn-gold", onClick: () => {
        if (!title.value.trim()) { toast("Geef de video een titel."); return; }
        const link = url.value.trim();
        const id = "v" + Date.now();
        const arr = load(LS.videos, []);
        if (chosenFile) {
          IDB.put("vid_" + id, chosenFile).then(() => {
            arr.push({ id: id, cat: cat.value, title: title.value.trim(), local: true, name: chosenFile.name, note: note.value.trim() });
            save(LS.videos, arr); toast("🎬 Video (bestand) toegevoegd!"); go("videotheque");
          }).catch(() => toast("Opslaan mislukt (bestand te groot?)."));
          return;
        }
        if (!/^https?:\/\//i.test(link)) { toast("Plak een geldige link (https://...) of upload een bestand."); return; }
        arr.push({ id: id, cat: cat.value, title: title.value.trim(), url: link, note: note.value.trim() });
        save(LS.videos, arr); toast("🎬 Video toegevoegd!"); go("videotheque");
      } }, "Video toevoegen"),
      h("p", { class: "doc-note" }, "Tip: gewone YouTube-, Vimeo- of Google Drive-links werken. Bij Google Drive: zet het bestand op « iedereen met de link kan bekijken »."));
    return card;
  }

  /* =========================================================
     IMMERSIEVE BELEVENISSEN (echte foto's + Jean als gids)
     ========================================================= */
  function renderWorld(view) {
    view.append(h("div", { class: "view-head" }, h("h2", {}, "🏛️ Immersieve belevenissen"),
      h("p", {}, "Stap in elk level als een échte plek. Jean gidst je rond, jij klikt op de gloeiende plekken en verzamelt Franse woorden voor je fabel.")));
    const grid = h("div", { class: "world-hub" });
    const order = [["ch1", "🏡"], ["ch2", "👑"], ["ch3", "🦊"], ["ch4", "✒️"], ["ch5", "🖋️"], ["ch6", "🏆"]];
    order.forEach((pair) => {
      const id = pair[0], cfg = IMMERSIVE[id];
      if (!cfg) return;
      const done = !!progress.answers["imm:" + id + ":done"];
      const tile = h("div", { class: "world-tile" },
        h("div", { class: "wt-emoji" }, pair[1]),
        h("h3", {}, cfg.title),
        h("p", {}, cfg.subtitle),
        cfg.pano ? h("span", { class: "pano-badge" }, "🌐 echte 360°") : null,
        h("span", { class: "wt-badge" }, done ? "✓ Voltooid — opnieuw" : "▶ Betreden"));
      tile.addEventListener("click", () => go("belevenis", id));
      grid.append(tile);
    });
    view.append(grid);
  }

  function launchImmersive(view, chId) {
    const cfg = IMMERSIVE[chId];
    if (!cfg) { go("world"); return; }
    if (cfg.pano) { launchPano(view, chId, cfg); return; }
    view.innerHTML = "";
    const num = parseInt((chId || "").replace("ch", ""), 10);
    const foundKey = "imm:" + chId + ":found";
    const store = () => progress.answers[foundKey] || [];
    const setStore = (a) => { progress.answers[foundKey] = a; save(LS.progress, progress); };
    const totalHot = cfg.scenes.reduce((n, s) => n + (s.hotspots ? s.hotspots.length : 0), 0);
    const hotId = (s, idx) => s.id + "#" + idx;
    let si = 0, gi = 0;

    view.append(h("button", { class: "back-link", onClick: () => go("chapter", num) }, "← Terug naar hoofdstuk " + num));
    const stage = h("div", { class: "imm-stage" });
    view.append(stage);

    function draw() {
      const s = cfg.scenes[si];
      stage.innerHTML = "";
      const photo = h("div", { class: "imm-photo" }, h("img", { src: s.img, alt: s.name }));
      stage.append(photo, h("div", { class: "imm-vignette" }));
      stage.append(h("div", { class: "imm-topbar" },
        h("div", { class: "imm-title" }, cfg.title + " — " + s.name),
        h("div", { class: "imm-count" }, "🃏 " + store().length + " / " + totalHot),
        h("button", { class: "btn btn-ghost small", onClick: () => go("chapter", num) }, "✕ Verlaten")));
      (s.hotspots || []).forEach((hs, idx) => {
        const id = hotId(s, idx), done = store().indexOf(id) !== -1;
        const mk = h("button", { class: "imm-hot" + (done ? " found" : ""), style: "left:" + hs.x + "%;top:" + hs.y + "%" }, done ? "✓" : (hs.ico || "❓"));
        mk.addEventListener("click", () => {
          if (store().indexOf(id) === -1) setStore(store().concat([id]));
          openImmCard(hs.card);
          draw();
        });
        stage.append(mk);
      });
      // Jean-gids
      const line = s.guide[Math.min(gi, s.guide.length - 1)];
      stage.append(h("div", { class: "imm-guide" },
        h("div", { class: "imm-jean" }, h("img", { src: "img/jean_portrait.jpg", alt: "Jean" })),
        h("div", { class: "imm-guidebody" },
          h("div", { class: "imm-say" }, line),
          h("div", { class: "imm-guidebtns" },
            h("button", { class: "bw-speak", onClick: () => speak(line, "nl-NL") }, "🔊"),
            (gi < s.guide.length - 1) ? h("button", { class: "btn btn-gold small", onClick: () => { gi++; draw(); } }, "Volgende ▸") : h("span", { class: "imm-hint" }, "« " + s.fr + " »")))));
      // ruimte-navigatie
      const dots = h("div", { class: "imm-dots" });
      cfg.scenes.forEach((_, k) => { const d = h("span", { class: "imm-dot" + (k === si ? " active" : "") }); d.addEventListener("click", () => { si = k; gi = 0; draw(); }); dots.append(d); });
      stage.append(h("div", { class: "imm-nav" },
        h("button", { class: "btn btn-ghost small", disabled: si === 0 ? "" : null, onClick: () => { if (si > 0) { si--; gi = 0; draw(); } } }, "◀ Vorige"),
        dots,
        (si < cfg.scenes.length - 1)
          ? h("button", { class: "btn btn-royal small", onClick: () => { si++; gi = 0; draw(); } }, "Volgende ruimte ▶")
          : h("button", { class: "btn btn-gold small", onClick: finish }, "Belevenis afronden ✓")));
    }
    function finish() {
      if (store().length < totalHot) { toast("Ontdek eerst alle plekken (❓) in de ruimtes."); return; }
      completeImmersive(chId, totalHot);
    }
    draw();
    // parallax voor diepte-effect
    stage.addEventListener("mousemove", (e) => {
      const img = stage.querySelector(".imm-photo img"); if (!img) return;
      const r = stage.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      img.style.transform = "scale(1.08) translate(" + (-dx * 20) + "px," + (-dy * 16) + "px)";
    });
  }

  // pratend personage: portret + spraakbel, met eigen stem/taal
  function openCharacter(hs) {
    const body = $("#modal-body");
    let li = 0;
    function draw() {
      body.innerHTML = "";
      const line = hs.lines[Math.min(li, hs.lines.length - 1)];
      body.append(h("div", { class: "char-dialogue" },
        h("div", { class: "char-portrait" }, hs.img ? h("img", { src: hs.img, alt: hs.name }) : h("span", { class: "char-emoji" }, hs.emoji || "🗣️")),
        h("div", { class: "char-bubble" },
          h("div", { class: "char-name" }, hs.name),
          h("div", { class: "char-text" }, line.text),
          h("div", { class: "char-btns" },
            h("button", { class: "bw-speak", onClick: () => speak(line.text, line.lang || "nl-NL") }, "🔊"),
            (li < hs.lines.length - 1)
              ? h("button", { class: "btn btn-gold small", onClick: () => { li++; draw(); speak(hs.lines[li].text, hs.lines[li].lang || "nl-NL"); } }, "Volgende ▸")
              : h("button", { class: "btn btn-gold small", onClick: closeModal }, "Klaar")))));
    }
    draw();
    speak(hs.lines[0].text, hs.lines[0].lang || "nl-NL");
    $("#modal-root").classList.remove("hidden");
  }

  /* ---- sfeergeluid per belevenis (procedureel, Web Audio — geen bestanden nodig) ---- */
  const Ambient = (function () {
    let ctx = null, master = null, nodes = [], timer = null, current = null, muted = false;
    function ensure() {
      if (!ctx) { try { const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); } catch (e) { ctx = null; } }
      return ctx;
    }
    function clear() { if (timer) { clearInterval(timer); timer = null; } nodes.forEach((n) => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect && n.disconnect(); } catch (e) {} }); nodes = []; }
    function noiseBuf() { const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3; } return b; }
    function drone(freqs, g0) { freqs.forEach((f) => { const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f; const g = ctx.createGain(); g.gain.value = g0; o.connect(g); g.connect(master); o.start(); nodes.push(o, g); }); }
    function wind(g0) { const s = ctx.createBufferSource(); s.buffer = noiseBuf(); s.loop = true; const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 500; const g = ctx.createGain(); g.gain.value = g0; s.connect(f); f.connect(g); g.connect(master); s.start(); nodes.push(s, f, g); }
    function chirp() { if (!ctx) return; const o = ctx.createOscillator(); o.type = "sine"; const g = ctx.createGain(); const t = ctx.currentTime; const base = 1800 + Math.random() * 1200; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.08); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.22); }
    function scratch() { if (!ctx) return; const s = ctx.createBufferSource(); s.buffer = noiseBuf(); const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2600; const g = ctx.createGain(); const t = ctx.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 0.2); }
    function play(scene) {
      if (!ensure()) return;
      if (current === scene && nodes.length) return;
      current = scene; clear();
      try { ctx.resume(); } catch (e) {}
      if (scene === "palace") drone([130.8, 196.0, 261.6], 0.04);
      else if (scene === "forest") { wind(0.06); timer = setInterval(() => { if (Math.random() < 0.6) chirp(); }, 1400); }
      else if (scene === "village") { wind(0.04); timer = setInterval(() => { if (Math.random() < 0.4) chirp(); }, 2000); }
      else if (scene === "study") { wind(0.02); timer = setInterval(() => { if (Math.random() < 0.5) scratch(); }, 2600); }
      else wind(0.03);
      try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(muted ? 0 : 0.6, ctx.currentTime + 1.2); } catch (e) {}
    }
    function stop() { clear(); current = null; if (master && ctx) { try { master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4); } catch (e) {} } }
    function setMuted(m) { muted = m; if (master && ctx) { try { master.gain.value = m ? 0 : 0.6; } catch (e) {} } }
    function isMuted() { return muted; }
    return { play: play, stop: stop, setMuted: setMuted, isMuted: isMuted };
  })();
  const AMBIENT_SCENE = { ch1: "village", ch2: "palace", ch3: "forest", ch4: "study", ch5: "study", ch6: "palace" };

  function openImmCard(card) {
    const body = $("#modal-body");
    body.innerHTML = "";
    body.append(h("div", { class: "modal-emoji" }, card.emoji || "🃏"), h("h3", {}, card.title));
    if (card.img) body.append(h("img", { class: "imm-cardimg", src: card.img, alt: card.title }));
    body.append(h("div", { html: "<p>" + card.text + "</p>" }));
    if (card.words && card.words.length) {
      const wl = h("div", { class: "imm-words" });
      card.words.forEach((pr) => {
        const saved = inCollection("mots", pr[0]);
        const sv = h("button", { class: "bw-speak", title: "Bewaar", disabled: saved ? "" : null }, saved ? "★" : "⭐");
        sv.addEventListener("click", () => { toggleCollection("mots", { fr: pr[0], nl: pr[1] }); sv.textContent = "★"; sv.disabled = true; toast("⭐ « " + pr[0] + " » bewaard in je fabel-kit"); });
        wl.append(h("div", { class: "banque-word" },
          h("button", { class: "bw-speak", onClick: () => speak(pr[0]) }, "🔊"),
          h("span", { class: "bw-fr" }, pr[0]), h("span", { class: "bw-nl" }, pr[1]), sv));
      });
      body.append(wl);
    }
    if (card.goto) {
      const gb = h("button", { class: "btn btn-gold", onClick: () => { closeModal(); if (card.goto === "world_banque") $("#banque-launcher").click(); else go(card.goto); } }, "Ga ▶");
      body.append(h("div", { style: "margin-top:10px" }, gb));
    }
    $("#modal-root").classList.remove("hidden");
  }

  function completeImmersive(chId, total) {
    const flag = "imm:" + chId + ":done";
    if (!progress.answers[flag]) {
      progress.answers[flag] = true;
      progress.feathers += 15;
      save(LS.progress, progress);
      flyFeathers(6); syncBoard(); refreshChrome();
    }
    showModal("🎉", "Belevenis voltooid!",
      "<p>Je hebt <strong>" + IMMERSIVE[chId].title + "</strong> verkend! (+15 veren)</p><p>De Franse woorden die je bewaarde staan in je fabel-kit voor als je zelf een fabel schrijft.</p>");
  }

  /* ---- opdracht-quiz in een ruimte ---- */
  function openTaskQuiz(q, onCorrect) {
    const body = $("#modal-body");
    body.innerHTML = "";
    body.append(h("div", { class: "modal-emoji" }, "❓"), h("h3", {}, "Opdracht"));
    body.append(renderQuizQ(q, {
      onCorrect: () => { setTimeout(() => { closeModal(); if (onCorrect) onCorrect(); }, 900); },
      onWrong: () => { }
    }));
    $("#modal-root").classList.remove("hidden");
  }

  /* ---- echte 360°-belevenis (DOM: sleep door de equirectangular foto; werkt ook via file://) ---- */
  function launchPano(view, chId, cfg) {
    view.innerHTML = "";
    const num = parseInt((chId || "").replace("ch", ""), 10);
    view.append(h("button", { class: "back-link", onClick: () => go("chapter", num) }, "← Terug naar hoofdstuk " + num));
    // sfeergeluid van deze belevenis
    Ambient.setMuted(load("flf_muted", false));
    Ambient.play(cfg.ambient || AMBIENT_SCENE[chId]);
    const foundKey = "imm:" + chId + ":found";
    const store = () => progress.answers[foundKey] || [];
    const setStore = (a) => { progress.answers[foundKey] = a; save(LS.progress, progress); };
    const total = cfg.hotspots.length;
    const hid = (i) => "h" + i;

    const stage = h("div", { class: "pano-stage" });
    const track = h("div", { class: "pano-track" });
    const hotLayer = h("div", { class: "pano-hotlayer" });
    const overlay = h("div", { class: "pano-overlay" });
    stage.append(track, hotLayer, overlay);
    view.append(stage);

    let TW = 0, TH = 0, offX = 0, offY = 0, ready = false, gi = 0;
    let dragging = false, lx = 0, ly = 0, moved = false;
    const markers = [];

    const img = new Image();
    img.onerror = function () { track.style.background = "#222"; overlay.append(h("div", { class: "pano-attr" }, "360°-foto kon niet laden.")); };
    img.onload = function () { setup(); };
    img.src = cfg.pano;

    function setup() {
      const sH = stage.clientHeight || 520;
      TH = sH * 1.9;
      TW = TH * (img.naturalWidth / img.naturalHeight);
      track.style.backgroundImage = "url('" + cfg.pano + "')";
      track.style.backgroundSize = TW + "px " + TH + "px";
      offY = (TH - sH) / 2;
      offX = TW * 0.5;
      buildMarkers();
      ready = true;
      render();
    }
    function buildMarkers() {
      hotLayer.innerHTML = ""; markers.length = 0;
      cfg.hotspots.forEach(function (hs, i) {
        const isFound = store().indexOf(hid(i)) !== -1;
        const mk = h("button", { class: "imm-hot" + (isFound ? " found" : "") }, isFound ? "✓" : (hs.ico || "❓"));
        mk._xFull = ((((hs.yaw / 360) + 0.5) % 1) + 1) % 1 * TW;
        mk._yFull = TH * (0.5 - (hs.pitch || 0) / 180);
        mk.addEventListener("click", function (e) { e.stopPropagation(); if (moved) return; onHot(i, hs, mk); });
        hotLayer.append(mk); markers.push(mk);
      });
    }
    function onHot(i, hs, mk) {
      if (hs.type === "task") openTaskQuiz(hs.quiz, function () { markFound(i, mk); });
      else if (hs.type === "character") { openCharacter(hs); markFound(i, mk); }
      else { openImmCard(hs.card); markFound(i, mk); }
    }
    function markFound(i, mk) {
      if (store().indexOf(hid(i)) === -1) setStore(store().concat([hid(i)]));
      mk.classList.add("found"); mk.textContent = "✓";
      if (store().length >= total) toast("Alles ontdekt! Klik op « Belevenis afronden ».");
      drawOverlay(); // geen automatisch doorgaan; de leerling rondt zelf af
    }
    function render() {
      if (!ready) return;
      const sW = stage.clientWidth, sH = stage.clientHeight;
      offX = ((offX % TW) + TW) % TW;
      offY = Math.max(0, Math.min(TH - sH, offY));
      track.style.backgroundPosition = (-offX) + "px " + (-offY) + "px";
      markers.forEach(function (mk) {
        let px = (((mk._xFull - offX) % TW) + TW) % TW;
        let show = false, sx = px;
        if (px <= sW + 30) { show = true; sx = px; }
        else if (px - TW >= -30) { show = true; sx = px - TW; }
        mk.style.display = show ? "grid" : "none";
        mk.style.left = sx + "px";
        mk.style.top = (mk._yFull - offY) + "px";
      });
    }

    function down(x, y) { dragging = true; moved = false; lx = x; ly = y; stage.classList.add("grabbing"); }
    function move(x, y) { if (!dragging) return; const dx = x - lx, dy = y - ly; lx = x; ly = y; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true; offX -= dx; offY -= dy; render(); }
    function up() { dragging = false; stage.classList.remove("grabbing"); }
    stage.addEventListener("mousedown", function (e) { down(e.clientX, e.clientY); });
    window.addEventListener("mousemove", mm); function mm(e) { move(e.clientX, e.clientY); }
    window.addEventListener("mouseup", up);
    stage.addEventListener("touchstart", function (e) { const t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
    stage.addEventListener("touchmove", function (e) { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
    stage.addEventListener("touchend", up);

    function drawOverlay() {
      overlay.innerHTML = "";
      overlay.append(h("div", { class: "imm-topbar" },
        h("div", { class: "imm-title" }, cfg.title),
        h("div", { class: "imm-count" }, "🔎 Ontdekt: " + store().length + " / " + total),
        h("button", { class: "btn btn-ghost small", title: "Sfeergeluid aan/uit", onClick: function () { const m = !Ambient.isMuted(); Ambient.setMuted(m); save("flf_muted", m); drawOverlay(); } }, Ambient.isMuted() ? "🔇" : "🔊"),
        h("button", { class: "btn btn-ghost small", onClick: function () { go("chapter", num); } }, "✕ Verlaten")));
      const line = cfg.guide[Math.min(gi, cfg.guide.length - 1)];
      overlay.append(h("div", { class: "imm-guide" },
        h("div", { class: "imm-jean" }, h("img", { src: "img/jean_portrait.jpg", alt: "Jean" })),
        h("div", { class: "imm-guidebody" },
          h("div", { class: "imm-say" }, line),
          h("div", { class: "imm-guidebtns" },
            h("button", { class: "bw-speak", onClick: function () { speak(line, "nl-NL"); } }, "🔊"),
            (gi < cfg.guide.length - 1) ? h("button", { class: "btn btn-gold small", onClick: function () { gi++; drawOverlay(); } }, "Volgende ▸") : h("span", { class: "imm-hint" }, "🖱️ sleep om rond te kijken · klik ❓ voor opdracht")))));
      // afronden gebeurt handmatig (niets gaat vanzelf door)
      const finishRow = h("div", { class: "pano-finish" });
      if (progress.answers["imm:" + chId + ":done"]) {
        finishRow.append(h("span", { class: "pano-finishpill" }, "✓ Belevenis voltooid"));
      } else {
        const all = store().length >= total;
        finishRow.append(h("button", { class: "btn btn-gold small", disabled: all ? null : "", onClick: function () { if (store().length >= total) { completeImmersive(chId, total); drawOverlay(); } else { toast("Ontdek eerst alle plekken (" + store().length + "/" + total + ")."); } } }, all ? "✓ Belevenis afronden" : "Ontdek eerst alles (" + store().length + "/" + total + ")"));
      }
      overlay.append(finishRow);
      if (cfg.attribution) overlay.append(h("div", { class: "pano-attr" }, cfg.attribution));
    }
    drawOverlay();

    function onResize() { if (img.complete && img.naturalWidth) setup(); }
    window.addEventListener("resize", onResize);
    activeWorld = { dispose: function () { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", up); window.removeEventListener("resize", onResize); Ambient.stop(); } };
  }

  /* =========================================================
     TOEGANKELIJKHEID (dyslexie-vriendelijk + voorleesmodus)
     ========================================================= */
  function initA11y() {
    const KEY = "flf_a11y";
    let prefs = {};
    try { prefs = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { prefs = {}; }
    const root = document.documentElement;
    function apply() {
      root.classList.toggle("dyslexia", !!prefs.dyslexia);
      root.classList.toggle("big-text", !!prefs.big);
      root.classList.toggle("read-mode", !!prefs.read);
    }
    function savePrefs() { localStorage.setItem(KEY, JSON.stringify(prefs)); apply(); }
    apply();

    const launcher = $("#a11y-launcher");
    const panel = $("#a11y-panel");
    if (!launcher || !panel) return;
    function buildPanel() {
      panel.innerHTML = "";
      panel.append(h("div", { class: "a11y-head" }, h("strong", {}, "👓 Lees- & voorleeshulp"),
        h("button", { class: "a11y-close", onClick: () => panel.classList.add("hidden") }, "✕")));
      [["dyslexia", "🔤 Dyslexie-vriendelijk lettertype", "Rustiger lettertype met meer ruimte, geen schuine letters."],
       ["big", "🔍 Grotere tekst", "Alle tekst wordt wat groter."],
       ["read", "🔊 Voorleesmodus", "Klik op een stuk tekst om het te laten voorlezen."],
       ["focus", "🎯 Focus-modus", "Verbergt de navigatie en afleiding. Alleen de opdracht is zichtbaar."]].forEach((r) => {
        const on = !!prefs[r[0]];
        const btn = h("button", { class: "a11y-toggle" + (on ? " on" : "") },
          h("span", { class: "a11y-tstate" }, on ? "AAN" : "UIT"),
          h("span", {}, h("div", { class: "a11y-tlabel" }, r[1]), h("div", { class: "a11y-tdesc" }, r[2])));
        btn.addEventListener("click", () => {
          prefs[r[0]] = !prefs[r[0]]; savePrefs(); buildPanel();
          if (r[0] === "read" && prefs.read) toast("Voorleesmodus aan — klik op een stuk tekst om het te horen.");
          if (r[0] === "focus") { document.body.classList.toggle("focus-mode", !!prefs.focus); syncFocusLauncher(); }
        });
        panel.append(btn);
      });
    }
    launcher.addEventListener("click", () => {
      if (panel.classList.contains("hidden")) { buildPanel(); panel.classList.remove("hidden"); }
      else panel.classList.add("hidden");
    });

    // voorleesmodus: klik op tekst → voorlezen. Franse tekst klinkt Frans, de rest Nederlands.
    // Knoppen/opties worden niet voorgelezen, zodat het spel niet verstoord wordt.
    const readSelFR = ".fable-fr,.pr-fr,.tour-fr,.imm-hint,.verdict-badge,.scrambled";
    const readSelNL = "p,li,h1,h2,h3,h4,label,summary,td,.q-text,.reading-doc,.imm-say,.speech,.say-text,.tour-text,.tour-roomname,.clue-q,.clue-label,.pr-nl,.verdict-why,.cf-line,.penalty-answer,.moral-nl,.adapt-banner,.doc-note,.rev-body,.hero-sub,.tour-fact";
    document.addEventListener("click", (e) => {
      if (!root.classList.contains("read-mode")) return;
      if (e.target.closest("button,input,textarea,select,a,#a11y-panel,#a11y-launcher,.banque-panel")) return;
      const fr = e.target.closest(readSelFR);
      const t = fr || e.target.closest(readSelNL);
      if (!t) return;
      const txt = (t.textContent || "").replace(/[«»]/g, "").trim();
      if (!txt) return;
      document.querySelectorAll(".reading-now").forEach((n) => n.classList.remove("reading-now"));
      t.classList.add("reading-now");
      speak(txt.slice(0, 400), fr ? "fr-FR" : "nl-NL");
    }, true);
  }

  /* ---- sort (sorteeropdracht) ---- */
  RENDER.sort = function (step, ch, idx, done, onDone) {
    const card = h("div", { class: "activity-card" });
    card.append(h("h3", {}, step.title));
    card.append(h("p", { class: "step-intro" }, step.intro));

    if (done) {
      card.append(h("div", { style: "text-align:center;margin-top:14px" }, h("span", { class: "status-pill done" }, "✓ Voltooid")));
      return card;
    }

    // shuffle items
    const items = step.items.slice().sort(() => Math.random() - .5);
    const placements = {}; // item index → category
    let mistakes = 0;

    const layout = h("div", { class: "sort-layout" });

    // draggable items pool
    const pool = h("div", { class: "sort-pool" });
    items.forEach(function(item, i) {
      const chip = h("div", { class: "sort-chip", draggable: "true", dataset: { i: i } }, item.text);
      chip.addEventListener("dragstart", function(e) { e.dataTransfer.setData("text/plain", i); });
      pool.append(chip);
    });

    // category drop zones
    const zonesWrap = h("div", { class: "sort-zones" });
    step.categories.forEach(function(cat) {
      const zone = h("div", { class: "sort-zone" },
        h("div", { class: "sort-zone-label" }, cat));
      zone.addEventListener("dragover", function(e) { e.preventDefault(); zone.classList.add("drag-over"); });
      zone.addEventListener("dragleave", function() { zone.classList.remove("drag-over"); });
      zone.addEventListener("drop", function(e) {
        e.preventDefault();
        zone.classList.remove("drag-over");
        const i = parseInt(e.dataTransfer.getData("text/plain"));
        const item = items[i];
        const chip = pool.querySelector("[data-i='" + i + "']") || zonesWrap.querySelector("[data-i='" + i + "']");
        if (!chip) return;
        if (placements[i] && placements[i] !== cat) mistakes++;
        placements[i] = cat;
        chip.classList.remove("sort-wrong", "sort-correct");
        if (cat === item.correct) {
          chip.classList.add("sort-correct");
          chip.draggable = false;
        } else {
          mistakes++;
          chip.classList.add("sort-wrong");
          setTimeout(function() {
            chip.classList.remove("sort-wrong");
            pool.append(chip);
            delete placements[i];
          }, 600);
          zone.append(chip);
          return;
        }
        zone.append(chip);
        // check all done
        const allDone = items.every(function(_, j) { return placements[j] === items[j].correct; });
        if (allDone) {
          const finBtn = h("button", { class: "btn btn-gold big block", style: "margin-top:16px" }, "Voltooid ✒️");
          finBtn.addEventListener("click", function() { onDone(mistakes); });
          card.append(finBtn);
        }
      });
      zonesWrap.append(zone);
    });

    layout.append(pool, zonesWrap);
    card.append(layout);
    return card;
  };

  /* ---- peertip (Firestore — tips zichtbaar voor hele klas) ---- */
  RENDER.peertip = function (step, ch, idx, done, onDone) {
    const card = h("div", { class: "activity-card" });
    card.append(h("h3", {}, step.title));
    card.append(h("p", { class: "step-intro" }, step.intro));

    if (done) {
      // Eigen tip tonen
      const saved = (progress.answers && progress.answers["peertip_" + ch.id]) || "";
      card.append(h("div", { class: "peertip-saved" }, h("strong", {}, step.prompt), h("p", {}, saved)));
      card.append(h("div", { style: "text-align:center;margin-top:14px" }, h("span", { class: "status-pill done" }, "✓ Voltooid")));

      // Tips van de klas laden uit Firestore
      const tipsWrap = h("div", { class: "peertips-class" });
      tipsWrap.innerHTML = "<p class='peertips-loading'>📚 Tips van de klas laden...</p>";
      card.append(tipsWrap);

      if (typeof fbLoadPeertips === "function") {
        fbLoadPeertips().then(function(tips) {
          if (!tips || !tips.length) {
            tipsWrap.innerHTML = "<p class='peertips-empty'>Nog geen tips van klasgenoten.</p>";
            return;
          }
          tipsWrap.innerHTML = "";
          tipsWrap.append(h("h4", { class: "peertips-title" }, "💬 Tips van de klas"));
          tips.forEach(function(t) {
            const item = h("div", { class: "peertip-item" });
            item.append(
              h("span", { class: "peertip-name" }, "✒️ " + (t.name || "Anoniem")),
              h("p", { class: "peertip-text" }, t.tip)
            );
            tipsWrap.append(item);
          });
        }).catch(function() {
          tipsWrap.innerHTML = "<p class='peertips-empty'>Tips ophalen mislukt. Controleer je verbinding.</p>";
        });
      } else {
        tipsWrap.remove();
      }

      return card;
    }

    // Formulier voor nieuwe tip
    const lbl = h("div", { class: "field-label", style: "margin-top:12px" }, step.prompt);
    const ta = h("textarea", { class: "text-input", rows: "3", placeholder: step.placeholder, style: "width:100%;box-sizing:border-box;resize:vertical" });
    const btn = h("button", { class: "btn btn-gold big block", style: "margin-top:12px" }, "Opslaan & afronden ✒️");
    btn.addEventListener("click", function() {
      if (ta.value.trim().length < 5) { toast("Schrijf eerst een tip ✍️"); return; }
      const tipText = ta.value.trim();
      if (!progress.answers) progress.answers = {};
      progress.answers["peertip_" + ch.id] = tipText;
      save(LS.progress, progress);
      // Opslaan in Firestore zodat klasgenoten de tip ook zien
      if (typeof fbSavePeertip === "function") {
        const studentName = (profile && profile.name) ? profile.name : "Anoniem";
        fbSavePeertip(studentName, tipText).catch(function(e) {
          console.warn("Peertip opslaan in Firestore mislukt:", e);
        });
      }
      onDone(0);
    });
    card.append(lbl, ta, btn);
    return card;
  };

  /* =========================================================
     FEEDBACK MODULE — SDT check-in + gedragsdata
     ========================================================= */
  const FEEDBACK_CHAPTERS = { ch2:"H2 — Versailles", ch4:"H4 — Fabels analyseren", ch6:"H6 — Eindreflectie" };
  const SDT_QUESTIONS = [
    { key:"competence",  label:"Hoe goed snapte je de opdrachten in dit hoofdstuk?", emoji:["😕","😐","🙂","😄","🤩"] },
    { key:"autonomie",   label:"Voelde je dat je zelf kon bepalen hoe je werkte?",    emoji:["😕","😐","🙂","😄","🤩"] },
    { key:"motivatie",   label:"Hoe graag wilde je het afmaken toen het lastig werd?", emoji:["😕","😐","🙂","😄","🤩"] }
  ];

  function showFeedbackModal(chId) {
    const scores = {};
    const body = document.getElementById("modal-body");
    if (!body) return;

    // verberg de vaste "Verder"-knop
    const vBtn = document.querySelector(".modal-card .btn[data-close-modal]");
    if (vBtn) vBtn.style.display = "none";

    body.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "feedback-modal";

    const title = document.createElement("div");
    title.className = "feedback-title";
    title.innerHTML = "✏️ Korte check-in — " + (FEEDBACK_CHAPTERS[chId] || chId);
    wrap.appendChild(title);

    const sub = document.createElement("p");
    sub.className = "feedback-sub";
    sub.textContent = "3 vragen, minder dan een minuut. Jouw antwoorden helpen de docent.";
    wrap.appendChild(sub);

    SDT_QUESTIONS.forEach(function(q) {
      const block = document.createElement("div");
      block.className = "feedback-q";
      const lbl = document.createElement("div");
      lbl.className = "feedback-qlabel";
      lbl.textContent = q.label;
      block.appendChild(lbl);
      const row = document.createElement("div");
      row.className = "feedback-emoji-row";
      q.emoji.forEach(function(em, i) {
        const btn = document.createElement("button");
        btn.className = "feedback-emoji-btn";
        btn.textContent = em;
        btn.dataset.val = i + 1;
        btn.setAttribute("aria-label", (i + 1) + " van de 5");
        btn.addEventListener("click", function() {
          scores[q.key] = i + 1;
          row.querySelectorAll(".feedback-emoji-btn").forEach(function(b) { b.classList.remove("selected"); });
          btn.classList.add("selected");
        });
        row.appendChild(btn);
      });
      block.appendChild(row);
      wrap.appendChild(block);
    });

    // open vraag
    const openBlock = document.createElement("div");
    openBlock.className = "feedback-q";
    const openLbl = document.createElement("div");
    openLbl.className = "feedback-qlabel";
    openLbl.textContent = "Was er iets onduidelijk of wat je afleidde? (optioneel)";
    const ta = document.createElement("textarea");
    ta.className = "feedback-open";
    ta.placeholder = "Schrijf hier...";
    ta.rows = 2;
    openBlock.appendChild(openLbl);
    openBlock.appendChild(ta);
    wrap.appendChild(openBlock);

    // sla op knop
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-gold";
    saveBtn.style.marginTop = "14px";
    saveBtn.textContent = "Opslaan & verder ✓";
    saveBtn.addEventListener("click", function() {
      const fb = load(LS.feedback, {});
      fb[chId] = {
        ts: Date.now(),
        chLabel: FEEDBACK_CHAPTERS[chId] || chId,
        competence: scores.competence || null,
        autonomie:  scores.autonomie  || null,
        motivatie:  scores.motivatie  || null,
        open: ta.value.trim(),
        banqueClicks: progress.banqueClicks || 0,
        focusUsed: !!progress.focusUsed
      };
      save(LS.feedback, fb);
      if (vBtn) vBtn.style.display = "";
      document.getElementById("modal-root").classList.add("hidden");
      toast("✓ Check-in opgeslagen — bedankt!");
    });
    wrap.appendChild(saveBtn);



    body.appendChild(wrap);
    document.getElementById("modal-root").classList.remove("hidden");
  }

  function renderFeedbackCard() {
    const fb = load(LS.feedback, {});
    const keys = ["ch2","ch4","ch6"].filter(function(k) { return fb[k]; });
    if (keys.length === 0) return null;

    const card = document.createElement("div");
    card.className = "dash-card";
    const title = document.createElement("h3");
    title.textContent = "✏️ Mijn check-ins";
    card.appendChild(title);

    const LABELS = { competence:"Begrip", autonomie:"Autonomie", motivatie:"Motivatie" };
    keys.forEach(function(chId) {
      const d = fb[chId];
      const block = document.createElement("div");
      block.className = "fb-chapter-block";

      const head = document.createElement("div");
      head.className = "fb-ch-head";
      head.textContent = d.chLabel;
      block.appendChild(head);

      const scoreRow = document.createElement("div");
      scoreRow.className = "fb-score-row";
      ["competence","autonomie","motivatie"].forEach(function(k) {
        const val = d[k];
        const pill = document.createElement("div");
        pill.className = "fb-score-pill";
        const emojis = ["😕","😐","🙂","😄","🤩"];
        pill.innerHTML = "<span class='fb-score-lbl'>" + LABELS[k] + "</span><span class='fb-score-val'>" + (val ? emojis[val-1] + " " + val + "/5" : "—") + "</span>";
        scoreRow.appendChild(pill);
      });
      block.appendChild(scoreRow);

      const meta = document.createElement("div");
      meta.className = "fb-meta";
      meta.textContent = "Banque gebruikt: " + (d.banqueClicks || 0) + "×  ·  Focus-modus: " + (d.focusUsed ? "ja" : "nee");
      block.appendChild(meta);

      if (d.open) {
        const openDiv = document.createElement("div");
        openDiv.className = "fb-open";
        openDiv.textContent = "💬 " + d.open;
        block.appendChild(openDiv);
      }
      card.appendChild(block);
    });

    // docent-blok (alleen zichtbaar met docentmodus)
    if (isTeacher() && keys.length > 0) {
      const docBlock = document.createElement("div");
      docBlock.className = "fb-teacher-note";
      docBlock.innerHTML = "<strong>👩‍🏫 Docentnotitie:</strong> Scores onder 3 op 'Begrip' wijzen op te moeilijke inhoud. Scores onder 3 op 'Motivatie' wijzen op te weinig uitdaging of relevantie.";
      card.appendChild(docBlock);
    }
    return card;
  }

  /* =========================================================
     PAUZEHERINNERING (ADHD-vriendelijk)
     ========================================================= */
  const PAUZE_TIPS = [
    "Sta even op en rek je armen boven je hoofd uit. 🙆",
    "Drink een glas water. Goed voor je concentratie! 💧",
    "Kijk 20 seconden naar iets ver weg — dat rust je ogen. 👀",
    "Adem 4 tellen in, 4 tellen uit. Doe dit 3 keer. 🌬️",
    "Schud je handen los en beweeg je schouders. 💪"
  ];
  function showPauzeReminder() {
    // Alleen tonen als de modus aan staat OF altijd (de gebruiker mag zelf sluiten)
    const tip = PAUZE_TIPS[Math.floor(Math.random() * PAUZE_TIPS.length)];
    const body = document.getElementById("modal-body");
    if (!body) return;
    body.innerHTML =
      '<div class="pauze-modal">' +
      '<div class="pauze-icon">☕</div>' +
      '<p><strong>Goed gedaan! Je hebt een hoofdstuk afgerond.</strong></p>' +
      '<p>Wil je even een pauze nemen? Dat helpt je brein de stof te onthouden.</p>' +
      '<div class="pauze-tip">💡 ' + tip + '</div>' +
      '</div>';
    document.getElementById("modal-root").classList.remove("hidden");
  }

  /* =========================================================
     FOCUS-LAUNCHER (ADHD-modus)
     ========================================================= */
  function syncFocusLauncher() {
    const btn = document.getElementById("focus-launcher");
    if (!btn) return;
    const on = document.body.classList.contains("focus-mode");
    btn.textContent = on ? "✕ Focus uit" : "🎯 Focus";
    btn.classList.toggle("active", on);
  }
  function initFocusLauncher() {
    // herstel vorige staat
    let a11yPrefs = {};
    try { a11yPrefs = JSON.parse(localStorage.getItem("flf_a11y")) || {}; } catch(e) {}
    if (a11yPrefs.focus) document.body.classList.add("focus-mode");

    const btn = document.createElement("button");
    btn.id = "focus-launcher";
    btn.setAttribute("title", "Focus-modus (minder afleiding)");
    btn.setAttribute("aria-label", "Focus-modus aan/uit");
    document.body.appendChild(btn);
    syncFocusLauncher();
    btn.addEventListener("click", () => {
      const nowOn = document.body.classList.toggle("focus-mode");
      let p = {};
      try { p = JSON.parse(localStorage.getItem("flf_a11y")) || {}; } catch(e) {}
      p.focus = nowOn;
      localStorage.setItem("flf_a11y", JSON.stringify(p));
      syncFocusLauncher();
      if (nowOn && progress) { progress.focusUsed = true; save(LS.progress, progress); }
    });
  }

  /* =========================================================
     BOOT
     ========================================================= */
  document.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => go(el.dataset.nav)));
  document.querySelectorAll("[data-close-modal]").forEach((el) => el.addEventListener("click", closeModal));
  initBanque();
  initA11y();
  initFocusLauncher();

  // Docent-nav knop tonen indien ingelogd
  function refreshDocentNav() {
    const existing = document.getElementById("nav-docentbeheer");
    if (isTeacher()) {
      if (!existing) {
        const btn = document.createElement("button");
        btn.className = "nav-btn";
        btn.id = "nav-docentbeheer";
        btn.dataset.nav = "docentbeheer";
        btn.textContent = "🛠️ Beheer";
        btn.addEventListener("click", () => go("docentbeheer"));
        const nav = document.querySelector(".topnav");
        if (nav) nav.append(btn);
      }
    } else {
      if (existing) existing.remove();
    }
  }

  if (profile) {
    $("#screen-onboarding").classList.remove("active");
    $("#app-shell").classList.remove("hidden");
    showBanqueLauncher();
    syncBoard();
    refreshChrome();
    updateAankondiging();
    refreshDocentNav();
    go("intro");
  } else {
    initOnboarding();
  }
})();
