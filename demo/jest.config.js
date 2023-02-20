'use strict';

module.exports = {
  // Use this configuration option to add reporters to Jest
  reporters: [
    'default',
    [
      '<rootDir>/..', // refers to jest-flaky-retry
      {
        configFile: 'jest.flakyRetry.json',
        junitOutputDirectory: 'build/results/unit',
      },
    ],
  ],
  // The glob patterns Jest uses to detect test files
  testMatch: ['**/?(*.)+(unit.test).js?(x)'],
};
