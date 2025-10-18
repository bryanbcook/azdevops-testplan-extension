<#
.SYNOPSIS
  This script is intended to support local development efforts by testing the extension outside of a pipeline.

.NOTES
  - To run:
    1. compile the extension 'tsc'
    2. run this script without parameters. supply values or press enter to continue

  - To suppress all debug log output set the environment variable DISTRIBUTEDTASK_TASKS_NODE_SKIPDEBUGLOGSWHENDEBUGMODEOFF to "true"


.EXAMPLE

  Run the extension locally, but supress prompting for common inputs

  ```
  $env:DISTRIBUTEDTASK_TASKS_NODE_SKIPDEBUGLOGSWHENDEBUGMODEOFF = "true"
  $testParams = @{
    CollectionUri = "https://dev.azure.com/yourorg"
    ProjectName = "yourproject"
    TestPlan="Your Test Plan"
    AccessToken = "<PAT>"
    TestResultFormat = "mstest"
    TestResultFiles = "path/to/testresults.xml"
    TestCaseProperty = "TestCaseId"
    TestCaseRegex = "TestCase(\d+)"
  }
  .\Test-ExtensionLocally.ps1 @testParams
  ```
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory, HelpMessage="Defaults to $\(System.CollectionUri\), set SYSTEM_COLLECTIONURI to override")]
  [AllowEmptyString()]
  [string]$CollectionUri,

  [Parameter(Mandatory, HelpMessage="Defaults to $\(System.ProjectName\) set SYSTEM_PROJECTNAME to override")]
  [AllowEmptyString()]
  [string]$ProjectName,

  [Parameter(Mandatory, HelpMessage="Defaults to $\(System.AccessToken\), set SYSTEM_ACCESSTOKEN to override")]
  [AllowEmptyString()]
  [string]$AccessToken,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestResultFormat,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestResultFiles,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestPlan,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestConfigFilter,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestConfigAliases,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestCaseMatchStrategy,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestCaseProperty,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestCaseRegex,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestConfigProperty,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$TestRunTitle,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$BuildId,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$ReleaseId,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$ReleaseEnvironmentId,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$failTaskOnFailingTests,

  [Parameter(Mandatory)]  
  [AllowEmptyString()]
  [string]$DryRun,

  [switch]$DebugMode

)

if ($DryRun -ne "") {
  $DryRun = "true"
}

$PSBoundParameters.GetEnumerator() | ForEach-Object {
  if (($_.Value -ne $null) -or $_.Value -ne "") {
    $key = "INPUT_$($_.Key)"
    [System.Environment]::SetEnvironmentVariable($key, $_.Value)
  }  
}

# BuildId isn't an input parameter.
if ($BuildId) {
  [System.Environment]::SetEnvironmentVariable("BUILD_BUILDID", $BuildId)
} else {
  [System.Environment]::SetEnvironmentVariable("BUILD_BUILDID", "")
}

if ($ReleaseId -and $ReleaseEnvironmentId) {
  [System.Environment]::SetEnvironmentVariable("RELEASE_RELEASEURI", "vstfs:///ReleaseManagement/Release/$ReleaseId")
  [System.Environment]::SetEnvironmentVariable("RELEASE_ENVIRONMENTURI", "vstfs:///ReleaseManagement/Environment/$ReleaseEnvironmentId")
} else {
  [System.Environment]::SetEnvironmentVariable("RELEASE_RELEASEURI", "")
  [System.Environment]::SetEnvironmentVariable("RELEASE_ENVIRONMENTURI", "")
}

if (!$env:SYSTEM_DEFAULTWORKINGDIRECTORY) {
  [System.Environment]::SetEnvironmentVariable("SYSTEM_DEFAULTWORKINGDIRECTORY", (Resolve-Path .))
}


if ($DebugMode.IsPresent) {
  [System.Environment]::SetEnvironmentVariable("SYSTEM_DEBUG", "true");
  node --inspect index.js 
} else {
  # Capture both stdout and Pstderr to analyze the output
  $capturedOutput = @()
  & node index.js 2>&1 | ForEach-Object {
    $capturedOutput += $_

    if ($_ -match "##vso\[task\.complete|##vso\[task\.issue") {
      # Suppress errors and warnings from being interpreted by Azure DevOps
      Write-Host $_.Replace("##vso[", "--vso[")
    } else {
      # Write all other output to the host
      Write-Host $_
    }
  }
  $outputString = $capturedOutput -join "`n"
  
  if ($failTaskOnFailingTests -eq "true") {
    # Check if the task explicitly set a failed result via Azure DevOps logging command
    $taskFailurePattern = "##vso\[task\.complete result=Failed;\].*"
    $taskFailureFound = $outputString -match $taskFailurePattern
    
    if ($taskFailureFound) {
      Write-Host "Task failure was detected via Azure DevOps logging command. This was expected."
    } elseif ($LASTEXITCODE -ne 0) {
      Write-Host "Task failure was expected. Process exited with code $LASTEXITCODE"
    } else {
      Write-Host "Task was expected to fail if test failed. No failure was reported."
      Write-Host "##vso[task.issue type=error]Task was expected to fail if test failed. However, no failure was reported."
      Exit 1
    }
  }
}
