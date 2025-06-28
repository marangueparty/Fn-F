// __tests__/achievementsController.test.js

const achievementsController = require('../path/to/achievementsController');
const statsService = require('../services/statsService');
const achievementsService = require('../services/achievementsService');

jest.mock('../services/statsService');
jest.mock('../services/achievementsService');

describe('Achievements Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      body: { focusCollected: 100, sessions: 5, penalties: 1 },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getCurrent', () => {
    it('should respond with stats and unlocked achievements on success', async () => {
      const mockStats = { totalFocus: 100, currentLevel: 2 };
      const mockAchievements = [{ id: 'first_session' }];

      statsService.calculateStats.mockResolvedValue(mockStats);
      achievementsService.listUnlocked.mockResolvedValue(mockAchievements);

      await achievementsController.getCurrent(req, res);

      expect(statsService.calculateStats).toHaveBeenCalledWith('user123');
      expect(achievementsService.listUnlocked).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        stats: mockStats,
        achievements: mockAchievements,
      });
    });

    it('should respond with 500 on error', async () => {
      const error = new Error('fail');
      statsService.calculateStats.mockRejectedValue(error);

      await achievementsController.getCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'fail',
      });
    });
  });

  describe('postCurrent', () => {
    it('should update raw totals and respond success', async () => {
      achievementsService.updateRawTotals.mockResolvedValue();

      await achievementsController.postCurrent(req, res);

      expect(achievementsService.updateRawTotals).toHaveBeenCalledWith('user123', {
        totalFocus: 100,
        totalSessions: 5,
        totalPenalties: 1,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should respond with 500 on error', async () => {
      const error = new Error('fail');
      achievementsService.updateRawTotals.mockRejectedValue(error);

      await achievementsController.postCurrent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'fail',
      });
    });
  });
});
