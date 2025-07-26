const admin = require('firebase-admin');
const db = admin.firestore();

const GOAL_DOC = 'focusGoal';

async function getUserFocusGoal(uid) {
  const docRef = db.collection('users').doc(uid).collection('settings').doc(GOAL_DOC);
  const doc = await docRef.get();

  if (!doc.exists) {
    return 120; // default focus goal in minutes
  }
  return doc.data().goalMinutes;
}

async function setUserFocusGoal(uid, goalMinutes) {
  const docRef = db.collection('users').doc(uid).collection('settings').doc(GOAL_DOC);
  await docRef.set({
    goalMinutes,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return goalMinutes;
}

module.exports = {
  getUserFocusGoal,
  setUserFocusGoal,
};
