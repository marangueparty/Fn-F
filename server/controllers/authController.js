// server/controllers/authController.js

const fetch = require('node-fetch');
const admin = require('firebase-admin');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!FIREBASE_API_KEY) {
    return res.status(500).json({ success:false, error:'Missing FIREBASE_API_KEY' });
  }

  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({ email, password, returnSecureToken:true }),
      }
    );
    const data = await r.json();
    if (data.error) {
      return res.status(400).json({ success:false, error:data.error.message });
    }
    return res.json({ success:true, token:data.idToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:err.message });
  }
};

exports.signup = async (req, res) => {
  const { email, password } = req.body;
  if (!FIREBASE_API_KEY) {
    return res.status(500).json({ success:false, error:'Missing FIREBASE_API_KEY' });
  }

  try {
    // 1) create the account via Firebase REST API
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({ email, password, returnSecureToken:true }),
      }
    );
    const data = await r.json();
    if (data.error) {
      return res.status(400).json({ success:false, error:data.error.message });
    }

    // 2) send verification email
    await admin.auth().generateEmailVerificationLink(email);

    // ────────────────────────────────────────────────────────────────────────────
    // 3) **NEW**: create /users/{uid} document in Firestore with at least the email
    //    so that you can later query by email (for add-friend and leaderboard).
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.firestore()
               .collection('users')
               .doc(userRecord.uid)
               .set({ email }, { merge: true });
    // ────────────────────────────────────────────────────────────────────────────

    return res.json({ success:true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:err.message });
  }
};