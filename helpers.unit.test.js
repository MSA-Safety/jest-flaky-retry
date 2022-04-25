'use strict';

const { isKnownToBeFlaky, mergeResults } = require('./helpers');

describe('helpers', () => {
  describe('isKnownToBeFlaky', () => {
    it('should return false for empty known flaky list', () => {
      const knownFlakyTestCases = [];
      const testFilePath = 'super/flaky.test.js';
      const testCaseResult = {};

      const result = isKnownToBeFlaky(
        knownFlakyTestCases,
        testFilePath,
        testCaseResult,
      );

      expect(result).toStrictEqual(false);
    });

    it('should return false if no test suite match found', () => {
      const knownFlakyTestCases = [
        {
          testFilePath: 'super/flaky.test.js',
          fullName: 'super.flaky should do everything right',
        },
      ];
      const testFilePath = 'some/other.test.js';
      const testCaseResult = {};

      const result = isKnownToBeFlaky(
        knownFlakyTestCases,
        testFilePath,
        testCaseResult,
      );

      expect(result).toStrictEqual(false);
    });

    it('should return false if no full name match found', () => {
      const knownFlakyTestCases = [
        {
          testFilePath: 'super/flaky.test.js',
          fullName: 'super.flaky should do everything right',
        },
      ];
      const { testFilePath } = knownFlakyTestCases[0];
      const testCaseResult = {
        fullName: 'something.else should also do something',
      };

      const result = isKnownToBeFlaky(
        knownFlakyTestCases,
        testFilePath,
        testCaseResult,
      );

      expect(result).toStrictEqual(false);
    });

    it('should return false if no failure message match found', () => {
      const knownFlakyTestCases = [
        {
          testFilePath: 'super/flaky.test.js',
          fullName: 'super.flaky should do everything right',
          failureMessages: ['Some weird error we should probably look at'],
        },
      ];
      const { testFilePath } = knownFlakyTestCases[0];
      const testCaseResult = {
        fullName: knownFlakyTestCases[0].fullName,
        failureMessages: ['Some other thing went haywire'],
      };

      const result = isKnownToBeFlaky(
        knownFlakyTestCases,
        testFilePath,
        testCaseResult,
      );

      expect(result).toStrictEqual(false);
    });

    it('should return true if no full name configured', () => {
      const knownFlakyTestCases = [
        {
          testFilePath: 'super/flaky.test.js',
        },
      ];
      const { testFilePath } = knownFlakyTestCases[0];
      const testCaseResult = {
        fullName: knownFlakyTestCases[0].fullName,
        failureMessages: ['This shall be caught'],
      };

      const result = isKnownToBeFlaky(
        knownFlakyTestCases,
        testFilePath,
        testCaseResult,
      );

      expect(result).toStrictEqual(true);
    });

    it('should return true if no failure message configured', () => {
      const knownFlakyTestCases = [
        {
          testFilePath: 'super/flaky.test.js',
          fullName: 'super.flaky should do everything right',
        },
      ];
      const { testFilePath } = knownFlakyTestCases[0];
      const testCaseResult = {
        fullName: knownFlakyTestCases[0].fullName,
        failureMessages: ['This shall be caught'],
      };

      const result = isKnownToBeFlaky(
        knownFlakyTestCases,
        testFilePath,
        testCaseResult,
      );

      expect(result).toStrictEqual(true);
    });

    it('should return true if failure message present', () => {
      const knownFlakyTestCases = [
        {
          testFilePath: 'super/flaky.test.js',
          fullName: 'super.flaky should do everything right',
          failureMessages: ['This shall be caught'],
        },
      ];
      const { testFilePath } = knownFlakyTestCases[0];
      const testCaseResult = {
        fullName: knownFlakyTestCases[0].fullName,
        failureMessages: ['This shall be caught'],
      };

      const result = isKnownToBeFlaky(
        knownFlakyTestCases,
        testFilePath,
        testCaseResult,
      );

      expect(result).toStrictEqual(true);
    });
  });

  describe('mergeResults', () => {
    it('should merge if successful on retry', () => {
      const results = {
        numPassedTests: 1,
        numFailedTests: 1,
        numPassedTestSuites: 1,
        numFailedTestSuites: 1,
        testResults: [
          {
            testFilePath: 'never/failing.test.js',
            numPassingTests: 0,
            numFailingTests: 0,
          },
          {
            testFilePath: 'super/flaky.test.js',
            numPassingTests: 1,
            numFailingTests: 1,
            testResults: [
              {
                fullName: 'some.thing should pass',
                status: 'passed',
              },
              {
                fullName: 'some.thing should be flaky',
                status: 'failed',
              },
            ],
          },
        ],
      };
      const newResults = {
        numPassedTests: 1,
        numFailedTests: 0,
        numPassedTestSuites: 1,
        numFailedTestSuites: 0,
        testResults: [
          {
            testFilePath: results.testResults[1].testFilePath,
            numPassingTests: 1,
            numFailingTests: 0,
            testResults: [
              {
                fullName: results.testResults[1].testResults[0].fullName,
                status: 'skipped', // skipped due to earlier pass
              },
              {
                fullName: results.testResults[1].testResults[1].fullName,
                status: 'passed', // now all good
              },
            ],
          },
        ],
      };
      const mergedResults = {
        numPassedTests: 2,
        numFailedTests: 0,
        numPassedTestSuites: 2,
        numFailedTestSuites: 0,
        testResults: [
          {
            testFilePath: results.testResults[0].testFilePath,
            numPassingTests: 0,
            numFailingTests: 0,
          },
          {
            testFilePath: results.testResults[1].testFilePath,
            numPassingTests: 2,
            numFailingTests: 0,
            testResults: [
              {
                fullName: results.testResults[1].testResults[0].fullName,
                status: 'passed',
              },
              {
                fullName: results.testResults[1].testResults[1].fullName,
                status: 'passed',
              },
            ],
          },
        ],
      };
      const retryFullNames = [results.testResults[1].testResults[1].fullName];

      const result = mergeResults(results, newResults, retryFullNames);

      expect(result).toStrictEqual(mergedResults);
    });

    it('should merge if failed on retry', () => {
      const results = {
        numPassedTests: 1,
        numFailedTests: 1,
        numPassedTestSuites: 1,
        numFailedTestSuites: 1,
        testResults: [
          {
            testFilePath: 'never/failing.test.js',
            numPassingTests: 0,
            numFailingTests: 0,
          },
          {
            testFilePath: 'super/flaky.test.js',
            numPassingTests: 1,
            numFailingTests: 1,
            testResults: [
              {
                fullName: 'some.thing should pass',
                status: 'passed',
              },
              {
                fullName: 'some.thing should be flaky',
                status: 'failed',
              },
            ],
          },
        ],
      };
      const newResults = {
        numPassedTests: 0,
        numFailedTests: 1,
        numPassedTestSuites: 0,
        numFailedTestSuites: 1,
        testResults: [
          {
            testFilePath: results.testResults[1].testFilePath,
            numPassingTests: 0,
            numFailingTests: 1,
            testResults: [
              {
                fullName: results.testResults[1].testResults[0].fullName,
                status: 'skipped', // skipped due to earlier pass
              },
              {
                fullName: results.testResults[1].testResults[1].fullName,
                status: 'failed', // still failed
              },
            ],
          },
        ],
      };
      const mergedResults = {
        numPassedTests: 1,
        numFailedTests: 1,
        numPassedTestSuites: 1,
        numFailedTestSuites: 1,
        testResults: [
          {
            testFilePath: results.testResults[0].testFilePath,
            numPassingTests: 0,
            numFailingTests: 0,
          },
          {
            testFilePath: results.testResults[1].testFilePath,
            numPassingTests: 1,
            numFailingTests: 1,
            testResults: [
              {
                fullName: results.testResults[1].testResults[0].fullName,
                status: 'passed',
              },
              {
                fullName: results.testResults[1].testResults[1].fullName,
                status: 'failed',
              },
            ],
          },
        ],
      };
      const retryFullNames = [results.testResults[1].testResults[1].fullName];

      const result = mergeResults(results, newResults, retryFullNames);

      expect(result).toStrictEqual(mergedResults);
    });
  });
});
