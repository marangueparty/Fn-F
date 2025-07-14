const admin = require('firebase-admin');

// Verifies the Firebase ID token in “Authorization: Bearer <token>”
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match  = header.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Missing auth token" });

    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = decoded;         // { uid, email, ... }
    next();
  } catch (e) {
    console.error("Auth error:", e);
    res.status(401).json({ error: "Invalid auth token" });
  }
}

module.exports = { authenticate };