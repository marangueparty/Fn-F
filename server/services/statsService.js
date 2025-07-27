// server/services/statsService.js
const admin = require('firebase-admin');

// threshold in minutes to reach level N: 1h for L2, +2h for L3, +3h for L4, etc
const thresholdForLevel = n => ((n - 1) * n / 2) * 60

function computeLevel(totalMinutes) {
  let lvl = 1
  while (totalMinutes >= thresholdForLevel(lvl + 1)) lvl++
  return lvl
}

// tiered penalty: first 3 pickups→1 min each, next 3→2 min each, beyond→3 min each
function computePenaltyMinutes(pickupCount) {
  const tier1 = Math.min(pickupCount, 3) * 1
  const tier2 = Math.min(Math.max(pickupCount - 3, 0), 3) * 2
  const tier3 = Math.max(pickupCount - 6, 0) * 3
  return tier1 + tier2 + tier3
}

exports.calculateStats = async (userId) => {
  const snap = await admin.firestore()
    .collection('sessions')
    .where('userId', '==', userId)
    .get()

  const sessions     = snap.docs.map(d => d.data())
  const rawFocus     = sessions.reduce((sum, s) => sum + (s.studyDuration || 0), 0)
  const totalBreak   = sessions.reduce((sum, s) => sum + (s.breakDuration || 0), 0)
  const totalPickups = sessions.reduce((sum, s) => sum + (s.pickupCount  || 0), 0)

  // compute how many minutes to deduct
  const penaltyMinutes = computePenaltyMinutes(totalPickups)
  // subtract penalties from raw focus
  const netFocus = Math.max(0, rawFocus - penaltyMinutes)

  const currentLevel   = computeLevel(netFocus)
  const nextLevel      = currentLevel + 1
  const minutesForNext = thresholdForLevel(nextLevel)
  const minutesToNext  = Math.max(0, minutesForNext - netFocus)

  return {
    rawFocus,
    totalBreak,
    totalPickups,
    penaltyMinutes,
    netFocus,
    currentLevel,
    nextLevel,
    minutesForNext,
    minutesToNext,
  }
}

// unchanged:
exports.hasNdayStreak = async (userId, N) => { /* … */ }