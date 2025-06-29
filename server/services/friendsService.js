// server/services/friendsService.js
const admin = require('firebase-admin');
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function addFriend(userId, friendEmail) {
  // look up their UID
  const userRecord = await admin.auth().getUserByEmail(friendEmail);
  const friendUid = userRecord.uid;
  // atomically append to your friends array
  await db
    .collection('users')
    .doc(userId)
    .set(
      { friends: FieldValue.arrayUnion(friendUid) },
      { merge: true }
    );
  return friendUid;
}

async function listFriends(userId) {
  const snap = await db.collection('users').doc(userId).get();
  const data = snap.data() || {};
  return Array.isArray(data.friends) ? data.friends : [];
}

module.exports = { addFriend, listFriends };