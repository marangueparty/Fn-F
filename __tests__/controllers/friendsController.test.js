// __tests__/controllers/friendsController.test.js

const friendsController = require('../../server/controllers/friendsController');
const friendsService = require('../../server/services/friendsService');

jest.mock('../../server/services/friendsService');

describe('friendsController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 'user-123' },
      body: {}
    };

    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };

    next = jest.fn();
  });

  //postFriend endpoint

  describe('postFriend', () => {
    test('happy path: returns friendUid on success', async () => {
      req.body.email = 'friend@example.com';
      friendsService.addFriend.mockResolvedValue('friend-uid-456');

      await friendsController.postFriend(req, res, next);

      expect(friendsService.addFriend).toHaveBeenCalledWith('user-123', 'friend@example.com');
      expect(res.json).toHaveBeenCalledWith({ success: true, friendUid: 'friend-uid-456' });
      expect(next).not.toHaveBeenCalled();
    });

    test('edge case: missing email returns 400', async () => {
      // req.body.email is undefined
      await friendsController.postFriend(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Missing friend email' });
      expect(next).not.toHaveBeenCalled();
    });

    test('error case: addFriend throws error calls next', async () => {
      req.body.email = 'friend@example.com';
      const error = new Error('Something went wrong');
      friendsService.addFriend.mockRejectedValue(error);

      await friendsController.postFriend(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  //getFriends endpoint

  describe('getFriends', () => {
    test('happy path: returns friends list', async () => {
      const mockFriends = [{ id: 'f1', name: 'Alice' }, { id: 'f2', name: 'Bob' }];
      friendsService.listFriends.mockResolvedValue(mockFriends);

      await friendsController.getFriends(req, res, next);

      expect(friendsService.listFriends).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({ success: true, friends: mockFriends });
      expect(next).not.toHaveBeenCalled();
    });

    test('error case: listFriends throws error calls next', async () => {
      const error = new Error('DB error');
      friendsService.listFriends.mockRejectedValue(error);

      await friendsController.getFriends(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
