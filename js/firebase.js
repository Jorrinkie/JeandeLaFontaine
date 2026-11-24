/* =========================================================
   firebase.js  —  Jean de La Fontaine app
   Firestore helpers voor gedeelde peertips & leaderboard
   ========================================================= */

const _firebaseConfig = {
  apiKey: "AIzaSyDEwC2uvxuPBrcmLsJD1-cAt1NXjIxEc30",
  authDomain: "jeandelafontaine-9c006.firebaseapp.com",
  projectId: "jeandelafontaine-9c006",
  storageBucket: "jeandelafontaine-9c006.firebasestorage.app",
  messagingSenderId: "402889341991",
  appId: "1:402889341991:web:e091a903074b390db2e202",
  measurementId: "G-ZMQF3CP8ZF"
};

// Initialiseer Firebase (compat-versie, geen build-stap nodig)
firebase.initializeApp(_firebaseConfig);
const _db = firebase.firestore();

/* ── Klassen beheer ───────────────────────────────────── */

/**
 * Maak een nieuwe klas aan in Firestore.
 * @param {string} code        Klascode (bijv. "3HB-FRANS")
 * @param {string} docentNaam  Naam van de docent
 * @param {string} klasNaam    Naam van de klas (bijv. "3HB")
 */
/* Klassen worden opgeslagen als één document in de leaderboard-collectie
   (die al open rechten heeft). Doc-id: __klassen__registry__ */
const _KLASSEN_DOC = "klassenregistry";

async function _leesKlassenDoc() {
  try {
    const doc = await _db.collection("leaderboard").doc(_KLASSEN_DOC).get();
    return doc.exists ? (doc.data().klassen || {}) : {};
  } catch (e) { return {}; }
}

async function _schrijfKlassenDoc(klassen) {
  await _db.collection("leaderboard").doc(_KLASSEN_DOC).set({ klassen });
}

async function fbCreateClass(code, docentNaam, klasNaam) {
  const klassen = await _leesKlassenDoc();
  klassen[code] = {
    code,
    docentNaam: docentNaam || "Docent",
    klasNaam: klasNaam || code,
    created: Date.now()
  };
  await _schrijfKlassenDoc(klassen);
}

/**
 * Docent: zet de veren van alle leerlingen in een klas op 0.
 * Er wordt ook een reset-tijdstip bij de klas opgeslagen; leerling-apparaten zien dat
 * en zetten hun eigen (lokale) veren dan ook op 0, zodat de oude score niet terugkomt.
 * Voortgang, antwoorden en badges blijven bewaard.
 */
async function fbResetClassScores(code) {
  const klassen = await _leesKlassenDoc();
  if (!klassen[code]) throw new Error("Klas niet gevonden");
  klassen[code].scoreReset = Date.now();
  await _schrijfKlassenDoc(klassen);
  const snap = await _db.collection("leerling_voortgang").where("classCode", "==", code).get();
  const batch = _db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { feathers: 0 }));
  if (snap.docs.length) await batch.commit();
  return snap.docs.length;
}

async function fbValidateClass(code) {
  try {
    const klassen = await _leesKlassenDoc();
    return klassen[code.trim().toUpperCase()] || null;
  } catch (e) {
    console.warn("fbValidateClass fout:", e);
    return null;
  }
}

async function fbGetAllClasses() {
  try {
    const klassen = await _leesKlassenDoc();
    return Object.values(klassen).sort((a, b) => (b.created || 0) - (a.created || 0));
  } catch (e) {
    console.warn("fbGetAllClasses fout:", e);
    return [];
  }
}

async function fbDeleteClass(code) {
  try {
    // Verwijder klas uit registry
    const klassen = await _leesKlassenDoc();
    delete klassen[code];
    await _schrijfKlassenDoc(klassen);
    // Verwijder leerling-voortgang van deze klas
    const snap = await _db.collection("leerling_voortgang")
      .where("classCode", "==", code).get();
    const batch = _db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    if (snap.docs.length) await batch.commit();
    // Verwijder leaderboard-scores van deze klas
    const lbSnap = await _db.collection("leaderboard")
      .where("classCode", "==", code).get();
    const batch2 = _db.batch();
    lbSnap.docs.forEach(d => batch2.delete(d.ref));
    if (lbSnap.docs.length) await batch2.commit();
  } catch (e) {
    console.warn("fbDeleteClass fout:", e);
  }
}

/* ── Peertips ─────────────────────────────────────────── */

/**
 * Sla een peertip op in Firestore (gekoppeld aan klas).
 * @param {string} studentName
 * @param {string} tipText
 * @param {string} classCode
 */
