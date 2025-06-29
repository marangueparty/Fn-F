// server/controllers/leaderboardController.js
const admin = require('firebase-admin');
const { listFriends } = require('../services/friendsService');
const { calculateStats } = require('../services/statsService');

exports.getLeaderboard = async (req, res, next) => {
  try {
    const me = req.user.id;
    // fetch your friends' UIDs
    const friends = await listFriends(me);
    // include yourself
    const allUids = [me, ...friends];
    // fetch stats + email for each
    const entries = await Promise.all(
      allUids.map(async uid => {
        const stats = await calculateStats(uid);
        const user = await admin.auth().getUser(uid);
        return {
          uid,
          email: user.email,
          totalFocus: stats.totalFocus,
        };
      })
    );
    // sort descending by totalFocus
    entries.sort((a, b) => b.totalFocus - a.totalFocus);
    res.json({ success: true, leaderboard: entries });
  } catch (err) {
    console.error('getLeaderboard error', err);
    next(err);
  }
};