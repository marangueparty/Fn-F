jest.mock('firebase-admin');

const sessionsController = require('../../server/controllers/sessionsController');
const sessionsService = require('../../server/services/sessionsService');
const achievementsService = require('../../server/services/achievementsService');
const statsService = require('../../server/services/statsService');

jest.mock('../../server/services/sessionsService');
jest.mock('../../server/services/achievementsService');
jest.mock('../../server/services/statsService');

describe('sessionsController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user123', uid: 'user123' },
      body: {
        studyDuration: 30,
        breakDuration: 5,
        pickupCount: 2,
      },
    };

    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    jest.clearAllMocks();
  });

  describe('addSession', () => {
    it('logs a new session and returns success and id', async () => {
      sessionsService.logSession.mockResolvedValueOnce('session-id-1');

      await sessionsController.addSession(req, res);

      expect(sessionsService.logSession).toHaveBeenCalledWith(
        req.user.uid,
        req.body.studyDuration,
        req.body.breakDuration,
        req.body.pickupCount
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, id: 'session-id-1' });
    });

    it('returns 500 on error', async () => {
      sessionsService.logSession.mockRejectedValueOnce(new Error('fail'));

      await sessionsController.addSession(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'fail' });
    });
  });

  describe('listSessions', () => {
    it('returns session list from Firestore', async () => {
      // Mock Firestore collection query
      const mockDocs = [
        { id: 'abc', data: () => ({ foo: 'bar' }) },
        { id: 'def', data: () => ({ foo: 'baz' }) },
      ];
      const mockSnapshot = { docs: mockDocs };
      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);

      // Mock firestore chain
      const mockOrderBy = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ orderBy: mockOrderBy }));

      jest.mock('firebase-admin', () => ({
        firestore: () => ({
          collection: mockCollection,
        }),
      }));

      // Replace require to re-import after mocking
      jest.resetModules();
      const sessionsControllerReloaded = require('../../server/controllers/sessionsController');

      await sessionsControllerReloaded.listSessions({}, res);

      expect(mockCollection).toHaveBeenCalledWith('sessions');
      expect(mockOrderBy).toHaveBeenCalledWith('startedAt', 'desc');
      expect(mockGet).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith([
        { id: 'abc', foo: 'bar' },
        { id: 'def', foo: 'baz' },
      ]);
    });

    it('returns 500 on error', async () => {
      // Mock Firestore chain to throw
      const mockGet = jest.fn().mockRejectedValue(new Error('fail'));
      const mockOrderBy = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ orderBy: mockOrderBy }));

      jest.mock('firebase-admin', () => ({
        firestore: () => ({
          collection: mockCollection,
        }),
      }));

      jest.resetModules();
      const sessionsControllerReloaded = require('../../server/controllers/sessionsController');

      await sessionsControllerReloaded.listSessions({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'fail' });
    });
  });

  describe('completeSession', () => {
    it('logs session, updates achievements, returns stats and achievements', async () => {
      sessionsService.logSession.mockResolvedValueOnce();
      achievementsService.updateRawTotals.mockResolvedValueOnce();
      statsService.calculateStats.mockResolvedValueOnce({ level: 2 });
      achievementsService.listUnlocked.mockResolvedValueOnce([{ id: 'badge1' }]);

      await sessionsController.completeSession(req, res);

      expect(sessionsService.logSession).toHaveBeenCalledWith(
        req.user.id,
        req.body.studyDuration,
        req.body.breakDuration,
        req.body.pickupCount
      );
      expect(achievementsService.updateRawTotals).toHaveBeenCalledWith(req.user.id, {
        focusIncrement: req.body.studyDuration,
        sessionIncrement: 1,
        penaltyIncrement: req.body.pickupCount,
      });
      expect(statsService.calculateStats).toHaveBeenCalledWith(req.user.id);
      expect(achievementsService.listUnlocked).toHaveBeenCalledWith(req.user.id);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        stats: { level: 2 },
        achievements: [{ id: 'badge1' }],
      });
    });

    it('returns 500 on error', async () => {
      sessionsService.logSession.mockRejectedValueOnce(new Error('fail'));

      await sessionsController.completeSession(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'fail' });
    });
  });
});