// __tests__/repositories/sessionsRepository.test.js
const admin = require('firebase-admin');
const { getUserStats } = require('../../server/repositories/sessionsRepository');

describe('sessionsRepository', () => {
  it('getUserStats aggregates totalFocus and counts sessions', async () => {
    const result = await getUserStats('user123');

    expect(admin.firestore().collection).toHaveBeenCalledWith('sessions');
    expect(admin.firestore().collection().where).toHaveBeenCalledWith('userId', '==', 'user123');
    expect(admin.firestore().collection().where().get).toHaveBeenCalled();

    expect(result.totalFocus).toBe(75); // 30 + 45
    expect(result.sessionsCount).toBe(2);
  });

  it('handles empty sessions', async () => {
    // Override .where to return an empty forEach for this test
    admin.firestore().collection().where.mockImplementationOnce(() => ({
      get: jest.fn(() => ({
        forEach: (cb) => {
          // no docs, so no callback calls
        }
      }))
    }));

    const result = await getUserStats('user123');

    expect(result.totalFocus).toBe(0);
    expect(result.sessionsCount).toBe(0);
  });
});
