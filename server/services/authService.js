const admin = require('firebase-admin');
const fetch = require('node-fetch');
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

function createUser(email, password) {
  return admin.auth().createUser({ email, password });
}

async function loginWithEmail(email, password) {
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
  return data.idToken;
}

// ——— NEW export ———
/**
 * Generate & dispatch a Firebase password-reset link.
 * Throws `auth/user-not-found` if no such user.
 */
async function sendPasswordReset(email) {
  // This will throw if the email is not in your Firebase Auth user list
  return admin.auth().generatePasswordResetLink(email);
}

module.exports = {
  createUser,
  loginWithEmail,
  sendPasswordReset,   // ← newly added
};