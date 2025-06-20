// before: only studyDuration & breakDuration
// now: we also accept pickupCount (default 0)

const { logSession } = require('../services/sessionsService');

exports.addSession = async (req, res) => {
  try {
    const {
      studyDuration,
      breakDuration,
      pickupCount = 0   // ← new field
    } = req.body;

    const id = await logSession(studyDuration, breakDuration, pickupCount);
    res.json({ success: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
};