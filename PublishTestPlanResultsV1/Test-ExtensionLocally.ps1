<#
.SYNOPSIS
  This script is intended to support local development efforts by testing the extension outside of a pipeline.

.NOTES
  To run:
  - compile the extension 'tsc'
  - set any frequently used task parameters as environment variables in advance $env:INPUT_<variable>="<value>"
  - run this script without parameters. supply values or press enter to continue
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
  node index.js
}
