import { expect } from "chai";

import { ShallowReference, TestConfiguration, TestPoint, WorkItemReference } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import { TestConfigMatchStrategy, TestIdMatchStrategy, TestNameMatchStrategy, TestRegexMatchStrategy } from "../processing/TestResultProcessorFactory";
import { TestResultMatch } from "../processing/TestResultMatchStrategy";
import * as util from './testUtil';

describe("TestCaseMatchStrategy", () => {

  var test : TestFrameworkResult;
  var point : TestPoint;

  context("TestConfig Matcher", () => {

    var subject : TestConfigMatchStrategy;

    beforeEach(() => {
      // setup supported configs
      var config = <TestConfiguration>{ id: 1, name: "Config1"};
      var allowedConfigs = new Map<string,TestConfiguration>();
      allowedConfigs.set(config.id.toString(), config);
      allowedConfigs.set(config.name, config);
      allowedConfigs.set("alias", config);

      // setup args for tests
      test = new TestFrameworkResult("test1", "FAIL");
      point = <TestPoint>{ id: 1, configuration: <ShallowReference>{ id: "1", name:"Config1"} };       

      // setup subject
      subject = new TestConfigMatchStrategy(allowedConfigs,"Config");
    })

    it('Should match if testpoint has the same category as filter', async () => {
      // arrange

      // act
      var result = subject.isMatch(test, point);

      // assert
      expect( result).eq(TestResultMatch.None);
    });

    // test point does not have same category
    it('Should not match if testpoint does not have the same category as filter', async() => {
      // arrange
      point.configuration = <ShallowReference>{ id: "2", name: "Different Config"};

      // act
      var result = subject.isMatch(test, point);

      // assert
      expect(result).eq(TestResultMatch.Fail);
    });

    it('Should match if test result has matching config', async () => {
      // arrange
      test.properties.set("Config", "1");
      
      // act
      var result = subject.isMatch(test, point);

      // assert
      expect(result).eq(TestResultMatch.None);
    });

    it('Should match if test result has matching config alias', async () => {
      // arrange
      test.properties.set("Config", "alias");

      // act
      var result = subject.isMatch(test, point);

      // assert
      expect(result).eq(TestResultMatch.None);
    });
      // // arrange
      // // act
      // // assert
      // throw new Error("Not implemented");



  });

  context("TestCase Name Matcher", () => {

    var subject : TestNameMatchStrategy = new TestNameMatchStrategy();
    
    before(() => {
      point = <any>{ id: 1000, testCaseReference: <WorkItemReference>{ name: "The Name of The Test"}};
    })

    it("Should match test result name that contains spaces", () => {
      // arrange
      test = new TestFrameworkResult("The Name of The Test", "FAIL");

      // act
      var result = subject.isMatch(test,point);

      // assert
      expect(result).to.eq(TestResultMatch.Exact);
    });
    
    it("Should match test result name with underscores", () => {
      // arrange
      test = new TestFrameworkResult("The_Name_of_The_Test", "FAIL");

      // act
      var result = subject.isMatch(test,point);

      // assert
      expect(result).to.eq(TestResultMatch.Exact);
    });

    it("Should match test result name with hypens", () => {
      // arrange
      test = new TestFrameworkResult("The-Name-of-The-Test", "FAIL");

      // act
      var result = subject.isMatch(test,point);

      // assert
      expect(result).to.eq(TestResultMatch.Exact);
    });

    it("Should match test result with mixed case", () => {
      // arrange
      test = new TestFrameworkResult("THE name OF the TEST", "FAIL");

      // act
      var result = subject.isMatch(test,point);

      // assert
      expect(result).to.eq(TestResultMatch.Exact);
    });

    it("Should treat non-matches as neutral matches to allow further filtering", () => {
      // arrange
      test = new TestFrameworkResult("Not the same name", "FAIL");

      // act
      var result = subject.isMatch(test,point);

      // assert
      expect(result).to.eq(TestResultMatch.None);
    });
  });

  context("TestCase Regex Matcher", () => {

    var subject : TestRegexMatchStrategy;

    before(() => {
      point = <any>{ id: 1000, testCaseReference: <WorkItemReference>{ id:"1234"}};
    })

    it("Should  find test case id at end of test name", () => {
      // arrange
      subject = new TestRegexMatchStrategy("(\\d+)");
      test = new TestFrameworkResult("MyMethod.Name.HasANumber_1234", "FAIL");

      // act
      var result = subject.isMatch(test,point);

      // assert
      expect(result).to.eq(TestResultMatch.Exact);
    });

    it("Should  find test case id using TestCase## regex", () => {
      subject = new TestRegexMatchStrategy("(\\d+)");
      test = new TestFrameworkResult("MyMethod.Name.TestCase1234_SomeMethod", "FAIL");

      // act
      var result = subject.isMatch(test,point);

      // assert
      expect(result).to.eq(TestResultMatch.Exact);
    });

    it("Should fail match if regex value does not match", () => {
      subject = new TestRegexMatchStrategy("(\\d+)");
      test = new TestFrameworkResult("MyMethod.Name.SomeMethod_5432", "FAIL");

      // act
      var result = subject.isMatch(test,point);

      // assert
      expect(result).to.eq(TestResultMatch.Fail);
    });

    it("Should return neutral match if no regex value was found", () => {
      subject = new TestRegexMatchStrategy('(\\d+)');
      test = new TestFrameworkResult("MyMethod.Name.SomeMethod", "FAIL");

      // act
      var result = subject.isMatch(test,point);

      // assert
      expect(result).to.eq(TestResultMatch.None);
    });
  });

  // context("TestCase VisualStudio Automation Property Matcher", () => {

  //   // Microsoft.VSTS.TCM.AutomatedTestName

  //   var subject : TestAutomationPropertyMatchStrategy = new TestAutomationPropertyMatchStrategy();

  //   it("Should match if test case automation property matches testcase name", () => {
  //     // arrange
  //     // act
  //     // assert
  //     throw new Error("Not implemented");
  //   });

  //   it("Should fail match if test automation property does not match", () => {
  //     // arrange
  //     // act
  //     // assert
  //     throw new Error("Not implemented");
  //   });

  //   it("Should fail match if test automation property is present on test result but not available on test case", () => {
  //     // arrange
  //     // act
  //     // assert
  //     throw new Error("Not implemented");
  //   });

  //   it("Should return inconclusive result if test automation property is not present", () => {
  //     // arrange
  //     // act
  //     // assert
  //     throw new Error("Not implemented");
  //   });

  // });

  context("Test Id Matcher", () => {

    var subject : TestIdMatchStrategy

    beforeEach(() => {
      test = new TestFrameworkResult("MyAutomatedTest","FAIL");
      point = <any>{ id: 1000, testCaseReference: <WorkItemReference>{ id: "1" }};
      subject = new TestIdMatchStrategy("TestCase");
    })
    
    it("Should fail match if id property is not present", () => {
      // arrange
      // act
      var result = subject.isMatch(test, point);

      // assert
      expect(result).to.eq(TestResultMatch.Fail);
    });

    it("Should match if test case property matches test case id", () => {
      // arrange
      test.properties.set("TestCase", "1");

      // act
      var result = subject.isMatch(test, point);
      
      // assert
      expect(result).to.eq(TestResultMatch.Exact);
    })
    
    it("Should fail match if id property and test case id are different", () => {
      // arrange
      test.properties.set("TestCase", "2");

      // act
      var result = subject.isMatch(test, point);
      
      // assert
      expect(result).to.eq(TestResultMatch.Fail);
    })
  })

})