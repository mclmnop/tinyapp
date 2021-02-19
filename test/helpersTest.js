const { assert } = require('chai');

const { findUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('findUser', function() {
  it('should return all the user info when provided with an email', function() {
    const user = findUser('user@example.com', testUsers);
    const expectedOutput = testUsers['userRandomID'];
    assert.deepEqual(user, expectedOutput);
  }),
  it('should return undefined when a user does not exist', function() {
    const user = findUser('poil@example.com', testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
});