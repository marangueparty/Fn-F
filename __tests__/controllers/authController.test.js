// __tests__/authController.test.js
const fetch = require('node-fetch');
const admin = require('firebase-admin');

jest.mock('node-fetch', () => jest.fn());
jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({
    generateEmailVerificationLink: jest.fn(),
  })),
}));

const authController = require('../../server/controllers/authController');

describe('Auth Controller', () => {
  let res;

  beforeEach(() => {
    process.env.FIREBASE_API_KEY = 'fake-api-key';

    fetch.mockReset();
    admin.auth().generateEmailVerificationLink.mockReset();

    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };
  });

  describe('login', () => {
    it('returns token on successful login', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => ({ idToken: 'fake-token' }),
      });

      const req = { body: { email: 'test@test.com', password: 'password123' } };
      await authController.login(req, res);

      expect(fetch).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, token: 'fake-token' });
    });

    it('returns error if Firebase API key missing', async () => {
      delete process.env.FIREBASE_API_KEY;
      const req = { body: { email: '', password: '' } };
      await authController.login(req, res);

      // Controller returns 500 for missing API key:
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Missing FIREBASE_API_KEY' });
    });

    it('returns error from Firebase on failed login', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => ({ error: { message: 'INVALID_PASSWORD' } }),
      });

      const req = { body: { email: 'test@test.com', password: 'wrong' } };
      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'INVALID_PASSWORD' });
    });
  });

  describe('signup', () => {
    it('returns success on successful signup', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => ({}),
      });
      admin.auth().generateEmailVerificationLink.mockResolvedValueOnce('some-link');

      const req = { body: { email: 'new@test.com', password: 'password123' } };
      await authController.signup(req, res);

      expect(fetch).toHaveBeenCalled();
      expect(admin.auth().generateEmailVerificationLink).toHaveBeenCalledWith('new@test.com');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('returns error if Firebase API key missing', async () => {
      delete process.env.FIREBASE_API_KEY;
      const req = { body: { email: '', password: '' } };
      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Missing FIREBASE_API_KEY' });
    });

    it('returns error from Firebase on failed signup', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => ({ error: { message: 'EMAIL_EXISTS' } }),
      });

      const req = { body: { email: 'exist@test.com', password: 'password123' } };
      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'EMAIL_EXISTS' });
    });
  });
});
