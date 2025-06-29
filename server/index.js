// index.js

const path    = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express            = require('express');
const cors               = require('cors');
const fetch              = require('node-fetch');
const admin              = require('firebase-admin');
const serviceAccount     = require('./serviceAccountKey.json');

// ── 1) initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const authRouter         = require('./routes/auth');
const sessionsRouter     = require('./routes/sessions');
const achievementsRouter = require('./routes/achievementsRoute');
const friendsRouter     = require('./routes/friends');
const leaderboardRouter  = require('./routes/leaderboard');

const app = express();
app.use(cors());
app.use(express.json());

// ── 2) Auth middleware for protected routes
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = header.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    // attach the Firebase UID to req.user.id
    req.user = { id: decoded.uid };
    next();
  } catch (err) {
    console.error('Error verifying Firebase ID token:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// ── 3) health check
app.get('/', (_req, res) => res.send('🟢 Firebase Admin is working!'));

// ── 4) mount sub-routers
app.use('/auth', authRouter);
// protect sessions and achievements with authenticate middleware
app.use('/sessions', authenticate, sessionsRouter);
app.use('/achievements', authenticate, achievementsRouter);
app.use('/friends',      authenticate, friendsRouter);
app.use('/leaderboard',  authenticate, leaderboardRouter);
// ── 5) start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔌 Server listening on http://localhost:${PORT}`));