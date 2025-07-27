const admin = require('firebase-admin');
jest.mock('firebase-admin');

const { calculateStats } = require('../../server/services/statsService');

describe('statsService', () => {
  let collectionMock, whereMock, getMock;

  beforeEach(() => {
    jest.clearAllMocks();

    getMock = jest.fn();

    whereMock = jest.fn(() => ({ get: getMock }));

    collectionMock = jest.fn(() => ({ where: whereMock }));

    admin.firestore.mockReturnValue({
      collection: collectionMock,
    });
  });

  it('calculateStats returns correct aggregated stats', async () => {
    // Setup Firestore mock data for sessions
    getMock.mockResolvedValue({
      docs: [
        { data: () => ({ studyDuration: 120, breakDuration: 30, pickupCount: 2 }) },
        { data: () => ({ studyDuration: 60, breakDuration: 15, pickupCount: 4 }) },
        { data: () => ({ studyDuration: 30, breakDuration: 5, pickupCount: 0 }) },
      ],
    });

    const userId = 'user123';

    const stats = await calculateStats(userId);

    expect(admin.firestore).toHaveBeenCalled();
    expect(collectionMock).toHaveBeenCalledWith('sessions');
    expect(whereMock).toHaveBeenCalledWith('userId', '==', userId);
    expect(getMock).toHaveBeenCalled();

    expect(stats).toMatchObject({
      rawFocus: 210,
      totalBreak: 50,
      totalPickups: 6,
      penaltyMinutes: 9,
      netFocus: 201,
      currentLevel: expect.any(Number),
      nextLevel: expect.any(Number),
      minutesForNext: expect.any(Number),
      minutesToNext: expect.any(Number),
    });
  });

  it('edge case: calculateStats handles empty sessions', async () => {
    getMock.mockResolvedValue({ docs: [] });

    const userId = 'userEmpty';

    const stats = await calculateStats(userId);

    expect(stats.rawFocus).toBe(0);
    expect(stats.totalBreak).toBe(0);
    expect(stats.totalPickups).toBe(0);
    expect(stats.penaltyMinutes).toBe(0);
    expect(stats.netFocus).toBe(0);
    expect(stats.currentLevel).toBe(1);
    expect(stats.nextLevel).toBe(2);
  });
});