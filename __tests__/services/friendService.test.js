// __tests__/services/friendService.test.js
const admin = require('firebase-admin');
jest.mock('firebase-admin');

const { addFriend, listFriends } = require('../../server/services/friendsService');

describe('friendsService', () => {
  let collectionMock;
  let docMock;
  let setMock;
  let getMock;
  let getUserByEmailMock;

  beforeEach(() => {
    jest.clearAllMocks();

    setMock = jest.fn().mockResolvedValue();
    getMock = jest.fn();
    getUserByEmailMock = jest.fn();

    // Mock admin.auth().getUserByEmail()
    admin.auth = jest.fn(() => ({
      getUserByEmail: getUserByEmailMock,
    }));

    // Mock Firestore document ref
    docMock = jest.fn(() => ({
      set: setMock,
      get: getMock,
    }));

    // Mock Firestore collection ref
    collectionMock = jest.fn(() => ({
      doc: docMock,
    }));

    // Mock firestore() to return collection mock
    admin.firestore = jest.fn(() => ({
      collection: collectionMock,
    }));

    // Mock FieldValue helpers
    admin.firestore.FieldValue = {
      arrayUnion: jest.fn((val) => val),
    };
  });

  describe('addFriend', () => {
    it('happy path: looks up friend UID by email and updates friends array', async () => {
      getUserByEmailMock.mockResolvedValue({ uid: 'friend-uid-123' });
      setMock.mockResolvedValue();

      const result = await addFriend('user123', 'friend@example.com');

      expect(admin.auth).toHaveBeenCalled();
      expect(getUserByEmailMock).toHaveBeenCalledWith('friend@example.com');

      expect(admin.firestore).toHaveBeenCalled();
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith('user123');

      expect(setMock).toHaveBeenCalledWith(
        { friends: 'friend-uid-123' }, // because arrayUnion mocked to return the arg
        { merge: true }
      );

      expect(result).toBe('friend-uid-123');
    });
  });

  describe('listFriends', () => {
    it('happy path: returns friends array when present', async () => {
      getMock.mockResolvedValue({
        data: () => ({ friends: ['friend1', 'friend2'] }),
      });

      const friends = await listFriends('user123');

      expect(admin.firestore).toHaveBeenCalled();
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith('user123');
      expect(getMock).toHaveBeenCalled();

      expect(friends).toEqual(['friend1', 'friend2']);
    });

    it('edge case: returns empty array if friends data missing or invalid', async () => {
      getMock.mockResolvedValue({
        data: () => ({}),
      });

      const friends = await listFriends('user123');

      expect(friends).toEqual([]);

      getMock.mockResolvedValue({
        data: () => ({ friends: null }),
      });

      const friends2 = await listFriends('user123');

      expect(friends2).toEqual([]);
    });
  });
});