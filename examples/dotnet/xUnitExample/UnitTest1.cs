namespace xUnitExample
{

  public class MatchStrategyExamples
  {
    // These test demonstrate using the
    // regex match strategy, where the TestCase
    // number appears in the test method name.
    // The `testCaseRegex` input is set to: 'TestCase(\d+)'
    #region Match Strategy: regex
    [Fact]
    public void xUnit_PassingTest_TestCase4823()
    {
    }

    [Fact]
    public void xUnit_FailingTest_TestCase4824()
    {
      Assert.Fail("This test failed intentionally");
    }

    [Fact(Skip = "This test is skipped and is recorded as 'NotExecuted' in the Test Run")]
    public void xUnit_SkippedTest_TestCase4825()
    {
    }
    #endregion

    // These test demonstrate using the 
    // "name" match strategy, where the display name
    // of the test method is an equivalent match for
    // the TestCase name in the Test Plan.
    #region Match Strategy: name
    [Fact]
    public void Match_Test_Case_By_Exact_Name()
    {
    }

    [Fact]
    public void match_TEST_case_By_Exact_Name_CaSe_iNsEnSiTiVe()
    {
    }

    [Fact(DisplayName = "Match Test Case by Display Name")]
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
    [Fact]
    public void xUnit_TestMethod_AssociatedToTestCase_Using_Microsoft_VSTS_TCM_TestAutomatedName1()
    {
    }

    [Fact]
    public void xUnit_TestMethod_AssociatedToTestCase_Using_Microsoft_VSTS_TCM_TestAutomatedName2()
    {
    }
    #endregion

    // These test cases demonstrate using the
    // "property" match strategy, where the TestCase
    // number appears in a xUnit Trait attribute.
    // The `testCaseProperty` input is set to 'TestCaseId'
    #region Match Strategy: property
    [Fact]
    [Trait("TestCaseId", "1234")]
    public void xUnit_TestMethod_AssociatedToTestCase_Using_Trait()
    {
    }
    #endregion
  }
}