// __tests__/services/achievementsService.test.js
// __tests__/services/achievementsService.test.js
const admin = require('firebase-admin');
jest.mock('firebase-admin');
const statsService = require('../../server/services/statsService');
jest.mock('../../server/services/statsService');

const achievementsService = require('../../server/services/achievementsService');

describe('achievementsService', () => {
  let setMock, getMock, docMock, collectionMock;

  beforeEach(() => {
    jest.clearAllMocks();

    setMock = jest.fn().mockResolvedValue();
    getMock = jest.fn();

    docMock = jest.fn(() => ({
      set: setMock,
      get: getMock,
    }));

    collectionMock = jest.fn(() => ({
      doc: docMock,
    }));

    const firestoreMock = jest.fn(() => ({
      collection: collectionMock,
    }));

    admin.firestore.mockReturnValue(firestoreMock);

    // Mock FieldValue helpers
    admin.firestore.FieldValue = {
      increment: jest.fn((val) => val),
    };
  });

  //updateRawTotals endpoint

  describe('updateRawTotals', () => {
    it('happy path: calls set with increments and merge:true', async () => {
      const uid = 'user123';
      const increments = { focusIncrement: 5, sessionIncrement: 3, penaltyIncrement: 1 };

      await achievementsService.updateRawTotals(uid, increments);

      expect(admin.firestore).toHaveBeenCalled();
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith(uid);
      expect(collectionMock).toHaveBeenCalledWith('achievements');
      expect(docMock).toHaveBeenCalledWith('raw');

      expect(setMock).toHaveBeenCalledWith({
        totalFocus: increments.focusIncrement,
        totalSessions: increments.sessionIncrement,
        totalPenalties: increments.penaltyIncrement,
      }, { merge: true });

      expect(admin.firestore.FieldValue.increment).toHaveBeenCalledTimes(3);
      expect(admin.firestore.FieldValue.increment).toHaveBeenCalledWith(increments.focusIncrement);
      expect(admin.firestore.FieldValue.increment).toHaveBeenCalledWith(increments.sessionIncrement);
      expect(admin.firestore.FieldValue.increment).toHaveBeenCalledWith(increments.penaltyIncrement);
    });
  });

  //listUnlocked endpoint

  describe('listUnlocked', () => {
    it('happy path: returns badges unlocked based on raw totals and streak', async () => {
      const uid = 'user123';

      // Mock get() to return raw totals
      getMock.mockResolvedValue({
        exists: true,
        data: () => ({
          totalFocus: 700,
          totalSessions: 2,
          totalPenalties: 0,
        }),
      });

      // Mock streak function to true
      statsService.hasNdayStreak.mockResolvedValue(true);

      const unlocked = await achievementsService.listUnlocked(uid);

      expect(admin.firestore).toHaveBeenCalled();
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith(uid);
      expect(collectionMock).toHaveBeenCalledWith('achievements');
      expect(docMock).toHaveBeenCalledWith('raw');
      expect(getMock).toHaveBeenCalled();

      expect(statsService.hasNdayStreak).toHaveBeenCalledWith(uid, 3);

      expect(unlocked).toEqual([
        { id: 'first_session' },
        { id: 'focus_10h' },
        { id: 'streak_3' },
      ]);
    });

    it('edge case: returns empty badges if no raw totals exist and no streak', async () => {
      const uid = 'user123';

      getMock.mockResolvedValue({ exists: false });

      statsService.hasNdayStreak.mockResolvedValue(false);

      const unlocked = await achievementsService.listUnlocked(uid);

      expect(unlocked).toEqual([]);
    });
  });
});
