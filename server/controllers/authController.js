import * as authSvc from '../services/authService.js';

export async function signup(req, res) {
  try {
    const { email, password } = req.body;
    const userRecord = await authSvc.createUser(email, password);
    res.json({ uid: userRecord.uid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const token = await authSvc.loginWithEmail(email, password);
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
}