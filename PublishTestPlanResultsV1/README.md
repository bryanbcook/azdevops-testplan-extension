# PublishTestPlanResults@1

Publishes test results to your Azure DevOps Test Plan.

## Syntax

```yaml
- task: PublishTestPlanResults@1
  inputs:
    #accessToken: # string. Optional. PAT token
    #collectionUri: # string. Optional. Azure DevOps instance
    #projectName: # string. Optional. Project containing the Test Plan
    testResultFormat: # string. Required. Result Format (xUnit, Unit, etc)
    testResultFiles: # string. Required. Path to the test result file(s)
    #testPlan: # string. Optional. Test Plan name or identifier.
    #testConfigFilter: # string. Optional. Limit updates to a specific Test Configuration.
    #testConfigAliases: # string. Optional.
    #testCaseMatchStrategy: # string. Optional. Test Case Matching Strategy
    #testCaseProperty: # string. Optional. Test Case Id Property
    #testCaseRegex: # string. Optional. Test Case Id RegEx
```

## Inputs

### `accessToken` - PAT Token

`string`. Optional

Access Token used to obtain Test Plan details and publish Test Results. Defaults to PAT token of the build agent, `$(System.AccessToken)`

### `collectionUri` - Azure DevOps Instance

`string`. Optional.

Represents the uri to the Azure DevOps instance. Defaults to the current Azure DevOps instance, `$(System.CollectionUri)`

### `projectName` - Project containing the Test Plan

`string`. Optional.

Specifies the Azure DevOps Project name that contains the Test Plan to update. Defaults to the current project name, `(System.TeamProjectName)`

### `testResultFormat` - Test Result Framework

`string`. Required.

Specifes the format of the `testResultFiles`. Supported values: xUnit, jUnit, cucmber, mocha, nunit, testng, mstest.

### `testResultFiles` - Test Result Files

`string`. Required.

Specifies the path to the test result file(s). Multiple files can be expressed in a comma-delimited format.

### `testPlan` - Test Plan Name or Identifier

`string`. Optional.

Specifies the Test Plan name or its numerical identifier within the current or specified Azure DevOps Project.

If a value is not specified, the task will attempt to locate the latest active Test Plan. An error is produced if an appropriate Test Plan cannot be automatically inferred.

### `testConfigFilter` - Default Test Configuration

`string`. Optional.

Specifies the Test Configuration name or identifier that will be associated to the test results.

This value is optional if there is only a single Test Configuration available.

If there are multiple Test Configurations available and this value is not specified, it is expected that each test in the test results will indicate which test configuration to use. See `testConfigAliases` and `testConfigMappingStrategy`.

### `testConfigAliases` - Test Configuration Aliases

`string`. Optional.

This comma-delimited list contains a mapping between the alias that may appear in the test result and the Test Configuration in the Test Plan.

Examples:

```yaml
testConfigAliases: edge='Microsoft Edge',chrome='Google Chrome'
```

### `testCaseMatchStrategy` - Test Case Matching Strategy

`string`. Optional.

Specifies which mapping strategy to use to correlate test automation results to test cases. Specifying `auto` will use all available strategies in the most appropriate order and should satisfy most scenarios. Users can provide a customized comma-delimited string for the desired strategies, if required. For example, if the `regex` strategy is producing false-positives, it can be ommitted by specifying a value `name,property`.

- **auto**: use all available strategies
- **name**: attempt to match the test case name to the test automation name
- **regex**: attempt to locate the test case id using a regex on the test automation result name.
- **property**: locate the test case id from the meta-data in the test automation result.

The default value is `auto`, which is equivalent to specifying `name,regex,property`.

### `testCaseProperty` - Test Case Id Property

`string`. Optional.

Indiciates which meta-data property on the test automation result will be used to locate the TestCase identifier. Defaults to `TestCase`.  Applicable when `testCaseMatchStrategy` is set to _'auto'_ or contains _'property'_.

Each test framework has varying support for _Properties_.

### `testCaseRegex` - Test Case Id Regex

`string`. Optional.

Specifies the regular expression used to locate the test case identifier in the name of the test automation result. Defaults to `(TestCase\d+)` where the first capture group is the test case id.

### `testConfigProperty` - Test Config Property

`string`. Optional.

Indicates which meta-data property on the test automation result will be used to loate the TestConfiguration id, name or alias. Defaults to `Config`. Applicable when `testConfigFilter` property is not specified and the test automation results contain outputs from multiple test configurations.

### `dryRun` - Dry Run

`boolean`. Optional.

Enables or disables publishing results to the TestPlan. Useful for evaluating different test case match strategies.

### `testRunTitle` - Test run title

`string`. Optional.

Specifies a name for the test run against which the results will be reported.
