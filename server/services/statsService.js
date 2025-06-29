// server/services/statsService.js
const admin = require('firebase-admin');

// threshold in minutes to reach level N: 1h for L2, +2h for L3, etc
const thresholdForLevel = n => ((n - 1) * n / 2) * 60;

function computeLevel(totalMinutes) {
  let lvl = 1;
  while (totalMinutes >= thresholdForLevel(lvl + 1)) lvl++;
  return lvl;
}

exports.calculateStats = async (userId) => {
  const snap = await admin.firestore()
    .collection('sessions')
    .where('userId', '==', userId)
    .get();

  const sessions     = snap.docs.map(d => d.data());
  const sessionsCount = sessions.length;                      // ← NEW
  const totalFocus    = sessions.reduce((sum, s) => sum + (s.studyDuration || 0), 0);
  const totalBreak    = sessions.reduce((sum, s) => sum + (s.breakDuration || 0), 0);
  const penalties     = sessions.reduce((sum, s) => sum + (s.pickupCount  || 0), 0);

  const currentLevel   = computeLevel(totalFocus);
  const nextLevel      = currentLevel + 1;
  const minutesForNext = thresholdForLevel(nextLevel);
  const minutesToNext  = Math.max(0, minutesForNext - totalFocus);

  return {
    sessionsCount,     // ← RETURNED NOW
    totalFocus,
    totalBreak,
    penalties,
    currentLevel,
    nextLevel,
    minutesForNext,
    minutesToNext
  };
};

// **UNCHANGED**: check for an N-day study streak
exports.hasNdayStreak = async (userId, N) => {
  const snap = await admin.firestore()
    .collection('sessions')
    .where('userId','==',userId)
    .orderBy('startedAt', 'desc')
    .limit(N)
    .get();

  // build a set of unique ISO dates
  const days = new Set(
    snap.docs.map(d => d.data().startedAt.toDate().toISOString().slice(0,10))
  );
  return days.size >= N;
};