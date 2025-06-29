// __tests__/services/achievementsService.test.js
jest.mock('firebase-admin');


jest.mock('firebase-admin', () => {
  const setMock = jest.fn();
  const getMock = jest.fn();
  const docMock = jest.fn(() => ({
    set: setMock,
    get: getMock,
  }));
  const collectionMock = jest.fn(() => ({
    doc: docMock,
  }));
  const firestoreMock = jest.fn(() => ({
    collection: collectionMock,
  }));

  return {
    firestore: firestoreMock,
    firestoreFieldValue: {
      increment: jest.fn((val) => val),
    },
    firestoreFieldValue: {
      increment: jest.fn((val) => val),
    },
    firestore: {
      FieldValue: {
        increment: jest.fn((val) => val),
      }
    }
  };
});

const admin = require('firebase-admin');
const statsService = require('../../server/services/statsService');
const achievementsService = require('../../server/services/achievementsService');

describe('achievementsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateRawTotals', () => {
    it('calls firestore set with increments and merge true', async () => {
      const setMock = jest.fn();
      const docMock = jest.fn(() => ({ set: setMock }));
      const collectionMock = jest.fn(() => ({ doc: docMock }));
      admin.firestore.mockReturnValue({ collection: collectionMock });

      await achievementsService.updateRawTotals('user123', {
        focusIncrement: 10,
        sessionIncrement: 1,
        penaltyIncrement: 2,
      });

      expect(admin.firestore).toHaveBeenCalled();
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith('user123');
      expect(setMock).toHaveBeenCalledWith({
        totalFocus: 10,
        totalSessions: 1,
        totalPenalties: 2,
      }, { merge: true });
    });
  });

  describe('listUnlocked', () => {
    it('returns unlocked badges based on raw data and streak', async () => {
      const getMock = jest.fn();
      const docMock = jest.fn(() => ({ get: getMock }));
      const collectionMock = jest.fn(() => ({ doc: docMock }));
      admin.firestore.mockReturnValue({ collection: collectionMock });

      // Mock raw data returned by get()
      getMock.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          totalFocus: 700,
          totalSessions: 2,
          totalPenalties: 0,
        }),
      });

      // Mock statsService.hasNdayStreak
      jest.spyOn(statsService, 'hasNdayStreak').mockResolvedValue(true);

      const unlocked = await achievementsService.listUnlocked('user123');

      expect(admin.firestore).toHaveBeenCalled();
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith('user123');
      expect(getMock).toHaveBeenCalled();

      expect(statsService.hasNdayStreak).toHaveBeenCalledWith('user123', 3);

      expect(unlocked).toEqual([
        { id: 'first_session' },
        { id: 'focus_10h' },
        { id: 'streak_3' },
      ]);
    });

    it('returns empty badges if no data and no streak', async () => {
      const getMock = jest.fn();
      const docMock = jest.fn(() => ({ get: getMock }));
      const collectionMock = jest.fn(() => ({ doc: docMock }));
      admin.firestore.mockReturnValue({ collection: collectionMock });

      getMock.mockResolvedValueOnce({ exists: false });

      jest.spyOn(statsService, 'hasNdayStreak').mockResolvedValue(false);

      const unlocked = await achievementsService.listUnlocked('user123');

      expect(unlocked).toEqual([]);
    });
  });
});
