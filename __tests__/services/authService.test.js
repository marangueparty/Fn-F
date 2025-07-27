// __tests__/services/authService.test.js
const admin = require('firebase-admin');
const fetch = require('node-fetch');
jest.mock('firebase-admin');
jest.mock('node-fetch');

const { createUser, loginWithEmail, sendPasswordReset } = require('../../server/services/authService');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //createUser endpoint

  describe('createUser', () => {
    it('happy path: calls admin.auth().createUser with correct params', async () => {
      const mockCreateUser = jest.fn().mockResolvedValue({ uid: 'user123' });
      admin.auth.mockReturnValue({ createUser: mockCreateUser });

      const result = await createUser('test@example.com', 'password123');

      expect(admin.auth).toHaveBeenCalled();
      expect(mockCreateUser).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
      expect(result).toEqual({ uid: 'user123' });
    });
  });

  //loginWithEmail endpoint

  describe('loginWithEmail', () => {
    it('happy path: returns idToken on successful login', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ idToken: 'mocked-token' }),
      };
      fetch.mockResolvedValue(mockResponse);

      const token = await loginWithEmail('test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(process.env.FIREBASE_API_KEY),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123', returnSecureToken: true }),
        })
      );
      expect(token).toBe('mocked-token');
    });

    it('error case: throws error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: { message: 'INVALID_PASSWORD' } }),
      };
      fetch.mockResolvedValue(mockResponse);

      await expect(loginWithEmail('test@example.com', 'wrongpassword')).rejects.toThrow('INVALID_PASSWORD');
    });
  });

  //sendPasswordReset endpoint

  describe('sendPasswordReset', () => {
    it('happy path: calls admin.auth().generatePasswordResetLink with email', async () => {
      const mockGenerateLink = jest.fn().mockResolvedValue('https://reset.link');
      admin.auth.mockReturnValue({ generatePasswordResetLink: mockGenerateLink });

      const link = await sendPasswordReset('test@example.com');

      expect(admin.auth).toHaveBeenCalled();
      expect(mockGenerateLink).toHaveBeenCalledWith('test@example.com');
      expect(link).toBe('https://reset.link');
    });

    it('error case: propagates errors from generatePasswordResetLink', async () => {
      const error = new Error('auth/user-not-found');
      const mockGenerateLink = jest.fn().mockRejectedValue(error);
      admin.auth.mockReturnValue({ generatePasswordResetLink: mockGenerateLink });

      await expect(sendPasswordReset('unknown@example.com')).rejects.toThrow('auth/user-not-found');
    });
  });
});
