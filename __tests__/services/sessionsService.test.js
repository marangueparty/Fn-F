// __tests__/services/sessionsService.test.js
const admin = require('firebase-admin');
jest.mock('firebase-admin');

const { logSession } = require('../../server/services/sessionsService');

describe('sessionsService', () => {
  let collectionMock;
  let addMock;

  beforeEach(() => {
    jest.clearAllMocks();

    addMock = jest.fn().mockResolvedValue({ id: 'mock-session-id' });

    collectionMock = jest.fn(() => ({
      add: addMock,
    }));

    const firestoreMock = jest.fn(() => ({
      collection: collectionMock,
    }));

    const FieldValue = {
      serverTimestamp: jest.fn(() => new Date()),
    };

    admin.firestore = firestoreMock;
    admin.firestore.FieldValue = FieldValue;
  });

  it('happy case: logSession adds a new session and returns doc id', async () => {
    const userId = 'user123';
    const studyDuration = 120;
    const breakDuration = 30;
    const pickupCount = 2;

    const result = await logSession(userId, studyDuration, breakDuration, pickupCount);

    expect(admin.firestore).toHaveBeenCalled();
    expect(collectionMock).toHaveBeenCalledWith('sessions');
    expect(addMock).toHaveBeenCalledWith({
      userId,
      studyDuration,
      breakDuration,
      pickupCount,
      startedAt: expect.anything(),  // Accept any value here (timestamp)
    });
    expect(result).toBe('mock-session-id');
  });

  it('edge case: logSession uses default pickupCount if not provided', async () => {
    const userId = 'user456';
    const studyDuration = 100;
    const breakDuration = 20;

    const result = await logSession(userId, studyDuration, breakDuration);

    expect(addMock).toHaveBeenCalledWith({
      userId,
      studyDuration,
      breakDuration,
      pickupCount: 0,
      startedAt: expect.anything(),
    });
    expect(result).toBe('mock-session-id');
  });
});