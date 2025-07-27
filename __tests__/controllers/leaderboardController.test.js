// __tests__/controllers/leaderboardController.test.js

const leaderboardController = require('../../server/controllers/leaderboardController');
const friendsService = require('../../server/services/friendsService');
const statsService = require('../../server/services/statsService');
const admin = require('firebase-admin');

jest.mock('../../server/services/friendsService');
jest.mock('../../server/services/statsService');
jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
  firestore: jest.fn(),
}));

describe('leaderboardController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { uid: 'user-uid' },
    };

    res = {
      json: jest.fn(),
    };

    next = jest.fn();

    // Mock Firestore
    const getMock = jest.fn();

    admin.firestore.mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn(() => ({ get: getMock })),
    });

    admin.auth.mockReturnValue({
      getUser: jest.fn(),
    });

    // Save references for easier mocking below
    this.getMock = getMock;
    this.getUserMock = admin.auth().getUser;
  });

  test('happy path: returns sorted leaderboard', async () => {
    friendsService.listFriends.mockResolvedValue(['friend1', 'friend2']);
    statsService.calculateStats.mockImplementation(async (uid) => {
      if (uid === 'user-uid') return { currentLevel: 5, netFocus: 120 };
      if (uid === 'friend1') return { currentLevel: 3, netFocus: 90 };
      if (uid === 'friend2') return { currentLevel: 4, netFocus: 110 };
      return { currentLevel: 1, netFocus: 0 };
    });

    // Mock Firestore get for username
    this.getMock
      .mockResolvedValueOnce({ exists: true, data: () => ({ username: 'Me' }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ username: 'FriendOne' }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ username: 'FriendTwo' }) });

    // mock Firebase Auth getUser for email
    this.getUserMock
      .mockResolvedValueOnce({ email: 'me@example.com' })
      .mockResolvedValueOnce({ email: 'friend1@example.com' })
      .mockResolvedValueOnce({ email: 'friend2@example.com' });

    await leaderboardController.getLeaderboard(req, res, next);

    expect(friendsService.listFriends).toHaveBeenCalledWith('user-uid');
    expect(statsService.calculateStats).toHaveBeenCalledTimes(3);
    expect(admin.firestore).toHaveBeenCalled();
    expect(admin.auth).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      leaderboard: [
        {
          uid: 'user-uid',
          username: 'Me',
          email: 'me@example.com',
          currentLevel: 5,
          minutes: 120,
        },
        {
          uid: 'friend2',
          username: 'FriendTwo',
          email: 'friend2@example.com',
          currentLevel: 4,
          minutes: 110,
        },
        {
          uid: 'friend1',
          username: 'FriendOne',
          email: 'friend1@example.com',
          currentLevel: 3,
          minutes: 90,
        },
      ],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('error case: handles username fetch error gracefully and continues', async () => {
    friendsService.listFriends.mockResolvedValue(['friend1']);
    statsService.calculateStats.mockResolvedValue({ currentLevel: 1, netFocus: 50 });

    // Firestore doc get: first user ok, second user throws error
    this.getMock
      .mockResolvedValueOnce({ exists: true, data: () => ({ username: 'Me' }) })
      .mockRejectedValueOnce(new Error('Firestore read error'));

    // Auth getUser returns email
    this.getUserMock
      .mockResolvedValueOnce({ email: 'me@example.com' })
      .mockResolvedValueOnce({ email: 'friend1@example.com' });

    await leaderboardController.getLeaderboard(req, res, next);

    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next on overall error', async () => {
    friendsService.listFriends.mockRejectedValue(new Error('DB failure'));

    await leaderboardController.getLeaderboard(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
  });
});
