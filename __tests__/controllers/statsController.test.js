// __tests__/controllers/statsController.test.js
const admin = require('firebase-admin');
jest.mock('firebase-admin');

const statsController = require('../../server/controllers/statsController');

describe('statsController.getStats', () => {
  let req, res;
  let verifyIdTokenMock;
  let collectionMock, whereMock, getMock;

  beforeEach(() => {
    jest.clearAllMocks();

    // mock Firestore chain
    getMock = jest.fn();
    whereMock = jest.fn(() => ({ get: getMock }));
    collectionMock = jest.fn(() => ({ where: whereMock }));

    admin.firestore.mockReturnValue({ collection: collectionMock });

    // mock admin.auth as a function returning an object with verifyIdToken mocked
    verifyIdTokenMock = jest.fn();
    admin.auth = jest.fn(() => ({
      verifyIdToken: verifyIdTokenMock,
    }));

    req = {
      headers: {
        authorization: 'Bearer test-token',
      },
    };

    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };
  });

  it('happy path: returns aggregated stats correctly', async () => {
    verifyIdTokenMock.mockResolvedValue({ uid: 'user123' });
    getMock.mockResolvedValue({
      docs: [
        { data: () => ({ studyDuration: 60, pickupCount: 1 }) },
        { data: () => ({ studyDuration: 30, pickupCount: 2 }) },
        { data: () => ({ studyDuration: 90, pickupCount: 0 }) },
      ],
    });

    await statsController.getStats(req, res);

    expect(admin.auth).toHaveBeenCalled();
    expect(verifyIdTokenMock).toHaveBeenCalledWith('test-token');
    expect(admin.firestore).toHaveBeenCalled();
    expect(collectionMock).toHaveBeenCalledWith('sessions');
    expect(whereMock).toHaveBeenCalledWith('userId', '==', 'user123');
    expect(getMock).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      totalFocus: 180,
      penalties: 3,
      currentLevel: 3,
      nextLevel: 4,
      minutesToNext: 180,
      minutesForNext: 360,
    });
  });

  it('error case: returns 401 and error message if token verification fails', async () => {
    verifyIdTokenMock.mockRejectedValue(new Error('Invalid token'));

    await statsController.getStats(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('edge case: handles missing or malformed authorization header', async () => {
    req.headers.authorization = null; // or malformed string

    await statsController.getStats(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized',
    });
  });
});
