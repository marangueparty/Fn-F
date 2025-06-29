// server/controllers/sessionsController.js

const sessionsService     = require('../services/sessionsService');
const achievementsService = require('../services/achievementsService');
const statsService        = require('../services/statsService');

// POST /sessions → log a new session
exports.addSession = async (req, res) => {
  try {
    const { uid } = req.user;
    const { studyDuration, breakDuration, pickupCount = 0 } = req.body;
    const id = await sessionsService.logSession(uid, studyDuration, breakDuration, pickupCount);
    return res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /sessions → list all sessions
exports.listSessions = async (_req, res) => {
  try {
    const snapshot = await require('firebase-admin')
      .firestore()
      .collection('sessions')
      .orderBy('startedAt', 'desc')
      .get();

    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(sessions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// POST /sessions/complete → log session, update achievements, return fresh stats & badges
exports.completeSession = async (req, res) => {
  try {
    const uid = req.user.id;
    const {
      studyDuration,
      breakDuration,
      pickupCount = 0,
    } = req.body;

    // 1) log the raw session
    await sessionsService.logSession(uid, studyDuration, breakDuration, pickupCount);

    // 2) update raw totals
    await achievementsService.updateRawTotals(uid, {
      focusIncrement:    studyDuration,
      sessionIncrement:  1,
      penaltyIncrement:  pickupCount,
    });

    // 3) compute new stats & unlocked badges
    const stats        = await statsService.calculateStats(uid);
    const achievements = await achievementsService.listUnlocked(uid);

    return res.json({ success: true, stats, achievements });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};