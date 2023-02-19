'use strict';

const { demoWithRetries } = require('./demo');


describe('demoWithRetries', () => {
  it('should fail on first and second test run and succeed on subsequent run', () => {
    let caughtError;
    try {
      demoWithRetries();
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBeUndefined();
  });
});
