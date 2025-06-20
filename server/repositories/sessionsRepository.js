import admin from "firebase-admin";
const db = admin.firestore();

export async function getUserStats(userId) {
  const snap = await db
    .collection("sessions")
    .where("userId", "==", userId)
    .get();

  let totalFocus = 0, count = 0;
  snap.forEach(doc => {
    const { studyDuration = 0 } = doc.data();
    totalFocus += studyDuration;
    count++;
  });

  return { totalFocus, sessionsCount: count };
}