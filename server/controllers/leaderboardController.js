// server/controllers/leaderboardController.js
const admin = require('firebase-admin')
const { listFriends } = require('../services/friendsService')
const { calculateStats } = require('../services/statsService')

exports.getLeaderboard = async (req, res, next) => {
  try {
    const me = req.user.uid
    const friends = await listFriends(me)
    const allUids = [me, ...friends]

    const entries = await Promise.all(
      allUids.map(async uid => {
        const stats = await calculateStats(uid)
        // fetch username & email…
        const userDoc = await admin.firestore().collection('users').doc(uid).get()
        const username = userDoc.exists ? userDoc.data().username || '' : ''
        const user = await admin.auth().getUser(uid)
        return {
          uid,
          username,
          email: user.email,
          minutes: stats.netFocus,       // ← use netFocus
        }
      })
    )

    entries.sort((a, b) => b.minutes - a.minutes)

    res.json({ success: true, leaderboard: entries })
  } catch (err) {
    next(err)
  }
}