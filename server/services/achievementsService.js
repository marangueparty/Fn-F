// server/services/achievementsService.js
const admin      = require('firebase-admin');
const db         = admin.firestore();
const statsService = require('./statsService');

// — update raw totals in users/{uid}/achievements/raw
exports.updateRawTotals = async (uid, { focusIncrement, sessionIncrement, penaltyIncrement }) => {
  const ref = db
    .collection('users').doc(uid)
    .collection('achievements').doc('raw');

  await ref.set({
    totalFocus:    admin.firestore.FieldValue.increment(focusIncrement),
    totalSessions: admin.firestore.FieldValue.increment(sessionIncrement),
    totalPenalties:admin.firestore.FieldValue.increment(penaltyIncrement),
  }, { merge: true });
};

// — list which badges should be unlocked
exports.listUnlocked = async (uid) => {
  // load the raw totals document
  const snap = await db
    .collection('users').doc(uid)
    .collection('achievements').doc('raw')
    .get();

  const raw = snap.exists
    ? snap.data()
    : { totalFocus: 0, totalSessions: 0, totalPenalties: 0 };

  const unlocked = [];

  // badge: first_session
  if (raw.totalSessions >= 1) unlocked.push({ id: 'first_session' });

  // badge: focus_10h (600 min)
  if (raw.totalFocus >= 600) unlocked.push({ id: 'focus_10h' });

  // badge: streak_3 (3-day streak)
  const has3 = await statsService.hasNdayStreak(uid, 3);
  if (has3) unlocked.push({ id: 'streak_3' });

  return unlocked;
};