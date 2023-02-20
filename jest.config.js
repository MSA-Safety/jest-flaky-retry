'use strict';

// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Run tests from one or more projects
  projects: [
    {
      // Allows for a label to be printed alongside a test while it is running
      displayName: 'test',
      // The pattern or patterns Jest uses to detect test files
      testRegex: ['.*unit\\.test\\.js$'],
      // An array of regexp pattern strings that are matched against all test paths,
      // matched tests are skipped
      testPathIgnorePatterns: [
        '/node_modules/',
        '/demo/',
      ],
    },
    {
      // Allows for a label to be printed alongside a test while it is running
      displayName: 'lint',
      // This option allows you to use a custom runner instead of Jest's default test runner
      runner: 'jest-runner-eslint',
      // The pattern or patterns Jest uses to detect test files
      testRegex: ['.*\\.js$'],
      // An array of regexp pattern strings that are matched against all test paths,
      // matched tests are skipped
      testPathIgnorePatterns: [
        '/node_modules/',
        '/build/',
      ],
    },
  ],
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'build/coverage/unit',
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ['node_modules'],
  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Use this configuration option to add custom reporters to Jest
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'build/results/unit' }],
  ],
};
