const admin = require('firebase-admin');
jest.mock('firebase-admin');

const settingsController = require('../../server/controllers/settingsController');

describe('settingsController', () => {
  let req, res;
  let getMock, setMock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    getMock = jest.fn();
    setMock = jest.fn();

    // Mock the Firestore doc object returned at the deepest .doc('goals')
    const goalsDocMock = {
      get: getMock,
      set: setMock,
    };

    // Mock collection('settings')
    const settingsCollectionMock = {
      doc: jest.fn(() => goalsDocMock),
    };

    // Mock doc(uid)
    const userDocMock = {
      collection: jest.fn(() => settingsCollectionMock),
    };

    // Mock collection('users')
    const usersCollectionMock = {
      doc: jest.fn(() => userDocMock),
    };

    // Mock firestore() returning collection('users')
    const firestoreMock = {
      collection: jest.fn((name) => {
        if (name === 'users') return usersCollectionMock;
        throw new Error(`Unexpected collection: ${name}`);
      }),
    };

    admin.firestore.mockReturnValue(firestoreMock);

    // Re-import controller after mock setup
    // Important so controller uses mocked admin.firestore
    jest.resetModules();
    require('../../server/controllers/settingsController');

    req = {
      user: { uid: 'test-uid' },
      body: {},
    };

    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };
  });

  //getGoals endpoint

  describe('getGoals', () => {
    it('happy path: returns goals from Firestore', async () => {
      getMock.mockResolvedValue({
        exists: true,
        data: () => ({ dailyHours: 3 }),
      });

      await settingsController.getGoals(req, res);

      expect(getMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        goals: { dailyHours: 3 }
      });
    });

    it('edge case: returns default goals if no doc exists', async () => {
      getMock.mockResolvedValue({
        exists: false,
      });

      await settingsController.getGoals(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        goals: { dailyHours: 2 }
      });
    });

    it('error case: handles Firestore error with 500', async () => {
      getMock.mockRejectedValue(new Error('Firestore failure'));

      await settingsController.getGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Firestore failure',
      });
    });
  });

  //updateGoals endpoint

  describe('updateGoals', () => {
    it('happy path: updates dailyHours successfully', async () => {
      req.body = { dailyHours: 5 };
      setMock.mockResolvedValue();

      await settingsController.updateGoals(req, res);

      expect(setMock).toHaveBeenCalledWith({ dailyHours: 5 }, { merge: true });
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('edge case: returns 400 for invalid dailyHours (negative)', async () => {
      req.body = { dailyHours: -1 };

      await settingsController.updateGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Daily hours must be a number between 0 and 24'
      });
    });

    it('edge case: returns 400 for invalid dailyHours (over 24)', async () => {
      req.body = { dailyHours: 25 };

      await settingsController.updateGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Daily hours must be a number between 0 and 24'
      });
    });

    it('edge case: returns 400 for invalid dailyHours (not a number)', async () => {
      req.body = { dailyHours: 'abc' };

      await settingsController.updateGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Daily hours must be a number between 0 and 24'
      });
    });

    it('error case: handles Firestore error with 500', async () => {
      req.body = { dailyHours: 4 };
      setMock.mockRejectedValue(new Error('Firestore failure'));

      await settingsController.updateGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Firestore failure',
      });
    });
  });
});
