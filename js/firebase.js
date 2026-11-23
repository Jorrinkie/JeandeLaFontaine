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

/* ── Klassen beheer ───────────────────────────────────── */

/**
 * Maak een nieuwe klas aan in Firestore.
 * @param {string} code        Klascode (bijv. "3HB-FRANS")
 * @param {string} docentNaam  Naam van de docent
 * @param {string} klasNaam    Naam van de klas (bijv. "3HB")
 */
async function fbCreateClass(code, docentNaam, klasNaam) {
  await _db.collection("klassen").doc(code).set({
    code,
    docentNaam: docentNaam || "Docent",
    klasNaam: klasNaam || code,
    created: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Valideer een klascode. Geeft klas-object terug of null als code niet bestaat.
 * @param {string} code
 * @returns {Promise<object|null>}
 */
async function fbValidateClass(code) {
  try {
    const doc = await _db.collection("klassen").doc(code.trim().toUpperCase()).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.warn("fbValidateClass fout:", e);
    return null;
  }
}

/**
 * Laad alle klassen (voor docent-dashboard).
 * @returns {Promise<Array>}
 */
async function fbGetAllClasses() {
  try {
    const snap = await _db.collection("klassen").orderBy("created", "desc").get();
    return snap.docs.map(d => d.data());
  } catch (e) {
    console.warn("fbGetAllClasses fout:", e);
    return [];
  }
}

/**
 * Verwijder een klas én alle bijbehorende leerlingdata.
 * @param {string} code
 */
async function fbDeleteClass(code) {
  try {
    // Verwijder klas zelf
    await _db.collection("klassen").doc(code).delete();
    // Verwijder leerling-voortgang van deze klas
    const snap = await _db.collection("leerling_voortgang")
      .where("classCode", "==", code).get();
    const batch = _db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    if (snap.docs.length) await batch.commit();
    // Verwijder leaderboard van deze klas
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

/**
 * Laad peertips gefilterd op klas (nieuwste eerst, max 50).
 * @param {string} classCode
 * @returns {Promise<Array<{id,name,tip,timestamp}>>}
 */
async function fbLoadPeertips(classCode) {
  try {
    let query = _db.collection("peertips").orderBy("timestamp", "desc").limit(50);
    if (classCode) query = _db.collection("peertips")
      .where("classCode", "==", classCode)
      .orderBy("timestamp", "desc")
      .limit(50);
    const snap = await query.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
    let query;
    if (classCode) {
      query = _db.collection("leaderboard")
        .where("classCode", "==", classCode)
        .orderBy("feathers", "desc")
        .limit(20);
    } else {
      query = _db.collection("leaderboard").orderBy("feathers", "desc").limit(20);
    }
    const snap = await query.get();
    return snap.docs.map(d => d.data());
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
async function fbSaveProgress(studentName, avatarStr, progress, classCode) {
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
    const docKey = classCode ? classCode + "__" + studentName : studentName;
    await _db.collection("leerling_voortgang").doc(docKey).set({
      name: studentName,
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
    let query;
    if (classCode) {
      query = _db.collection("leerling_voortgang")
        .where("classCode", "==", classCode)
        .orderBy("feathers", "desc");
    } else {
      query = _db.collection("leerling_voortgang").orderBy("feathers", "desc");
    }
    const snap = await query.get();
    return snap.docs.map(d => d.data());
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
async function fbDeleteProgress(studentName, classCode) {
  try {
    const docKey = classCode ? classCode + "__" + studentName : studentName;
    await _db.collection("leerling_voortgang").doc(docKey).delete();
  } catch (e) {
    console.warn("fbDeleteProgress fout:", e); }
}
