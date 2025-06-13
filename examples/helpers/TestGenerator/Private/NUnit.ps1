
Function New-NUnitSuite {
  param(
    [string]$type,
    [string]$name,
    [string]$fullname,
    [string]$result = "Passed",
    [System.Xml.XmlElement[]]$children = @(),
    [System.Xml.XmlDocument]$xmlDoc
  )

  $suite = $xmlDoc.CreateElement("test-suite")
  $suite.SetAttribute("type", $type)
  $suite.SetAttribute("name", $name)
  $suite.SetAttribute("fullname", $fullname)
  $suite.SetAttribute("result", $result)

  foreach($child in $children) {
      $suite.AppendChild($child) | Out-Null
  }

  return $suite
}

Function New-NUnitTestCase {
    param(
        [string]$namespace,
        [string]$className,
        [string]$methodName,
        [string]$result,
        [PSCustomObject]$properties = @{},
        [int]$AttachmentsCount,
        [int]$AttachmentSizeInBytes = 1024,
        [System.Xml.XmlDocument]$xmlDoc
    )
    
    $testCase = $xmlDoc.CreateElement("test-case")
    $testCase.SetAttribute("name", $methodName)
    $testCase.SetAttribute("methodname", $methodName)
    $testCase.SetAttribute("fullname", "$namespace.$className.$methodName")
    $testCase.SetAttribute("classname", "$namespace.$className")
    $testCase.SetAttribute("result", $result)

    if ($properties.PSObject.Properties.Count -gt 0) {
      $propertiesElement = $xmlDoc.CreateElement("properties")
      foreach ($key in $properties.Keys) {
          $propertyElement = $xmlDoc.CreateElement("property")
          $propertyElement.SetAttribute("name", $key)
          $propertyElement.SetAttribute("value", $properties[$key])
          $propertiesElement.AppendChild($propertyElement) | Out-Null
      }
      $testCase.AppendChild($propertiesElement) | Out-Null
    }
    
    if ($AttachmentsCount -gt 0) {
      $attachmentsElement = $xmlDoc.CreateElement("attachments")
      
      for ($i = 1; $i -le $AttachmentsCount; $i++) {
        $fileName = Join-Path (Resolve-Path .).Path -ChildPath "$methodName-$i.txt"
        Write-Host "Creating attachment: $fileName with size $AttachmentSizeInBytes bytes"
        New-Attachment -fileName $fileName -size $AttachmentSizeInBytes

        $filePathElement = $xmlDoc.CreateElement("filePath")
        $filePathElement.InnerText = $fileName
        $attachmentElement = $xmlDoc.CreateElement("attachment")
        $attachmentElement.AppendChild($filePathElement) | Out-Null
        $attachmentsElement.AppendChild($attachmentElement) | Out-Null
      }
      $testCase.AppendChild($attachmentsElement) | Out-Null
    }
    
    return $testCase
}

Function Build-NUnitTestResults
{
  param(
    [Parameter(Mandatory)]
    [string]$TestResultsDirectory,

    [Parameter(Mandatory)]
    [string]$TestResultsFileName,

    [Parameter(Mandatory)]
    [string]$Namespace,

    [Parameter(Mandatory)]
    [string]$TestSuite,

    [Parameter(Mandatory)]
    [string[]]$TestCaseIds,

    [int]$AttachmentsCount = 5,
    [int]$AttachmentSizeInBytes = 1024
  )

  $xmlDoc = New-Object System.Xml.XmlDocument
  
  # Generate Test Cases
  $testCases = @()
  foreach ($testCaseId in $TestCaseIds) {
    $testCaseMeta = @{
      Namespace = "$Namespace.$TestSuite"
      ClassName = "MyClass"
      MethodName = ""
      Result = "Passed"
      xmlDoc = $xmlDoc
    }
    $testCaseMeta.MethodName = "TestMethod_TestCase$testCaseId"

    $testCase = New-NUnitTestCase @testCaseMeta -AttachmentsCount $AttachmentsCount -AttachmentSizeInBytes $AttachmentSizeInBytes -properties @{ "TestCaseId" = $testCaseId }
    $testCases += $testCase
  }

  # add testcases into testfixture
  $suiteElement = New-NUnitSuite -type "TestFixture" -name $testSuiteName -fullname "$Namespace.$testSuiteName" -children $testCases -xmlDoc $xmlDoc
  # add testfixture to assembly suite
  $testAssemblySuite = New-NUnitSuite -Type "Assembly" -name "$namspace.dll" -children @( $suiteElement ) -xmlDoc $xmlDoc
  # add assembly suite to test-run
  $testRun = $xmlDoc.CreateElement("test-run")
  $testRun.AppendChild($testAssemblySuite) | Out-Null
  # add test-run as root element to xml document
  $xmlDoc.AppendChild($testRun) | Out-Null
  $xmlDoc.Save("$TestResultsDirectory/$TestResultsFileName")
  
}