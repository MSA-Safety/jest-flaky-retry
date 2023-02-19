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


/**
 * This demo function is to show retries behavior. It creates a first file and
 * throws a first error, creates a second file and throws a second error.
 * Succeeds if both files exist and deletes them.
 *
 * Ergo: first call fails - second call fails - third call succeeds.
 *
 * @throws {Error} If one of the files did not exist.
 */
function demoWithRetries() {
  const firstFile = './demo-first-unit-text.txt';
  const secondFile = './demo-second-unit-text.txt';

  if (!fs.existsSync(firstFile)) {
    // File does not exist yet, create file and throw error
    fs.writeFileSync(firstFile, '0');
    throw new Error('Random Flaky Error');
  }

  if (!fs.existsSync(secondFile)) {
    // File does not exist yet, create file and throw error
    fs.writeFileSync(secondFile, '0');
    throw new Error('Random Flaky Error');
  }

  // Files exist, delete them.
  fs.rmSync(firstFile);
  fs.rmSync(secondFile);

}

module.exports = { demo, demoWithRetries };