async function fbSavePeertip(studentName, tipText, classCode) {
  return _db.collection("peertips").add({
    name: studentName,
    tip: tipText,
    classCode: classCode || "algemeen",
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/* Sorteren gebeurt in de browser i.p.v. met orderBy in Firestore: een where + orderBy
   vraagt een samengestelde index, en zonder die index gaf de query niets terug. */
function _tsMillis(t) { return t && typeof t.toMillis === "function" ? t.toMillis() : (typeof t === "number" ? t : 0); }

/**
 * Laad peertips gefilterd op klas (nieuwste eerst, max 50).
 * @param {string} classCode
 * @returns {Promise<Array<{id,name,tip,timestamp}>>}
 */
async function fbLoadPeertips(classCode) {
  try {
    let query = _db.collection("peertips");
    if (classCode) query = query.where("classCode", "==", classCode);
    const snap = await query.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => _tsMillis(b.timestamp) - _tsMillis(a.timestamp))
      .slice(0, 50);
  } catch (e) {
    console.warn("fbLoadPeertips fout:", e);
    return [];
  }
}

/* ── Leaderboard ──────────────────────────────────────── */

/**
 * Sla (of update) een leerling-score op in Firestore (per klas).
 * @param {string} studentName
 * @param {number} feathers
 * @param {string} classCode
 */
async function fbSaveScore(studentName, feathers, classCode) {
  try {
    const docKey = classCode ? classCode + "__" + studentName : studentName;
    const ref = _db.collection("leaderboard").doc(docKey);
    const doc = await ref.get();
    if (!doc.exists || doc.data().feathers < feathers) {
      await ref.set({
        name: studentName,
        feathers,
        classCode: classCode || "algemeen",
        updated: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (e) {
    console.warn("fbSaveScore fout:", e);
  }
}

/**
 * Laad leaderboard gefilterd op klas (top 20 op veren).
 * @param {string} classCode
 * @returns {Promise<Array<{name,feathers}>>}
 */
async function fbLoadLeaderboard(classCode) {
  try {
    let query = _db.collection("leaderboard");
    if (classCode) query = query.where("classCode", "==", classCode);
    const snap = await query.get();
    return snap.docs.map(d => d.data())
      .filter(d => typeof d.feathers === "number")
      .sort((a, b) => b.feathers - a.feathers)
      .slice(0, 20);
  } catch (e) {
    console.warn("fbLoadLeaderboard fout:", e);
    return [];
  }
}

/* ── Leerling voortgang (docent) ──────────────────────── */

/**
 * Sla de volledige voortgang van een leerling op in Firestore (per klas).
 * @param {string} studentName
 * @param {string} avatarStr
 * @param {object} progress
 * @param {string} classCode
 */
async function fbSaveProgress(studentName, avatarStr, progress, classCode, uid) {
  try {
    const safeAnswers = {};
    Object.keys(progress.answers || {}).forEach(function(k) {
      const v = progress.answers[k];
      if (typeof v === "string" || typeof v === "boolean" || typeof v === "number") {
        safeAnswers[k] = v;
      } else if (Array.isArray(v)) {
        safeAnswers[k] = v;
      }
      // data-URL's (video/foto) laten we weg — te groot voor Firestore
    });
    // Uniek per leerling-apparaat (uid), zodat twee leerlingen met dezelfde naam elkaar niet overschrijven
    const id = uid || studentName;
    const docKey = classCode ? classCode + "__" + id : id;
    await _db.collection("leerling_voortgang").doc(docKey).set({
      name: studentName,
      uid: uid || null,
      classCode: classCode || "algemeen",
      avatar: (avatarStr && avatarStr.startsWith("data:")) ? "📷" : (avatarStr || "🙂"),
      feathers: progress.feathers || 0,
      stepsDone: progress.stepsDone || {},
      badges: progress.badges || [],
      answers: safeAnswers,
      updated: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) { console.warn("fbSaveProgress fout:", e); }
}

/**
 * Laad voortgang van alle leerlingen van één klas (voor docent-dashboard).
 * @param {string} classCode
 * @returns {Promise<Array>}
 */
async function fbLoadAllProgress(classCode) {
  try {
    let query = _db.collection("leerling_voortgang");
    if (classCode) query = query.where("classCode", "==", classCode);
    const snap = await query.get();
    return snap.docs.map(d => Object.assign({ _id: d.id }, d.data()))
      .sort((a, b) => (b.feathers || 0) - (a.feathers || 0));
  } catch (e) {
    console.warn("fbLoadAllProgress fout:", e);
    return [];
  }
}

/**
 * Verwijder een leerling uit de voortgangs-database (docent).
 * @param {string} studentName
 * @param {string} classCode
 */
async function fbDeleteProgress(studentName, classCode, docId) {
  try {
    const docKey = docId || (classCode ? classCode + "__" + studentName : studentName);
    await _db.collection("leerling_voortgang").doc(docKey).delete();
  } catch (e) {
    console.warn("fbDeleteProgress fout:", e); }
}

/**
 * Is deze naam in deze klas al in gebruik door een ándere leerling?
 * (Hoofdletters en spaties maken niet uit.) Bij een fout (offline) → false.
 * @param {string} classCode
 * @param {string} name
 * @param {string} uid  eigen uid, wordt overgeslagen
 */
async function fbNameTaken(classCode, name, uid) {
  try {
    if (!classCode) return false;
    const want = (name || "").trim().toLowerCase();
    const snap = await _db.collection("leerling_voortgang").where("classCode", "==", classCode).get();
    return snap.docs.some(function (d) {
      const x = d.data();
      return (x.name || "").trim().toLowerCase() === want && (!uid || x.uid !== uid);
    });
  } catch (e) {
    console.warn("fbNameTaken fout:", e);
    return false;
  }
}
