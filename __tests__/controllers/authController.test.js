// __tests__/authController.test.js
// __tests__/controllers/authController.test.js

const fetch = require('node-fetch');
const admin = require('firebase-admin');

jest.mock('node-fetch', () => jest.fn());

jest.mock('firebase-admin', () => {
  const firestoreMock = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const authMock = {
    generateEmailVerificationLink: jest.fn(),
    getUserByEmail: jest.fn(),
    generatePasswordResetLink: jest.fn(),
  };

  return {
    firestore: jest.fn(() => firestoreMock),
    auth: jest.fn(() => authMock),
  };
});

const authController = require('../../server/controllers/authController');

describe('Auth Controller', () => {
  let res;
  let firestoreMock, authMock;

  beforeEach(() => {
    process.env.FIREBASE_API_KEY = 'fake-api-key';

    fetch.mockReset();

    firestoreMock = admin.firestore();
    authMock = admin.auth();

    firestoreMock.collection.mockClear();
    firestoreMock.doc.mockClear();
    firestoreMock.get.mockClear();
    firestoreMock.set.mockClear();
    firestoreMock.delete.mockClear();

    authMock.generateEmailVerificationLink.mockClear();
    authMock.getUserByEmail.mockClear();
    authMock.generatePasswordResetLink.mockClear();

    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };
  });

  // --- login ---
  describe('login', () => {
    it('happy path: returns token on success', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => ({ idToken: 'fake-token' }),
      });
      const req = { body: { email: 'test@test.com', password: 'password123' } };
      await authController.login(req, res);
      expect(fetch).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, token: 'fake-token' });
    });

    it('edge case: missing FIREBASE_API_KEY returns 500', async () => {
      delete process.env.FIREBASE_API_KEY;
      const req = { body: { email: '', password: '' } };
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Missing FIREBASE_API_KEY' });
    });
  });

  // --- checkUsername ---
  describe('checkUsername', () => {
    it('happy path: username available', async () => {
      const req = { body: { username: 'newuser' }, user: { id: 'uid1' } };
      firestoreMock.get.mockResolvedValueOnce({ exists: false });
      await authController.checkUsername(req, res);
      expect(res.json).toHaveBeenCalledWith({ available: true });
    });

    it('edge case: missing username returns 400', async () => {
      const req = { body: {} };
      await authController.checkUsername(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ available: false, error: 'Missing username' });
    });
  });

  // --- lookupEmail ---
  describe('lookupEmail', () => {
    it('happy path: returns email', async () => {
      const req = { body: { username: 'user1' } };
      firestoreMock.get
        .mockResolvedValueOnce({ exists: true, data: () => ({ uid: 'uid1' }) }) // username doc
        .mockResolvedValueOnce({ exists: true, data: () => ({ email: 'user1@example.com' }) }); // user doc
      await authController.lookupEmail(req, res);
      expect(res.json).toHaveBeenCalledWith({ email: 'user1@example.com' });
    });

    it('edge case: username not found returns 404', async () => {
      const req = { body: { username: 'unknown' } };
      firestoreMock.get.mockResolvedValueOnce({ exists: false });
      await authController.lookupEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username not found' });
    });
  });

  // --- updateUsername ---
  describe('updateUsername', () => {
    it('happy path: updates username successfully', async () => {
      const req = { body: { newUsername: 'newuser' }, user: { uid: 'uid1', email: 'user@example.com' } };

      const userDoc = { exists: true, data: () => ({ username: 'olduser', email: 'user@example.com' }) };
      const usernameDoc = { exists: false };

      firestoreMock.doc.mockImplementation((id) => {
        if (id === 'uid1') return { get: jest.fn().mockResolvedValue(userDoc), set: jest.fn() };
        if (id === 'newuser') return { get: jest.fn().mockResolvedValue(usernameDoc), set: jest.fn() };
        if (id === 'olduser') return { delete: jest.fn() };
        return { get: jest.fn(), set: jest.fn(), delete: jest.fn() };
      });

      await authController.updateUsername(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('edge case: missing uid returns 400', async () => {
      const req = { body: { newUsername: 'newuser' }, user: {} };
      await authController.updateUsername(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Missing or invalid user ID (uid)' });
    });
  });

  // --- signup ---
  describe('signup', () => {
    it('happy path: successful signup', async () => {
      const req = { body: { email: 'a@b.com', password: 'pass', username: 'newuser' } };
      fetch.mockResolvedValueOnce({ json: async () => ({}) });
      firestoreMock.get.mockResolvedValueOnce({ exists: false });
      authMock.generateEmailVerificationLink.mockResolvedValueOnce('link');
      authMock.getUserByEmail.mockResolvedValueOnce({ uid: 'uid1' });
      firestoreMock.set.mockResolvedValueOnce();

      await authController.signup(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('edge case: missing username returns 400', async () => {
      const req = { body: { email: 'a@b.com', password: 'pass' } };
      await authController.signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Username required' });
    });
  });

  // --- getProfile ---
  describe('getProfile', () => {
    it('happy path: returns profile info', async () => {
      const req = { user: { id: 'uid1', email: 'email@example.com' } };
      firestoreMock.get.mockResolvedValueOnce({ exists: true, data: () => ({ email: 'email@example.com', username: 'user' }) });
      await authController.getProfile(req, res);
      expect(res.json).toHaveBeenCalledWith({ email: 'email@example.com', username: 'user' });
    });

    it('edge case: error fetching user doc returns 500', async () => {
      const req = { user: { id: 'uid1' } };
      firestoreMock.get.mockRejectedValueOnce(new Error('Firestore error'));
      await authController.getProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Firestore error' });
    });
  });

  // --- forgotPassword ---
  describe('forgotPassword', () => {
    it('happy path: sends reset link', async () => {
      const req = { body: { email: 'a@b.com' } };
      authMock.generatePasswordResetLink.mockResolvedValueOnce();
      await authController.forgotPassword(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('edge case: missing email returns 400', async () => {
      const req = { body: {} };
      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Missing email' });
    });
  });
});
