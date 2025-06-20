import admin from "firebase-admin";
const db = admin.firestore();

export async function getUserAchievements(userId) {
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("achievements")
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveUserAchievement(userId, achievement) {
  const ref = db
    .collection("users")
    .doc(userId)
    .collection("achievements")
    .doc(achievement.id);

  await ref.set({
    name:        achievement.name,
    description: achievement.description,
    unlockedAt:  admin.firestore.FieldValue.serverTimestamp(),
  });
}