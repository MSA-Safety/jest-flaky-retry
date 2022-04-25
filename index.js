'use strict';

// eslint-disable-next-line jest/no-jest-import
const myJest = require('jest');
const jestJunit = require('jest-junit');
const { readFileSync, renameSync, existsSync, mkdirSync } = require('fs');
const { isKnownToBeFlaky, mergeResults } = require('./helpers');

/**
 * Custom jest reporter to rerun known flaky tests and execute junit on final result.
 */
class JestFlakyRetryReporter {
  /**
   * Constructor of this jest test reporter.
   *
   * @param {object} globalConfig - The global config of jest.
   * @param {object} options - The options given to this reporter.
   */
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.retryTestCases = [];
    this.retryTestSuites = [];
    this.shouldFail = false;
  }

  /**
   * Called by jest before test execution.
   */
  onRunStart() {
    const configFileName = this.options.configFile;
    // eslint-disable-next-line no-console
    console.log('Loading list of known flaky tests from', configFileName);
    this.knownFlakyTestCases = JSON.parse(readFileSync(configFileName));
    // eslint-disable-next-line no-console
    console.log(this.knownFlakyTestCases);
  }

  /**
   * Called by jest after test suite execution.
   *
   * @param {object} test - Jest test context.
   * @param {object} testSuiteResult - The result of the suite execution.
   */
  onTestResult(test, testSuiteResult) {
    const relativeTestFilePath = testSuiteResult.testFilePath.slice(
      process.cwd().length + 1,
    );
    const retryTestCases = testSuiteResult.testResults.filter(
      (testCaseResult) =>
        testCaseResult.status === 'failed' &&
        isKnownToBeFlaky(
          this.knownFlakyTestCases,
          relativeTestFilePath,
          testCaseResult,
        ),
    );

    if (retryTestCases.length) {
      this.retryTestSuites.push(testSuiteResult.testFilePath);
      this.retryTestCases.push(...retryTestCases);
    }
  }

  /**
   * Called by jest after test execution.
   *
   * @param {object} contexts - Jest context.
   * @param {object} results - The results of the test execution.
   */
  async onRunComplete(contexts, results) {
    let finalResults = results;

    if (this.retryTestCases.length) {
      const retryFullNames = this.retryTestCases.map((test) => test.fullName);
      // eslint-disable-next-line no-console
      console.log('Retrying test cases: ', retryFullNames);

      const jestConfig = {
        testMatch: this.retryTestSuites,
        testNamePattern: retryFullNames.join('|'),
        rootDir: this.globalConfig.rootDir,
      };
      const { results: newResults } = await myJest.runCLI(
        {
          config: JSON.stringify(jestConfig),
        },
        [process.cwd()],
      );

      finalResults = mergeResults(results, newResults);
    }

    finalResults.success = finalResults.numFailedTestSuites === 0;

    this.shouldFail = !finalResults.success;

    // Note: Direct processor call of jest-junit is deprecated,
    // since testResultsProcessor support in jest is deprecated
    jestJunit(finalResults);

    const outputDir = this.options.junitOutputDirectory;
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    renameSync('junit.xml', `${outputDir}/junit.xml`);
  }

  /**
   * Called by jest after test execution. Check if test execution shall be
   * considered as successful. If unsuccessful, this forces jest to return
   * with an error code.
   *
   * @returns {boolean} Whether jest should consider the test execution as succeeded.
   */
  getLastError() {
    if (this.shouldFail) {
      return new Error('JestFlakyRetryReporter reported an error');
    }
    return undefined;
  }
}

module.exports = JestFlakyRetryReporter;
