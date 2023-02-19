'use strict';

const { execSync } = require('child_process');

describe('jestFlakyRetryReporter', () => {
  const localPath = process.cwd();

  let runCLI;
  let jestJunit;
  let readFileSync;
  let renameSync;
  let existsSync;
  let mkdirSync;
  let JestFlakyRetryReporter;
  let isKnownToBeFlaky;
  let mergeResults;

  beforeEach(() => {
    jest.isolateModules(() => {
      ({ runCLI } = require('jest')); // eslint-disable-line global-require
      jestJunit = require('jest-junit'); // eslint-disable-line global-require
      ({
        readFileSync, renameSync, existsSync, mkdirSync,
      } = require('fs')); // eslint-disable-line global-require
      ({ isKnownToBeFlaky, mergeResults } = require('./helpers')); // eslint-disable-line global-require
      jest.mock('jest');
      jest.mock('jest-junit');
      jest.mock('./helpers');
      JestFlakyRetryReporter = require('./index'); // eslint-disable-line global-require
    });
    jest.isolateModules(() => {
      jest.mock('fs');
    });
  });

  describe('constructor', () => {
    it('should setup a new object', async () => {
      const globalConfig = 'globalConfig';
      const options = 'options';
      const instance = new JestFlakyRetryReporter(globalConfig, options);

      expect(instance.globalConfig).toStrictEqual(globalConfig);
      expect(instance.options).toStrictEqual(options);
      expect(instance.retryTestCases).toStrictEqual([]);
      expect(instance.retryTestSuites).toStrictEqual([]);
      expect(instance.shouldFail).toBe(false);
    });
  });

  describe('onRunStart', () => {
    it('should load configuration', () => {
      const globalConfig = 'globalConfig';
      const options = { configFile: 'configFile' };
      const knownFlakyTestCases = JSON.stringify([
        {
          testFilePath: 'testFilePath',
          fullName: 'fullName',
          failureMessages: [],
        },
      ]);
      readFileSync.mockReturnValueOnce(knownFlakyTestCases);
      const instance = new JestFlakyRetryReporter(globalConfig, options);

      instance.onRunStart();

      expect(readFileSync).toHaveBeenCalledWith(options.configFile);
      expect(instance.knownFlakyTestCases).toStrictEqual(
        JSON.parse(knownFlakyTestCases),
      );
    });
  });

  describe('onTestResult', () => {
    let instance;

    beforeEach(() => {
      const globalConfig = 'globalConfig';
      const options = { configFile: 'configFile' };
      instance = new JestFlakyRetryReporter(globalConfig, options);
      instance.knownFlakyTestCases = 'knownFlakyTestCases';
    });

    it('should do nothing if no tests ran', () => {
      const testSuiteResult = {
        testFilePath: `${localPath}/some/path/to/some.test.js`,
        testResults: [],
      };

      instance.onTestResult(undefined, testSuiteResult);

      expect(instance.retryTestSuites).toStrictEqual([]);
      expect(instance.retryTestCases).toStrictEqual([]);
    });

    it('should not select test to rerun if succeeded', () => {
      const testSuiteResult = {
        testFilePath: `${localPath}/some/path/to/some.test.js`,
        testResults: [{ status: 'passed' }],
      };

      instance.onTestResult(undefined, testSuiteResult);

      expect(instance.retryTestSuites).toStrictEqual([]);
      expect(instance.retryTestCases).toStrictEqual([]);
    });

    it('should not select test to rerun if failed but not known to be flaky', () => {
      const relativePath = 'some/path/to/some.test.js';
      const testSuiteResult = {
        testFilePath: `${localPath}/${relativePath}`,
        testResults: [{ status: 'failed' }],
      };
      isKnownToBeFlaky.mockReturnValueOnce(false);

      instance.onTestResult(undefined, testSuiteResult);

      expect(isKnownToBeFlaky).toHaveBeenCalledWith(
        instance.knownFlakyTestCases,
        relativePath,
        testSuiteResult.testResults[0],
      );
      expect(instance.retryTestSuites).toStrictEqual([]);
      expect(instance.retryTestCases).toStrictEqual([]);
    });

    it('should select test to rerun if failed and known to be flaky', () => {
      const relativePath = 'some/path/to/some.test.js';
      const testSuiteResult = {
        testFilePath: `${localPath}/${relativePath}`,
        testResults: [{ status: 'failed' }],
      };
      isKnownToBeFlaky.mockReturnValueOnce(true);

      instance.onTestResult(undefined, testSuiteResult);

      expect(isKnownToBeFlaky).toHaveBeenCalledWith(
        instance.knownFlakyTestCases,
        relativePath,
        testSuiteResult.testResults[0],
      );
      expect(instance.retryTestSuites).toStrictEqual([
        testSuiteResult.testFilePath,
      ]);
      expect(instance.retryTestCases).toStrictEqual(
        testSuiteResult.testResults,
      );
    });
  });

  describe('onRunComplete', () => {
    const globalConfig = { rootDir: 'rootDir' };
    const options = {
      configFile: 'configFile',
      junitOutputDirectory: 'junitOutputDirectory',
    };
    let instance;

    beforeEach(() => {
      instance = new JestFlakyRetryReporter(globalConfig, options);
    });

    it('should create junit report and succeed if test suites succeed', async () => {
      jestJunit.mockReturnValueOnce();
      existsSync.mockReturnValueOnce(true);
      renameSync.mockReturnValueOnce();
      instance.retryTestSuites = [];
      instance.retryTestCases = [];
      const results = {
        numFailedTestSuites: 0,
      };

      await instance.onRunComplete(undefined, results);

      expect(jestJunit).toHaveBeenCalledWith(results);
      expect(existsSync).toHaveBeenCalledWith(options.junitOutputDirectory);
      expect(mkdirSync).not.toHaveBeenCalled();
      expect(renameSync).toHaveBeenCalledWith(
        'junit.xml',
        `${instance.options.junitOutputDirectory}/junit.xml`,
      );
      expect(results.success).toBe(true);
      expect(instance.shouldFail).toStrictEqual(!results.success);
    });

    it('should create junit report and fail if test suites fail', async () => {
      jestJunit.mockReturnValueOnce();
      existsSync.mockReturnValueOnce(true);
      renameSync.mockReturnValueOnce();
      instance.retryTestSuites = [];
      instance.retryTestCases = [];
      const results = {
        numFailedTestSuites: 42,
      };

      await instance.onRunComplete(undefined, results);

      expect(jestJunit).toHaveBeenCalledWith(results);
      expect(existsSync).toHaveBeenCalledWith(options.junitOutputDirectory);
      expect(mkdirSync).not.toHaveBeenCalled();
      expect(renameSync).toHaveBeenCalledWith(
        'junit.xml',
        `${instance.options.junitOutputDirectory}/junit.xml`,
      );
      expect(results.success).toBe(false);
      expect(instance.shouldFail).toStrictEqual(!results.success);
    });

    it('should rerun test cases', async () => {
      jestJunit.mockReturnValueOnce();
      existsSync.mockReturnValueOnce(true);
      renameSync.mockReturnValueOnce();
      instance.retryTestSuites = ['super/flaky.test.js'];
      instance.options = {retryTimes: 2}
      instance.retryTestCases = [
        {
          fullName: 'flaky.test should be written better',
        },
      ];
      const results = {
        numFailedTestSuites: 1,
      };
      const newResults = 'new results';
      runCLI.mockResolvedValueOnce({ results: newResults });
      mergeResults.mockReturnValueOnce(results);

      await instance.onRunComplete(undefined, results);

      expect(runCLI).toHaveBeenCalledWith(
        {
          config: JSON.stringify({
            testMatch: instance.retryTestSuites,
            testNamePattern: instance.retryTestCases[0].fullName,
            rootDir: instance.globalConfig.rootDir,
            setupFilesAfterEnv: ['<rootDir>/setup-jest.js'],
          }),
        },
        [localPath],
      );
      expect(mergeResults).toHaveBeenCalledWith(results, newResults);
    });

    it('should create output directory if not exists', async () => {
      jestJunit.mockReturnValueOnce();
      existsSync.mockReturnValueOnce(false);
      mkdirSync.mockReturnValueOnce();
      renameSync.mockReturnValueOnce();
      instance.retryTestSuites = [];
      instance.retryTestCases = [];
      const results = {
        numFailedTestSuites: 0,
      };

      await instance.onRunComplete(undefined, results);

      expect(existsSync).toHaveBeenCalledWith(options.junitOutputDirectory);
      expect(mkdirSync).toHaveBeenCalledWith(options.junitOutputDirectory, {
        recursive: true,
      });
      expect(renameSync).toHaveBeenCalledWith(
        'junit.xml',
        `${instance.options.junitOutputDirectory}/junit.xml`,
      );
    });
  });

  describe('getLastError', () => {
    it('should return undefined if succeeded', () => {
      const globalConfig = 'globalConfig';
      const options = 'options';
      const instance = new JestFlakyRetryReporter(globalConfig, options);

      expect(instance.getLastError()).toBeUndefined();
    });

    it('should return error if failed', () => {
      const globalConfig = 'globalConfig';
      const options = 'options';
      const instance = new JestFlakyRetryReporter(globalConfig, options);
      instance.shouldFail = true;

      expect(instance.getLastError()).toStrictEqual(
        new Error('JestFlakyRetryReporter reported an error'),
      );
    });
  });

  describe('integration', () => {
    it('should return with an error but merged junit report', () => {
      let caughtError;

      try {
        execSync('cd demo && npm run test:unit');
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeDefined();

      const { status } = caughtError;
      const stdout = caughtError.stdout.toString();
      const stderr = caughtError.stderr.toString();

      expect(status).toBe(1);
      expect(stdout).toContain('Loading list of known flaky tests from jest.unit.flakyRetry.json');
      expect(stdout).toContain('[ { failureMessages: [ \'Random Flaky Error\' ] } ]');
      expect(stdout).toContain('Retrying test cases:  [ \'demo should fail on first test run and succeed on subsequent run\' ]');
      expect(stderr).toContain('1 failed, 1 total');
      expect(stderr).toContain('1 passed, 1 total');
    });

    it('should return with an error but merged junit report and use retries', () => {
      let caughtError;

      try {
        execSync('cd demo && npm run test:unit-retry');
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeDefined();

      const { status } = caughtError;
      const stdout = caughtError.stdout.toString();
      const stderr = caughtError.stderr.toString();

      expect(status).toBe(1);
      expect(stdout).toContain('Loading list of known flaky tests from jest.unit.flakyRetry.json');
      expect(stdout).toContain('[ { failureMessages: [ \'Random Flaky Error\' ] } ]');
      expect(stdout).toContain('demoWithRetries should fail on first and second test run and succeed on subsequent run');
      expect(stderr).toContain('1 failed, 1 total');
      expect(stderr).toContain('1 passed, 1 total');
    });
  });
});
