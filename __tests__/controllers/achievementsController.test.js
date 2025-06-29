// __tests__/achievementsController.test.js
jest.mock('firebase-admin');

const achievementsController = require('../../server/controllers/achievementsController');
const statsService = require('../../server/services/statsService');
const achievementsService = require('../../server/services/achievementsService');

jest.mock('../../server/services/statsService');
jest.mock('../../server/services/achievementsService');

describe('achievementsController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('getCurrent', () => {
    it('should return stats and achievements on success', async () => {
      // Mock service return values
      statsService.calculateStats.mockResolvedValue({ totalFocus: 100, currentLevel: 2 });
      achievementsService.listUnlocked.mockResolvedValue([{ id: 'first_session' }]);

      await achievementsController.getCurrent(req, res);

      expect(statsService.calculateStats).toHaveBeenCalledWith('user123');
      expect(achievementsService.listUnlocked).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        stats: { totalFocus: 100, currentLevel: 2 },
        achievements: [{ id: 'first_session' }],
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Something went wrong');
      statsService.calculateStats.mockRejectedValue(error);

      await achievementsController.getCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong',
      });
    });
  });

  describe('postCurrent', () => {
    it('should update raw totals and respond success', async () => {
      req.body = {
        focusCollected: 200,
        sessions: 5,
        penalties: 1,
      };

      achievementsService.updateRawTotals.mockResolvedValue();

      await achievementsController.postCurrent(req, res);

      expect(achievementsService.updateRawTotals).toHaveBeenCalledWith('user123', {
        totalFocus: 200,
        totalSessions: 5,
        totalPenalties: 1,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed update');
      achievementsService.updateRawTotals.mockRejectedValue(error);

      await achievementsController.postCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed update',
      });
    });
  });
});
