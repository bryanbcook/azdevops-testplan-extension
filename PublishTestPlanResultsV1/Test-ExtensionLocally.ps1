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
  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$CollectionUri,

  [Parameter(Mandatory)]
  [AllowEmptyString()]
  [string]$ProjectName,

  [Parameter(Mandatory)]
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

  [switch]$DebugMode

)
$PSBoundParameters.GetEnumerator() | ForEach-Object {
  if ($_.Value -ne $null) {
    $key = "INPUT_$($_.Key)"
    [System.Environment]::SetEnvironmentVariable($key, $_.Value)
  }  
}

if ($DebugMode.IsPresent) {
  node --inspect index.js 
} else {
  node index.js
}
