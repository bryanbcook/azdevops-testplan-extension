# MSTest Example

This MSTest Test Project demonstrates how to produce attachments that are included in the published Test Plan results.

Attachments are copied into a folder that is relative to the XML (TRX) output file. This root level folder is referenced in the TRX file as the `runDeploymentRoot`. Each individual test has an unique `executionId` and corresponding attachments folder under the `runDeploymentRoot`.

## Environment

This project is written with the following:

- .NET 8
- Microsoft.NET.Test.SDK (17.12.0)
- MSTest.TestAdapter (3.7.1)
- MSTest.TestFramework (3.7.1)

## Usage

To run the tests and produce the Xml output:

```shell
dotnet restore
dotnet test --logger "trx;LogFileName=TestResults.trx"
```

To publish xUnit results to a test plan, the following pipeline syntax matches the referenced examples:

```yaml
- task: PublishTestPlanResults@1
  inputs:
    testResultsFiles: 'path/to/TestResults.xml'
    testResultFormat: mstest
    testPlan: 'Your Test Plan'
    testCaseMatchStrategy: auto    # this is the default value
    testCaseProperty: TestCaseId   # because the tests are using [Property("TestCaseId", ...)]
```