const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * GET /settings/goals
 * Get user's study goals
 */
exports.getGoals = async (req, res) => {
  try {
    const uid = req.user.uid;
    
    const doc = await db
      .collection('users')
      .doc(uid)
      .collection('settings')
      .doc('goals')
      .get();

    const goals = doc.exists ? doc.data() : { dailyHours: 2 }; // default 2 hours
    
    return res.json({
      success: true,
      goals
    });
  } catch (err) {
    console.error('Error getting goals:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /settings/goals
 * Update user's study goals
 */
exports.updateGoals = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { dailyHours } = req.body;
    
    if (typeof dailyHours !== 'number' || dailyHours < 0 || dailyHours > 24) {
      return res.status(400).json({ 
        success: false, 
        error: 'Daily hours must be a number between 0 and 24' 
      });
    }

    await db
      .collection('users')
      .doc(uid)
      .collection('settings')
      .doc('goals')
      .set({ dailyHours }, { merge: true });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating goals:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}; 