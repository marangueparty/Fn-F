// server/services/achievementsService.js
const admin = require('firebase-admin');
const db    = admin.firestore();

// define your achievement rules here:
const RULES = [
  { key: 'first_session',  label: 'First Session',   test: ({ count }) => count >= 1 },
  { key: 'one_hour_total', label: '1 Hour Total',    test: ({ total }) => total >= 60 },
  { key: 'five_hours',     label: '5 Hours Total',   test: ({ total }) => total >= 300 },
  { key: 'ten_sessions',   label: '10 Sessions',     test: ({ count }) => count >= 10 },
];

async function getUserAchievements(uid) {
  // 1️⃣ load all sessions for this user (ensure each session doc has a userId field)
  const snap = await db.collection('sessions').where('userId', '==', uid).get();
  const sessions = snap.docs.map(d => d.data());

  // 2️⃣ aggregate totals
  const total = sessions.reduce((sum, s) => sum + (s.studyDuration||0), 0);
  const count = sessions.length;

  // 3️⃣ fetch already‐unlocked achievements
  const uaSnap = await db.collection('userAchievements').where('userId', '==', uid).get();
  const existing = uaSnap.docs.map(d => d.data().achievementKey);

  // 4️⃣ batch in any newly‐earned ones
  const batch = db.batch();
  for (let rule of RULES) {
    if (rule.test({ total, count }) && !existing.includes(rule.key)) {
      const ref = db.collection('userAchievements').doc();
      batch.set(ref, {
        userId:         uid,
        achievementKey: rule.key,
        label:          rule.label,
        unlockedAt:     admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  if (batch._ops?.length) {
    await batch.commit();
  }

  // 5️⃣ return the full, up‐to‐date list
  const fullSnap = await db.collection('userAchievements').where('userId', '==', uid).get();
  return fullSnap.docs.map(d => d.data());
}

module.exports = { getUserAchievements };