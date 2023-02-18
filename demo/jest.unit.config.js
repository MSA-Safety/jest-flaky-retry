/**
 * NodeJS unit test Jest config.
 */

'use strict';

module.exports = {
  coverageDirectory: 'build/coverage/unit',
  coveragePathIgnorePatterns: ['node_modules'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  moduleNameMapper: {},
  reporters: [
    'default',
    [
      '<rootDir>/..',
      {
        configFile: 'jest.unit.flakyRetry.json',
        junitOutputDirectory: 'build/results/unit',
      },
    ],
  ],
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(unit.test).js?(x)'],
};
