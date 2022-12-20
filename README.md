<h1 align="center" style="border-bottom: none;">jest-flaky-retry</h1>
<h3 align="center">Extension for <a href="https://facebook.github.io/jest">Jest</a> to retry and log flaky tests.</h3>

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

**`fullName`** (string)
- The test name, combination of describe+it descriptions
- If omitted, all tests will match for this file

**`failureMessages`** (array[string])
- An expected failure message
- Can be prefix of the actual error output
- Must have at least 1 entry
- If omitted, the test will be retried for all errors

Please see example configurations in `jest.flakyRetry.config.example.json`.

# License

This is free software, distributed under the [ISC license](https://opensource.org/licenses/ISC).