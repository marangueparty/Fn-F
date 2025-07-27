// server/controllers/leaderboardController.js

const admin = require('firebase-admin');
const { listFriends } = require('../services/friendsService');
const { calculateStats } = require('../services/statsService');

exports.getLeaderboard = async (req, res, next) => {
  try {
    const me = req.user.uid;
    const friends = await listFriends(me);
    const allUids = [me, ...friends];

    const entries = await Promise.all(
      allUids.map(async uid => {
        const stats = await calculateStats(uid);
        // Pull username
        let username = '';
        try {
          const userDoc = await admin
            .firestore()
            .collection('users')
            .doc(uid)
            .get();
          username = userDoc.exists
            ? userDoc.data().username || ''
            : '';
        } catch (err) {
          console.warn('Could not fetch username for', uid, err);
        }
        // Pull email
        const user = await admin.auth().getUser(uid);

        return {
          uid,
          username,
          email: user.email,
          currentLevel: stats.currentLevel,
          minutes: stats.netFocus !== undefined
            ? stats.netFocus
            : stats.totalFocus,
        };
      })
    );

    // Sort descending by minutes
    entries.sort((a, b) => b.minutes - a.minutes);

    res.json({ success: true, leaderboard: entries });
  } catch (err) {
    console.error('getLeaderboard error', err);
    next(err);
  }
};