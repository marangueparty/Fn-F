// __tests__/achievementsController.test.js
jest.mock('firebase-admin');

const achievementsController = require('../../server/controllers/achievementsController');
const statsService = require('../../server/services/statsService');
const achievementsService = require('../../server/services/achievementsService');

jest.mock('../../server/services/statsService');
jest.mock('../../server/services/achievementsService');

describe('achievementsController', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    req = {
      user: { uid: 'test-uid' },
      body: {}
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Suppress console.error during error tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  //getCurrent endpoint

  describe('getCurrent', () => {
    test('happy path: should return stats and achievements on success', async () => {
      statsService.calculateStats.mockResolvedValue({ currentLevel: 2, totalFocus: 100 });
      achievementsService.listUnlocked.mockResolvedValue([{ id: 'badge1' }, { id: 'badge2' }]);

      await achievementsController.getCurrent(req, res);

      expect(statsService.calculateStats).toHaveBeenCalledWith('test-uid');
      expect(achievementsService.listUnlocked).toHaveBeenCalledWith('test-uid');

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        stats: { currentLevel: 2, totalFocus: 100 },
        achievements: [{ id: 'badge1' }, { id: 'badge2' }]
      });
    });

    test('edge case: should handle error thrown by statsService gracefully', async () => {
      statsService.calculateStats.mockRejectedValue(new Error('Stats failure'));

      await achievementsController.getCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Stats failure'
      });
    });

    test('edge case: should handle error thrown by achievementsService gracefully', async () => {
      statsService.calculateStats.mockResolvedValue({ currentLevel: 1 });
      achievementsService.listUnlocked.mockRejectedValue(new Error('Achievements failure'));

      await achievementsController.getCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Achievements failure'
      });
    });

    test('error case: should handle missing uid gracefully', async () => {
      req.user = {};

      await achievementsController.postCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized: missing user ID',
      });
    });
  });

  //postCurrent endpoint

  describe('postCurrent', () => {
    beforeEach(() => {
      // Setup request body with valid input
      req.body = {
        focusCollected: 120,
        sessions: 5,
        penalties: 2
      };
    });

    test('happy path: should call updateRawTotals and respond success on valid input', async () => {
      achievementsService.updateRawTotals.mockResolvedValue();

      await achievementsController.postCurrent(req, res);

      expect(achievementsService.updateRawTotals).toHaveBeenCalledWith('test-uid', {
        totalFocus: 120,
        totalSessions: 5,
        totalPenalties: 2,
      });

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('error case: should handle service errors gracefully', async () => {
      achievementsService.updateRawTotals.mockRejectedValue(new Error('Update failure'));

      await achievementsController.postCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Update failure',
      });
    });

    test('edge case: should handle missing fields in body', async () => {
      req.body = {}; // no fields

      achievementsService.updateRawTotals.mockResolvedValue();

      await achievementsController.postCurrent(req, res);

      expect(achievementsService.updateRawTotals).toHaveBeenCalledWith('test-uid', {
        totalFocus: undefined,
        totalSessions: undefined,
        totalPenalties: undefined,
      });

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('edge case: should handle missing uid gracefully', async () => {
      req.user = {};

      await achievementsController.postCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
    });
  });
});