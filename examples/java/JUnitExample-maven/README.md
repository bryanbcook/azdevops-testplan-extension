# Java JUnit Example (Maven)

This sample illustrates java-based JUnit tests that produce JUnit results that can be published to a test plan.

A sample of the XML output file is included for reference.

## Environment

This project is written with the following:

- JDK 17
- Maven 3
- JUnit 5.10

```shell
# windows administrative command prompt with choco installed
choco install temurin17 maven -y
```

## Usage

To run the tests and produce the Xml output:

```shell
export JAVA_HOME=/path/to/jdk
export PATH=$JAVA_HOME/bin:$PATH
mvn clean test verify
```

To publish junit results to a test plan, the following pipeline syntax matches the referenced examples:

```yaml
- task: PublishTestPlanResults@1
  inputs:
    testResultsFiles: 'examples/java/JUnitExample-maven/TestResults.xml'
    testResultFormat: junit
    testPlan: 'Your Test Plan'
    testCaseMatchStrategy: auto    # this is the default value
    testCaseProperty: TestCaseId   # because the tests are using custom properties
    testCaseRegex: 'testCase(\d+)' # because the tests use a naming convention of '<testname>_TestCaseNNN'
```
