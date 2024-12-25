namespace NUnitExample
{
  public class Tests
  {
    // These test demonstrate using the
    // regex match strategy, where the TestCase
    // number appears in the test method name.
    // The `testCaseRegex` input is set to: 'TestCase(\d+)'
    #region Match Strategy: regex
    [Test]
    public void NUnit_PassingTest_TestCase4833()
    {
    }

    [Test]
    public void NUnit_FailingTest_TestCase4834()
    {
      Assert.Fail("This test failed intentionally");
    }

    [Test]
    [Ignore("Disabled")]
    public void NUnit_SkippedTest_TestCase4835()
    {
    }
    #endregion

    // These test demonstrate using the 
    // "name" match strategy, where the display name
    // of the test method is an equivalent match for
    // the TestCase name in the Test Plan.
    #region Match Strategy: name
    [Test]
    public void NUnit_Match_Test_Case_By_Exact_Name()
    {
    }

    [Test]
    public void nunit_match_TEST_case_By_Exact_Name_CaSe_iNsEnSiTiVe()
    {
    }

    [Test(Description = "NUnit Match Test Case by Description")]
    public void Match_TestCaseByDisplayNameInsteadOfMethodName()
    {
    }
    #endregion

    // These tests demonstrate using the
    // "vsproperty" match strategy, where each of these
    // test methods have been associated with a TestCase
    // in the TestPlan by setting the fully qualified
    // method name as the "Automated Test Name" 
    // (Microsoft.VSTS.TCM.TestAutomatedName) using
    // Visual Studio as described in:
    // https://learn.microsoft.com/en-us/azure/devops/test/associate-automated-test-with-test-case?view=azure-devops#associate-your-test
    #region Match Strategy: vstest
    [Test]
    public void NUnit_TestMethod_AssociatedToTestCase_Using_Microsoft_VSTS_TCM_TestAutomatedName1()
    {
    }

    [Test]
    public void NUnit_TestMethod_AssociatedToTestCase_Using_Microsoft_VSTS_TCM_TestAutomatedName2()
    {
    }
    #endregion

    // These test cases demonstrate using the
    // "property" match strategy, where the TestCase
    // number appears in a xUnit Trait attribute.
    // The `testCaseProperty` input is set to 'TestCaseId'
    #region Match Strategy: property
    [Test]
    [Property("TestCaseId", "4841")]
    public void NUnit_TestMethod_AssociatedToTestCase_Using_Property()
    {
    }
    #endregion
  }
}