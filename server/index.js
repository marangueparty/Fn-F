// server/index.js
require('dotenv').config();                 // 0️⃣ load .env (contains FIREBASE_API_KEY)
const express         = require('express');
const cors            = require('cors');
const fetch           = require('node-fetch'); // npm install node-fetch@2
const admin           = require('firebase-admin');
const serviceAccount  = require('./serviceAccountKey.json');

// your new imports ↓
const sessionsController     = require('./controllers/sessionsController');
const achievementsController = require('./controllers/achievementsController');

// 1️⃣ Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

// 2️⃣ Health‐check
app.get('/', (_req, res) => res.send('🟢 Firebase Admin is working!'));

// 3️⃣ Login endpoint (unchanged)
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const key = process.env.FIREBASE_API_KEY;
  try {
    if (!key) throw new Error('Missing FIREBASE_API_KEY');
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      }
    );
    const data = await r.json();
    if (data.error) {
      return res.status(400).json({ success: false, error: data.error.message });
    }
    return res.json({ success: true, token: data.idToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4️⃣ Sign-Up endpoint (unchanged)
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  const key = process.env.FIREBASE_API_KEY;
  try {
    if (!key) throw new Error('Missing FIREBASE_API_KEY');
    // 4a) call REST signUp
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      }
    );
    const data = await r.json();
    if (data.error) {
      return res.status(400).json({ success: false, error: data.error.message });
    }
    // 4b) send verification link
    await admin.auth().generateEmailVerificationLink(email);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ➕ record each study session
app.post('/sessions', sessionsController.addSession);

// ➕ list a user’s unlocked achievements
app.get('/achievements', achievementsController.listAchievements);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔌 Server listening on http://localhost:${PORT}`));