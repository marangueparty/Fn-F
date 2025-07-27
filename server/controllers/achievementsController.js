// server/controllers/achievementsController.js

const { calculateStats, hasNdayStreak } = require('../services/statsService');
const {
  loadAchievements,
  updateRawTotals,
  listUnlocked
} = require('../services/achievementsService');

/**
 * GET /achievements/current
 */
exports.getCurrent = async (req, res) => {
  try {
    // pull the Firebase UID off of req.user
    const { uid } = req.user;

    // 1) compute stats (levels, penalties, etc)
    const stats = await calculateStats(uid);

    // 2) load raw achievement flags (if you used loadAchievements) or compute badge list
    const unlockedBadges = await listUnlocked(uid);

    // respond with both
    return res.json({
      success:      true,
      stats,                    // { totalFocus, currentLevel, … }
      achievements: unlockedBadges,  // e.g. [ { id: 'first_session' }, … ]
    });
  } catch (err) {
    console.error('Error in getCurrent:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /achievements/current
 * Allows client to set raw totals directly (if ever needed).
 * We'll interpret payload keys focusCollected & sessions & penalties
 * as absolute values and overwrite the `raw` doc.
 */
exports.postCurrent = async (req, res) => {
  try {
    // check if req.user and uid exist
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, error: 'Unauthorized: missing user ID' });
    }

    const { uid } = req.user;
    const { focusCollected, sessions, penalties } = req.body;

    await updateRawTotals(uid, {
      totalFocus:     focusCollected,
      totalSessions:  sessions,
      totalPenalties: penalties,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error in postCurrent:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
