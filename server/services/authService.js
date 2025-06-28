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

module.exports = { createUser, loginWithEmail };