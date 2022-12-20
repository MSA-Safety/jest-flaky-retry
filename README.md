<h1 align="center" style="border-bottom: none;">jest-flaky-retry</h1>
<h3 align="center">Extension for <a href="https://facebook.github.io/jest">Jest</a> to retry and log flaky tests.</h3>
<p align="center">
  <a href="https://github.com/MSA-Safety/jest-flaky-retry/actions?query=workflow%3ATest+branch%3Amain">
    <img alt="Build states" src="https://github.com/MSA-Safety/jest-flaky-retry/workflows/Test/badge.svg">
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

# License

This is free software, distributed under the [ISC license](https://opensource.org/licenses/ISC).