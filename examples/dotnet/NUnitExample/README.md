# NUnit Example

This basic NUnit Test Project produces an XML file in NUnit format that can be published to a Test Plan.

A sample of the XML output file is included for reference.

## Environment

This project is written with the following:

- .NET 8
- NUnit (4.3.1)
- NUnit.Analyzers (4.5.0)
- NUnit3TestAdapter (4.6.0)
- NUnitXml.TestLogger (5.0.0)

## Usage

To run the tests and produce the Xml output:

```shell
dotnet restore
dotnet test --logger:nunit
```

To publish xUnit results to a test plan, the following pipeline syntax matches the referenced examples:

```yaml
- task: PublishTestPlanResults@1
  inputs:
    testResultsFiles: 'path/to/TestResults.xml'
    testResultFormat: nunit
    testPlan: 'Your Test Plan'
    testCaseMatchStrategy: auto    # this is the default value
    testCaseProperty: TestCaseId   # because the tests are using [Property("TestCaseId", ...)]
    testCaseRegex: 'TestCase(\d+)' # because the tests use a naming convention of '<testname>_TestCaseNNN'
```