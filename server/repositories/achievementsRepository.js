const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Get all users from 'users' collection.
 * Returns an array of user documents or IDs.
 */
async function getAllUsers() {
  const usersSnapshot = await db.collection('users').get();
  return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**s
 * Get achievements for a single user by userId.
 * Returns array of achievement objects.
 */
async function getUserAchievements(userId) {
  const achievementsSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('achievements')
    .get();

  return achievementsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Save a single achievement for a user.
 */
async function saveUserAchievement(userId, achievement) {
  const ref = db
    .collection('users')
    .doc(userId)
    .collection('achievements')
    .doc(achievement.id);

  await ref.set({
    name: achievement.name,
    description: achievement.description,
    unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = {
  getAllUsers,
  getUserAchievements,
  saveUserAchievement,
};
