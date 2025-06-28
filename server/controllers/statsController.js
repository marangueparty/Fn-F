// server/controllers/statsController.js
const admin = require('firebase-admin')

// helper to compute “how many total minutes to hit level N”
const thresholdForLevel = n => ((n * (n - 1)) / 2) * 60

exports.getStats = async (req, res) => {
  try {
    // 1) verify token & get uid
    const header = req.headers.authorization || ''
    const idToken = header.replace(/^Bearer\s+/, '')
    const { uid } = await admin.auth().verifyIdToken(idToken)

    // 2) fetch all this user’s sessions
    const snap = await admin
      .firestore()
      .collection('sessions')
      .where('userId', '==', uid)
      .get()

    const sessions = snap.docs.map(d => d.data())

    // 3) aggregate total focus minutes & total pickup penalties
    const totalFocus = sessions.reduce(
      (sum, s) => sum + (s.studyDuration || 0),
      0
    )
    const penalties = sessions.reduce(
      (sum, s) => sum + (s.pickupCount || 0),
      0
    )

    // 4) figure out current / next level
    let currentLevel = 1
    // bump level while you’ve met the threshold
    while (thresholdForLevel(currentLevel + 1) <= totalFocus) {
      currentLevel++
    }
    const nextLevel = currentLevel + 1

    // 5) how many minutes total to hit nextLevel, and how many left
    const minutesForNext = thresholdForLevel(nextLevel)
    const minutesToNext = Math.max(0, minutesForNext - totalFocus)

    // 6) return them all
    return res.json({
      success: true,
      totalFocus,
      currentLevel,
      nextLevel,
      minutesToNext,
      minutesForNext,
      penalties,
    })
  } catch (e) {
    console.error(e)
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }
}