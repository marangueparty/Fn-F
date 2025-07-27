// __tests__/repositories/achievementsRepository.test.js
const admin = require('firebase-admin');
jest.mock('firebase-admin');

const {
  getAllUsers,
  getUserAchievements,
  saveUserAchievement,
} = require('../../server/repositories/achievementsRepository');

describe('achievementsRepository', () => {
  let collectionMock;
  let docMock;
  let getMock;
  let setMock;

  beforeEach(() => {
    jest.clearAllMocks();

    setMock = jest.fn().mockResolvedValue();
    getMock = jest.fn();

    docMock = jest.fn(() => ({
      collection: jest.fn(() => ({
        get: getMock,
      })),
      get: getMock,
      set: setMock,
    }));

    collectionMock = jest.fn(() => ({
      doc: docMock,
      get: getMock,
    }));

    const firestoreMock = {
      collection: collectionMock,
      FieldValue: {
        serverTimestamp: jest.fn(() => 'mock-timestamp'),
      },
    };

    admin.firestore.mockReturnValue(firestoreMock);
    admin.firestore.FieldValue = firestoreMock.FieldValue;
  });

  describe('getAllUsers', () => {
    it('happy path: fetches all users correctly', async () => {
      getMock.mockResolvedValue({
        docs: [
          { id: 'user1', data: () => ({ name: 'User One' }) },
          { id: 'user2', data: () => ({ name: 'User Two' }) },
        ],
      });

      const users = await getAllUsers();

      expect(admin.firestore).toHaveBeenCalled();
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(getMock).toHaveBeenCalled();

      expect(users).toEqual([
        { id: 'user1', name: 'User One' },
        { id: 'user2', name: 'User Two' },
      ]);
    });
  });

  describe('getUserAchievements', () => {
    it('happy path: fetches achievements for a user', async () => {
      // Mock get for achievements subcollection
      getMock.mockResolvedValue({
        docs: [
          { id: 'achv1', data: () => ({ name: 'Badge 1', description: 'desc1' }) },
          { id: 'achv2', data: () => ({ name: 'Badge 2', description: 'desc2' }) },
        ],
      });

      const achievements = await getUserAchievements('user1');

      expect(admin.firestore).toHaveBeenCalled();
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith('user1');
      // The achievements collection should be accessed inside the doc mock, so no direct expect here
      expect(getMock).toHaveBeenCalled();

      expect(achievements).toEqual([
        { id: 'achv1', name: 'Badge 1', description: 'desc1' },
        { id: 'achv2', name: 'Badge 2', description: 'desc2' },
      ]);
    });
  });

  describe('saveUserAchievement', () => {
    it('happy path: saves achievement with server timestamp', async () => {
      const achievement = {
        id: 'achv1',
        name: 'Badge 1',
        description: 'desc1',
      };

      await saveUserAchievement('user1', achievement);

      expect(admin.firestore).toHaveBeenCalled();
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith('user1');
      // doc called again for the achievement ID
      expect(docMock).toHaveBeenCalledWith('achv1');
      expect(setMock).toHaveBeenCalledWith({
        name: 'Badge 1',
        description: 'desc1',
        unlockedAt: 'mock-timestamp',
      });
    });
  });
});
