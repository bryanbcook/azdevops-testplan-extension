# xUnit Example

This basic xUnit Test Project produces an XML file in xUnit format that can be published to a Test Plan.

A sample of the XML output file is included for reference.

## Environment

This project is written with the following:

- .NET 8
- xUnit (2.9.2)
- xUnit.Runner (2.8.2)
- xUnitXml.Logger (4.1.0)

## Usage

To run the tests and produce the Xml output:

```shell
dotnet restore
dotnet test --logger:xunit
```

To publish xUnit results to a test plan, the following pipeline syntax matches the referenced examples:

```yaml
- task: PublishTestPlanResults@1
  inputs:
    testResultsFiles: 'path/to/TestResults.xml'
    testResultFormat: xunit
    testPlan: 'Your Test Plan'
    testCaseMatchStrategy: auto    # this is the default value
    testCaseProperty: TestCaseId   # because the tests are using [Trait("TestCaseId", ...)]
    testCaseRegex: 'TestCase(\d+)' # because the tests use a naming convention of '<testname>_TestCaseNNN'
```
