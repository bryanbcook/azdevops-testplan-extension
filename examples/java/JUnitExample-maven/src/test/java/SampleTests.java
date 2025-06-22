package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SampleTests {

  // Match Strategy: regex
  // These tests demonstrate using the
  // regex match strategy, where the TestCase
  // number appears in the test method name.
  // The `testCaseRegex` input is set to: 'testCase(\d+)'
  @Test
  public void jUnit_passingTest_testCase4867() {
  }

  @Test
  public void jUnit_failingTest_testCase4868() {
    fail("This test failed intentially");
  }

  @Test
  @org.junit.jupiter.api.Disabled("This test is skipped")
  public void jUnit_skippedTest_testCase4869() {
    // This test is skipped
  }

  // Match Strategy: name
  // These tests demonstrate that the name of the test method
  // is used to match the TestCase name
  @Test
  public void jUnit_Match_Test_Case_By_Exact_Name() {
  }

  @Test
  public void jUnit_Match_TEST_case_By_Exact_Name_cAsE_iNsenSITive() {
  }

  @Test
  @org.junit.jupiter.api.DisplayName("JUnit Match Test Case by Display Name")
  public void match_testCaseByDisplayNameInsteadOfMethodName() {
  }

  // Match Strategy: property
  // These tests demonstrate how to match TestCases using
  // meta-data properties. The `testCaseProperty` input is set to: 'TestCaseId'
  @Test
  public void jUnit_associateTestCaseUsingTestProperty() {
    // custom properties can be set by writing to the console
    System.out.println("[[PROPERTY|TestCaseId=4876]]");
  }

}