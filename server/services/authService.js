import admin from 'firebase-admin';
import fetch from 'node-fetch';
// (we'll use the REST API to verify email/password)

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// 1) createUser → admin SDK
export function createUser(email, password) {
  return admin.auth().createUser({ email, password });
}

// 2) loginWithEmail → REST call to Firebase Auth REST endpoint
export async function loginWithEmail(email, password) {
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    }
  );
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error.message);
  return data.idToken; // your frontend will use this JWT for auth
}