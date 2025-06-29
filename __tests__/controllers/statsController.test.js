const admin = require('firebase-admin');

jest.mock('firebase-admin', () => {
  const mGet = jest.fn();
  const mWhere = jest.fn(() => ({ get: mGet }));
  const mCollection = jest.fn(() => ({ where: mWhere }));

  const firestore = jest.fn(() => ({
    collection: mCollection,
  }));

  const verifyIdToken = jest.fn();

  const auth = jest.fn(() => ({
    verifyIdToken,
  }));

  return {
    firestore,
    auth,
    __esModule: true,  // if using ES modules
  };
});

const statsController = require('../../server/controllers/statsController');

describe('statsController.getStats', () => {
  let req, res, firestore, auth;

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer fake-token',  
      },
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    firestore = admin.firestore();
    auth = admin.auth();

    
    auth.verifyIdToken.mockResolvedValue({ uid: 'user123' });

    // mocking firestone docs 
    const docs = [
      { data: () => ({ studyDuration: 60, pickupCount: 2 }) },
      { data: () => ({ studyDuration: 30, pickupCount: 1 }) },
    ];

    firestore.collection().where().get.mockResolvedValue({ docs });
  });

  it('returns aggregated stats successfully', async () => {
    await statsController.getStats(req, res);

    // verify auth.verifyIdToken called with 'fake-token' (extracted token from header)
    expect(auth.verifyIdToken).toHaveBeenCalledWith('fake-token');

    expect(firestore.collection).toHaveBeenCalledWith('sessions');
    expect(firestore.collection().where).toHaveBeenCalledWith('userId', '==', 'user123');
    expect(firestore.collection().where().get).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      totalFocus: 90,
      currentLevel: 2,
      nextLevel: 3,
      minutesForNext: 180,
      minutesToNext: 90,
      penalties: 3,
    });
  });

  it('returns 401 Unauthorized on error', async () => {
    auth.verifyIdToken.mockRejectedValueOnce(new Error('fail'));

    await statsController.getStats(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' });
  });
});