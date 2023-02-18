'use strict';

const { demo } = require('./demo');

describe('demo', () => {
  it('should fail on first test run and succeed on subsequent run', () => {
    let caughtError;
    try {
      demo();
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBeUndefined();
  });
});
