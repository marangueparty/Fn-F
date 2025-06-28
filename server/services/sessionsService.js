// server/services/sessionsService.js
const admin      = require('firebase-admin');
const FieldValue = admin.firestore.FieldValue;

exports.logSession = async (userId, studyDuration, breakDuration, pickupCount = 0) => {
  const docRef = await admin.firestore()
    .collection('sessions')
    .add({
      userId,
      studyDuration,
      breakDuration,
      pickupCount,
      startedAt: FieldValue.serverTimestamp(),
    });
  return docRef.id;
};