const setMock = jest.fn();
const getMock = jest.fn();

const docMock = jest.fn(() => ({
  set: setMock,
  get: getMock,
  collection: jest.fn(() => collectionMock()),
}));

const collectionMock = jest.fn(() => ({
  doc: docMock,
  get: getMock,
}));


const firestoreMock = jest.fn(() => ({
  collection: collectionMock,
}));

const FieldValue = {
  increment: jest.fn((val) => val),
  serverTimestamp: jest.fn(() => new Date()),
};

firestoreMock.FieldValue = FieldValue;

module.exports = {
  firestore: firestoreMock,
};

