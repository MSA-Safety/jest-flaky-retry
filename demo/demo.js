'use strict';

const fs = require('fs');

/**
 * Main function. Writes file if it does not exist yet and throws.
 * Succeeds and deletes file if file exists.
 *
 * Ergo: first call fails - second call succeeds.
 *
 * Please note: this is not intended to represent a good example where
 * this package might be helpful. More appropriate usages are network
 * flakiness in integration/e2e tests.
 *
 * @throws {Error} If file did not exist.
 */
function demo() {
  const path = './demo-unit-text.txt';

  if (!fs.existsSync(path)) {
    // File does not exist yet, create file and throw error
    fs.writeFileSync(path, '0');
    throw new Error('Random Flaky Error');
  }

  // File exists, delete it and be happy
  fs.rmSync(path);
}

module.exports = { demo };
