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

exports.checkUsername = async (req, res) => {
  const { username } = req.body;
  const uid = req.user && (req.user.id || req.user.uid);
  if (!username) return res.status(400).json({ available: false, error: 'Missing username' });
  try {
    const snap = await admin.firestore().collection('usernames').doc(username).get();
    if (!snap.exists) return res.json({ available: true });
    const data = snap.data();
    // If the username belongs to the current user, allow it
    if (uid && data.uid === uid) return res.json({ available: true });
    return res.json({ available: false });
  } catch (err) {
    console.error('checkUsername error', err);
    return res.status(500).json({ available: false, error: err.message });
  }
};

exports.lookupEmail = async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });
  try {
    const snap = await admin.firestore().collection('usernames').doc(username).get();
    if (!snap.exists) return res.status(404).json({ error: 'Username not found' });
    const { uid } = snap.data();
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    const { email } = userDoc.data();
    return res.json({ email });
  } catch (err) {
    console.error('lookupEmail error', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.updateUsername = async (req, res) => {
  const { newUsername } = req.body;
  const uid = req.user && (req.user.id || req.user.uid);
  console.log('updateUsername called with:', { newUsername, uid, user: req.user });
  if (!uid) {
    return res.status(400).json({ success: false, error: 'Missing or invalid user ID (uid)' });
  }
  if (!newUsername || typeof newUsername !== 'string' || !newUsername.trim()) {
    return res.status(400).json({ success: false, error: 'Invalid newUsername' });
  }
  const trimmed = newUsername.trim();
  try {
    // Get current user doc
    const userRef = admin.firestore().collection('users').doc(uid);
    let userDoc = await userRef.get();
    let userData = userDoc.data() || {};
    // Auto-populate if missing or empty
    if (!userDoc.exists || !userData.email) {
      userData.email = req.user.email || '';
      await userRef.set({ email: userData.email }, { merge: true });
      userDoc = await userRef.get();
      userData = userDoc.data() || {};
      console.log('Auto-populated user doc for', uid);
    }
    const oldUsername = userData.username;
    // If the new username is the same as the current one, treat as no-op
    if (oldUsername === trimmed) {
      return res.json({ success: true });
    }
    // Check if new username is available (or belongs to this user)
    const usernameSnap = await admin.firestore().collection('usernames').doc(trimmed).get();
    if (usernameSnap.exists && usernameSnap.data().uid !== uid) {
      return res.status(400).json({ success: false, error: 'Username already taken' });
    }
    // Update user doc with new username
    await userRef.set({ username: trimmed }, { merge: true });
    // Create new username mapping
    await admin.firestore().collection('usernames').doc(trimmed).set({ uid });
    // Delete old username mapping
    if (oldUsername && oldUsername !== trimmed) {
      await admin.firestore().collection('usernames').doc(oldUsername).delete();
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('updateUsername error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.signup = async (req, res) => {
  const { email, password, username } = req.body;
  if (!FIREBASE_API_KEY) {
    return res.status(500).json({ success:false, error:'Missing FIREBASE_API_KEY' });
  }
  if (!username) {
    return res.status(400).json({ success:false, error:'Username required' });
  }
  // Check username uniqueness
  const usernameSnap = await admin.firestore().collection('usernames').doc(username).get();
  if (usernameSnap.exists) {
    return res.status(400).json({ success:false, error:'Username already taken' });
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
    // 3) create /users/{uid} document in Firestore with email and username
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.firestore()
               .collection('users')
               .doc(userRecord.uid)
               .set({ email, username }, { merge: true });
    // 4) create /usernames/{username} mapping
    await admin.firestore().collection('usernames').doc(username).set({ uid: userRecord.uid });
    return res.json({ success:true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:err.message });
  }
};

exports.getProfile = async (req, res) => {
  const uid = req.user && (req.user.id || req.user.uid);
  console.log('getProfile called with:', { uid, user: req.user });
  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    let userDoc = await userRef.get();
    let userData = userDoc.data() || {};
    // Auto-populate if missing or empty
    if (!userDoc.exists || !userData.email) {
      userData.email = req.user.email || '';
      await userRef.set({ email: userData.email }, { merge: true });
      userDoc = await userRef.get();
      userData = userDoc.data() || {};
      console.log('Auto-populated user doc for', uid);
    }
    const profile = { email: userData.email || '', username: userData.username || '' };
    console.log('Returning profile:', profile);
    return res.json(profile);
  } catch (err) {
    console.error('getProfile error', err);
    return res.status(500).json({ error: err.message });
  }
};