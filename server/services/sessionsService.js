const admin = require('firebase-admin');
const FieldValue = admin.firestore.FieldValue;

exports.logSession = async (studyDuration, breakDuration, pickupCount) => {
  const doc = await admin
    .firestore()
    .collection('sessions')
    .add({
      studyDuration,
      breakDuration,
      pickupCount,               // ← store your penalty count
      startedAt: FieldValue.serverTimestamp(),
    });
  return doc.id;
};