<h1 align="center" style="border-bottom: none;">jest-flaky-retry</h1>
<h3 align="center">Extension for <a href="https://facebook.github.io/jest">Jest</a> to retry and log flaky tests.</h3>
<p align="center">
  <a href="https://github.com/MSA-Safety/jest-flaky-retry/actions?query=workflow%3ATest+branch%3Amain">
    <img alt="Build states" src="https://github.com/MSA-Safety/jest-flaky-retry/workflows/Test/badge.svg">
  </a>
  <a href="#badge">
    <img alt="semantic-release: angular" src="https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release">
  </a>
</p>

# Installation & Configuration

With npm:

```shell
$ npm install --save-dev jest-flaky-retry
```

Configure flaky tests in your `jest.flakyRetry.json`:
```json
[
  {
    "testFilePath": "relative/path/to/wholeFileIsFlakyWithArbitraryErrors.test.js"
  }
]
```
See more fine-grained configuration options below.

Add this package to your `jest.config.js`:
```json
"reporters": [
    "default",
    [
        "jest-flaky-retry",
        {
            "configFile": "tests/integration/jest.flakyRetry.json",
            "junitOutputDirectory": "build/results/integration",
        },
    ],
]
```

## Jest Return Code Behavior
After successfully retrying a configured flaky test, Jest will return with a
non-zero exit code. However, the junit report shows no failures.

## Configuration Options
**`testFilePath`** (string)
- Relative path to test file
- If omitted, all test files will match

**`fullName`** (string)
- The test name, combination of describe+it descriptions
- If omitted, all tests will match for this file

**`failureMessages`** (array[string|regex])
- An expected failure message
- Can be a RegEx of the actual error output
- Must have at least 1 entry
- If omitted, the test will be retried for all errors

## Example Configuration
```json
[
    {
        "testFilePath": "tests/integration/service.feature1.int.test.js"
    },
    {
        "testFilePath": "tests/integration/service.feature2.int.test.js",
        "failureMessages": [
            "expected .*, got 503 \"Service Unavailable\""
        ]
    },
    {
        "testFilePath": "tests/integration/service.feature3.int.test.js",
        "fullName": "feature3 should not be flaky, but somehow is",
        "failureMessages": [
            "Error: A flaky test that shall be retried if it occurs in this test"
        ]
    }
]
```
Please see additional example configurations in `jest.flakyRetry.config.example.json`.

# Demo
Please have a look at the `demo` folder.

The node demo application shows a basic configuration of jest-flaky-retry. The output below shows the 
test execution:
- The first run of the test failed.
- Due to the thrown error being configured in the jest-flaky-retry configuration file, jest-flaky-retry performed retry attempt.
- The successful retry results in a failure-free junit output.
- Jest returns exit code 1, due to failed test runs.

Please note: this is not intended to represent a perfect example where this package might be helpful. More 
appropriate usages might be e.g. network flakiness in integration and e2e tests.

```shell
$ cd demo
$ npm run test # failure-free junit output; jest will return with exit code 1 nonetheless

  > jest-flaky-retry-demo@0.0.1 test
  > jest --config jest.config.js

  Determining test suites to run...Loading list of known flaky tests from jest.flakyRetry.json
  [ { failureMessages: [ 'Random Flaky Error' ] } ]
  FAIL  ./demo.unit.test.js
    demo
      ✕ should fail on first test run and succeed on subsequent run (1 ms)

    ● demo › should fail on first test run and succeed on subsequent run

      expect(received).toBeUndefined()

      Received: [Error: Random Flaky Error]

        11 |       caughtError = error;
        12 |     }
      > 13 |     expect(caughtError).toBeUndefined();
           |                         ^
        14 |   });
        15 | });
        16 |

        at Object.toBeUndefined (demo.unit.test.js:13:25)

  Retrying test cases:  [ 'demo should fail on first test run and succeed on subsequent run' ]
  PASS  ./demo.unit.test.js
    demo
      ✓ should fail on first test run and succeed on subsequent run (1 ms)

  Test Suites: 1 passed, 1 total
  Tests:       1 passed, 1 total
  Snapshots:   0 total
  Time:        0.139 s, estimated 1 s
  Ran all test suites with tests matching "demo should fail on first test run and succeed on subsequent run".
  Test Suites: 1 failed, 1 total
  Tests:       1 failed, 1 total
  Snapshots:   0 total
  Time:        0.521 s, estimated 1 s
```

Content of junit.xml output:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="jest tests" tests="1" failures="0" errors="0" time="0.52">
  <testsuite name="demo" errors="0" failures="0" skipped="0" timestamp="9999-99-99T00:00:00" time="0.123" tests="1">
    <testcase classname="demo should fail on first test run and succeed on subsequent run" name="demo should fail on first test run and succeed on subsequent run" time="0.001">
    </testcase>
  </testsuite>
</testsuites>
```

# License

This is free software, distributed under the [ISC license](https://opensource.org/licenses/ISC).