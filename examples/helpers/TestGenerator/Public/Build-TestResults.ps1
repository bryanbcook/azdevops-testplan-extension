
Function Build-TestResults {
  param(
    [Parameter(Mandatory)]
    [string]$TestResultsDirectory,

    [Parameter(Mandatory)]
    [string]$TestResultsFileName,

    [string]$TestFramework = "NUnit",

    [string]$Namespace = "MyTests",

    [Parameter(Mandatory)]
    [string[]]$TestCaseIds,

    [int]$AttachmentsCount = 5,
    [int]$AttachmentSizeInBytes = 1024
  )

  Write-Host "Generating test results in $TestResultsDirectory/$TestResultsFileName"
  if (-not (Test-Path -Path $TestResultsDirectory)) {
    New-Item -ItemType Directory -Path $TestResultsDirectory | Out-Null
  }

  $buildTestResultsParams = @{
    TestResultsDirectory = $TestResultsDirectory
    TestResultsFileName = $TestResultsFileName
    Namespace = $Namespace
    TestSuite = "MyTestSuite"
    TestCaseIds = $TestCaseIds
    AttachmentsCount = $AttachmentsCount
    AttachmentSizeInBytes = $AttachmentSizeInBytes
  }

  Push-Location $TestResultsDirectory

  $buildTestResultsParams | Out-String | Write-Host
  Build-NUnitTestResults @buildTestResultsParams

  Pop-Location
}