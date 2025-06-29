const FieldValue = {
  increment: jest.fn((val) => val),
  serverTimestamp: jest.fn(() => new Date()),
};

const set = jest.fn(() => Promise.resolve());
const get = jest.fn(() =>
  Promise.resolve({
    docs: [
      { id: 'achv1', data: () => ({ name: 'Badge One', description: 'desc1' }) },
      { id: 'achv2', data: () => ({ name: 'Badge Two', description: 'desc2' }) },
    ],
  })
);

const doc = jest.fn(() => ({
  set,
  get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
  collection: jest.fn(() => ({
    doc,
    get: jest.fn(() => Promise.resolve({
      docs: [
        { id: 'achv1', data: () => ({ name: 'Badge One', description: 'desc1' }) },
        { id: 'achv2', data: () => ({ name: 'Badge Two', description: 'desc2' }) },
      ],
    })),
  })),
}));

const collection = jest.fn(() => ({
  doc,
  get: jest.fn(() => Promise.resolve({
    docs: [
      { id: 'achv1', data: () => ({ name: 'Badge One', description: 'desc1' }) },
      { id: 'achv2', data: () => ({ name: 'Badge Two', description: 'desc2' }) },
    ],
  })),
}));

const firestore = jest.fn(() => ({
  collection,
  doc,
}));

const initializeApp = jest.fn();

module.exports = {
  initializeApp,
  firestore,
  FieldValue: {
    serverTimestamp: jest.fn(() => 'mocked-timestamp'),
  },
};
