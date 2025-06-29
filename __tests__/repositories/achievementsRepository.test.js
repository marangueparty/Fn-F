// __tests__/repositories/achievementsRepository.test.js
const admin = require('firebase-admin');
const {
  getUserAchievements,
  saveUserAchievement,
} = require('../../server/repositories/achievementsRepository'); 

describe('achievementsRepository', () => {
  let firestoreMock, collectionMock, docMock, getMock, setMock;

  beforeEach(() => {
    firestoreMock = admin.firestore();
    setMock = jest.fn();
    getMock = jest.fn();

    // 1. set up chain of collection/doc calls
    firestoreMock.collection = jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          get: getMock,
          doc: jest.fn(() => ({ set: setMock })),
        })),
      })),
    }));

    // 2. mocking get() to return dummy docs for getUserAchievements
    getMock.mockResolvedValue({
      docs: [
        { id: 'achv1', data: () => ({ name: 'Badge One', description: 'desc1' }) },
        { id: 'achv2', data: () => ({ name: 'Badge Two', description: 'desc2' }) },
      ],
    });

    // 3. mocking set() to resolve for saveUserAchievement
    setMock.mockResolvedValue(undefined);
  });

  it('getUserAchievements returns achievements list', async () => {
    const achievements = await getUserAchievements('user123');

    expect(firestoreMock.collection).toHaveBeenCalledWith('users');
    expect(achievements).toEqual([
      { id: 'achv1', name: 'Badge One', description: 'desc1' },
      { id: 'achv2', name: 'Badge Two', description: 'desc2' },
    ]);
  });

  it('saveUserAchievement writes achievement with timestamp', async () => {
    await saveUserAchievement('user123', {
      id: 'achv1',
      name: 'Badge One',
      description: 'desc 1',
    });

    expect(firestoreMock.collection).toHaveBeenCalledWith('users');
    expect(setMock).toHaveBeenCalledWith({
      name: 'Badge One',
      description: 'desc 1',
      unlockedAt: 'mocked-timestamp',
    });
  });
});