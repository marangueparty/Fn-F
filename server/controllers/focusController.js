const admin = require('firebase-admin');

const db = admin.firestore();

const focusGoalService = require('../services/focusService');

const GOAL_DOC = 'focusGoal';

// 1) get current user’s focus goal
exports.getFocusGoal = async (req, res) => {
  try {
    const uid = req.user.id;
    const docRef = db.collection('users').doc(uid).collection('settings').doc(GOAL_DOC);
    const doc = await docRef.get();

    if (!doc.exists) {
      // If not set, return default goal, e.g. 120 mins
      return res.json({ success: true, goalMinutes: 120 });
    }

    return res.json({ success: true, goalMinutes: doc.data().goalMinutes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 2) update user’s focus goal
exports.updateFocusGoal = async (req, res) => {
  try {
    const uid = req.user.id;
    const { goalMinutes } = req.body;

    if (typeof goalMinutes !== 'number' || goalMinutes <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid goalMinutes' });
    }

    const docRef = db.collection('users').doc(uid).collection('settings').doc(GOAL_DOC);
    await docRef.set({
      goalMinutes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, goalMinutes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
