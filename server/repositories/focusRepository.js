import admin from "firebase-admin";
const db = admin.firestore();

export async function getUserFocusGoal(userId) {
  const doc = await db.collection("users").doc(userId).collection("settings").doc("focusGoal").get();
  if (!doc.exists) return null;
  return doc.data();
}

export async function saveUserFocusGoal(userId, goalMinutes) {
  const ref = db.collection("users").doc(userId).collection("settings").doc("focusGoal");

  await ref.set({
    goalMinutes,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
