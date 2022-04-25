'use strict';

/**
 * Check if name of test file is exactly matching.
 *
 * @param {object} knownFlakyTestCase - The known flaky test case.
 * @param {string} relativeTestFilePath - The relative path of the test file.
 * @returns {boolean} Whether the test file path is matching.
 */
function isMatchingTestFilePath(knownFlakyTestCase, relativeTestFilePath) {
  return relativeTestFilePath === knownFlakyTestCase.testFilePath;
}

/**
 * Check if either all test cases are configured as flaky, or
 * if full name of test case is matching.
 *
 * @param {object} knownFlakyTestCase - The known flaky test case.
 * @param {object} testCaseResult - The result of the executed test case.
 * @returns {boolean} Whether the full name is matching.
 */
function isMatchingFullName(knownFlakyTestCase, testCaseResult) {
  return (
    !knownFlakyTestCase.fullName ||
    knownFlakyTestCase.fullName === testCaseResult.fullName
  );
}

/**
 * Check if either no specific failure message is configured
 * (then all errors will be considered as flaky), or
 * if there is at least one pre-configured failure message that
 * matches as prefix with at least one of the experienced test
 * failure messages. If not, the test is not considered to be flaky.
 *
 * @param {object} knownFlakyTestCase - The known flaky test case.
 * @param {object} testCaseResult - The result of the executed test case.
 * @returns {boolean} Whether the experienced failure message should be
 * considered as flaky.
 */
function isMatchingFailureMessages(knownFlakyTestCase, testCaseResult) {
  return (
    !knownFlakyTestCase.failureMessages ||
    knownFlakyTestCase.failureMessages.some((knownFailureMsg) =>
      testCaseResult.failureMessages.some((testCaseResultFailureMsg) =>
        testCaseResultFailureMsg.startsWith(knownFailureMsg),
      ),
    )
  );
}

/**
 * Check if test case is known to be flaky.
 *
 * @param {object[]} knownFlakyTestCases - The known flaky test cases.
 * @param {string} relativeTestFilePath - The relative path of the test file.
 * @param {object} testCaseResult - The result of the executed test case.
 * @returns {boolean} Whether test is known to be flaky.
 */
function isKnownToBeFlaky(
  knownFlakyTestCases,
  relativeTestFilePath,
  testCaseResult,
) {
  return knownFlakyTestCases.some(
    (knownFlakyTestCase) =>
      isMatchingTestFilePath(knownFlakyTestCase, relativeTestFilePath) &&
      isMatchingFullName(knownFlakyTestCase, testCaseResult) &&
      isMatchingFailureMessages(knownFlakyTestCase, testCaseResult),
  );
}

/**
 * Merge results of rerun into existing results.
 *
 * @param {object} results - The existing results.
 * @param {object[]} results.testResults - The list of test suites.
 * @param {object} newResults - The new results of specific reruns.
 * @param {object[]} newResults.testResults - The list of test suites.
 * @returns {object} The merged results.
 */
function mergeResults(results, newResults) {
  // Create return object we can merge into
  const mergedResults = JSON.parse(JSON.stringify(results));

  // Iterate the test suites and incorporate the new test suite results
  mergedResults.testResults = mergedResults.testResults.map(
    (testSuiteResult) => {
      // Create return object we can merge into
      const mergedTestSuiteResult = JSON.parse(JSON.stringify(testSuiteResult));

      // Check if there is a new test suite result for this test suite
      const newTestSuiteResult = newResults.testResults.find(
        (entry) => entry.testFilePath === mergedTestSuiteResult.testFilePath,
      );

      // Merge new test case results
      if (newTestSuiteResult) {
        mergedTestSuiteResult.testResults =
          mergedTestSuiteResult.testResults.map((testCaseResult) => {
            // Check if there is a new test case result for this test case
            const newTestCaseResult = newTestSuiteResult.testResults.find(
              (entry) =>
                entry.fullName === testCaseResult.fullName &&
                entry.status === 'passed',
            );

            // Overwrite test case results if rerun performed & successful
            return newTestCaseResult || testCaseResult;
          });

        mergedTestSuiteResult.numPassingTests +=
          newTestSuiteResult.numPassingTests;
        mergedTestSuiteResult.numFailingTests -=
          newTestSuiteResult.numPassingTests;
      }

      return mergedTestSuiteResult;
    },
  );

  mergedResults.numPassedTests += newResults.numPassedTests;
  mergedResults.numFailedTests -= newResults.numPassedTests;
  mergedResults.numPassedTestSuites += newResults.numPassedTestSuites;
  mergedResults.numFailedTestSuites -= newResults.numPassedTestSuites;

  return mergedResults;
}

module.exports = { isKnownToBeFlaky, mergeResults };
