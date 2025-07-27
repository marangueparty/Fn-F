// __tests__/controllers/sessionsController.test.js
const sessionsController = require('../../server/controllers/sessionsController');
const sessionsService = require('../../server/services/sessionsService');
const achievementsService = require('../../server/services/achievementsService');
const statsService = require('../../server/services/statsService');

const admin = require('firebase-admin');

jest.mock('../../server/services/sessionsService');
jest.mock('../../server/services/achievementsService');
jest.mock('../../server/services/statsService');
jest.mock('firebase-admin');

describe('sessionsController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { uid: 'test-uid' },
      body: {}
    };

    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    // Mock Firestore chain for listSessions
    const getMock = jest.fn();
    admin.firestore.mockReturnValue({
      collection: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          get: getMock
        })),
      })),
    });
    global.getMock = getMock;
  });

  //addSession endpoint

  describe('addSession', () => {
    it('happy path: logs a new session and returns id', async () => {
      req.body = { studyDuration: 25, breakDuration: 5, pickupCount: 2 };
      sessionsService.logSession.mockResolvedValue('session-id-123');

      await sessionsController.addSession(req, res);

      expect(sessionsService.logSession).toHaveBeenCalledWith('test-uid', 25, 5, 2);
      expect(res.json).toHaveBeenCalledWith({ success: true, id: 'session-id-123' });
    });

    it('edge case: service throws error', async () => {
      req.body = { studyDuration: 25, breakDuration: 5 };
      sessionsService.logSession.mockRejectedValue(new Error('DB failure'));

      await sessionsController.addSession(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'DB failure' });
    });
  });

  //listSessions endpoint

  describe('listSessions', () => {
    it('happy path: returns ordered list of sessions', async () => {
      const fakeDocs = [
        { id: '1', data: () => ({ studyDuration: 25 }) },
        { id: '2', data: () => ({ studyDuration: 30 }) }
      ];
      global.getMock.mockResolvedValue({ docs: fakeDocs });

      await sessionsController.listSessions({}, res);

      expect(admin.firestore).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([
        { id: '1', studyDuration: 25 },
        { id: '2', studyDuration: 30 }
      ]);
    });

    it('edge case: Firestore throws error', async () => {
      global.getMock.mockRejectedValue(new Error('Firestore error'));

      await sessionsController.listSessions({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Firestore error' });
    });
  });

  //completeSession endpoint

  describe('completeSession', () => {
    it('happy path: logs session, updates achievements, returns stats and achievements', async () => {
      req.body = { studyDuration: 25, breakDuration: 5, pickupCount: 1 };

      sessionsService.logSession.mockResolvedValue('session-id');
      achievementsService.updateRawTotals.mockResolvedValue();
      statsService.calculateStats.mockResolvedValue({ currentLevel: 2, totalFocus: 100 });
      achievementsService.listUnlocked.mockResolvedValue([{ id: 'badge1' }, { id: 'badge2' }]);

      await sessionsController.completeSession(req, res);

      expect(sessionsService.logSession).toHaveBeenCalledWith('test-uid', 25, 5, 1);
      expect(achievementsService.updateRawTotals).toHaveBeenCalledWith('test-uid', {
        focusIncrement: 25,
        sessionIncrement: 1,
        penaltyIncrement: 1,
      });
      expect(statsService.calculateStats).toHaveBeenCalledWith('test-uid');
      expect(achievementsService.listUnlocked).toHaveBeenCalledWith('test-uid');

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        stats: { currentLevel: 2, totalFocus: 100 },
        achievements: [{ id: 'badge1' }, { id: 'badge2' }],
      });
    });

    it('edge case: service throws error', async () => {
      sessionsService.logSession.mockRejectedValue(new Error('Log session failed'));

      await sessionsController.completeSession(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Log session failed' });
    });
  });
});
