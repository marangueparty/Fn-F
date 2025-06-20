// server/controllers/achievementsController.js
const admin                  = require('firebase-admin');
const { getUserAchievements } = require('../services/achievementsService');

exports.listAchievements = async (req, res) => {
  try {
    // extract and verify the Firebase ID token from Authorization header
    const header = req.headers.authorization || '';
    const idToken = header.replace(/^Bearer\s+/, '');
    const { uid } = await admin.auth().verifyIdToken(idToken);

    const achievements = await getUserAchievements(uid);
    res.json({ success: true, achievements });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};