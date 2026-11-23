/* =========================================================
   firebase.js  —  Jean de La Fontaine app
   Firestore helpers voor gedeelde peertips & leaderboard
   ========================================================= */

const _firebaseConfig = {
  apiKey: "AIzaSyBWe00mZ2vLNi3WU_bW8L3C1r47R9PI5Xk",
  authDomain: "jean-de-la-fontaine-d6251.firebaseapp.com",
  projectId: "jean-de-la-fontaine-d6251",
  storageBucket: "jean-de-la-fontaine-d6251.firebasestorage.app",
  messagingSenderId: "15976543464",
  appId: "1:15976543464:web:5b5a1607bbbb86ab7bc55d",
  measurementId: "G-PNQZSM0NP7"
};

// Initialiseer Firebase (compat-versie, geen build-stap nodig)
firebase.initializeApp(_firebaseConfig);
const _db = firebase.firestore();

/* ── Peertips ─────────────────────────────────────────── */

/**
 * Sla een peertip op in Firestore.
 * @param {string} studentName  Naam van de leerling
 * @param {string} tipText      De tip-tekst
 * @returns {Promise}
 */
async function fbSavePeertip(studentName, tipText) {
  return _db.collection("peertips").add({
    name: studentName,
    tip: tipText,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Laad alle peertips (nieuwste eerst, max 50).
 * @returns {Promise<Array<{id,name,tip,timestamp}>>}
 */
async function fbLoadPeertips() {
  try {
    const snap = await _db
      .collection("peertips")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("fbLoadPeertips fout:", e);
    return [];
  }
}

/* ── Leaderboard ──────────────────────────────────────── */

/**
 * Sla (of update) een leerling-score op in Firestore.
 * Overschrijft alleen als de nieuwe score hoger is.
 * @param {string} studentName
 * @param {number} feathers
 */
async function fbSaveScore(studentName, feathers) {
  try {
    const ref = _db.collection("leaderboard").doc(studentName);
    const doc = await ref.get();
    if (!doc.exists || doc.data().feathers < feathers) {
      await ref.set({
        name: studentName,
        feathers,
        updated: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (e) {
    console.warn("fbSaveScore fout:", e);
  }
}

/**
 * Laad leaderboard (top 20 op veren).
 * @returns {Promise<Array<{name,feathers}>>}
 */
async function fbLoadLeaderboard() {
  try {
    const snap = await _db
      .collection("leaderboard")
      .orderBy("feathers", "desc")
      .limit(20)
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) {
    console.warn("fbLoadLeaderboard fout:", e);
    return [];
  }
}

/* ── Leerling voortgang (docent) ──────────────────────── */

/**
 * Sla de volledige voortgang van een leerling op in Firestore.
 * Wordt aangeroepen bij elke stap-voltooiing en atelier-save.
 * @param {string} studentName
 * @param {string} avatarStr  Avatar emoji of data-URL
 * @param {object} progress   Het volledige progress-object
 */
async function fbSaveProgress(studentName, avatarStr, progress) {
  try {
    // Antwoorden die we meesturen (alleen tekst/boolean — geen binaire data)
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
    await _db.collection("leerling_voortgang").doc(studentName).set({
      name: studentName,
      avatar: (avatarStr && avatarStr.startsWith("data:")) ? "📷" : (avatarStr || "🙂"),
      feathers: progress.feathers || 0,
      stepsDone: progress.stepsDone || {},
      badges: progress.badges || [],
      answers: safeAnswers,
      updated: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.warn("fbSaveProgress fout:", e);
  }
}

/**
 * Laad voortgang van alle leerlingen (voor docent-dashboard).
 * @returns {Promise<Array>}
 */
async function fbLoadAllProgress() {
  try {
    const snap = await _db
      .collection("leerling_voortgang")
      .orderBy("feathers", "desc")
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) {
    console.warn("fbLoadAllProgress fout:", e);
    return [];
  }
}

/**
 * Verwijder een leerling uit de voortgangs-database (docent).
 * @param {string} studentName
 */
async function fbDeleteProgress(studentName) {
  try {
    await _db.collection("leerling_voortgang").doc(studentName).delete();
  } catch (e) {
    console.warn("fbDeleteProgress fout:", e);
  }
}
