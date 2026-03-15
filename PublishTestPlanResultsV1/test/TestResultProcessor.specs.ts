import sinon from "sinon";
import { expect } from "chai";
import * as testUtil from './testUtil';

import { TestResultContext } from "../context/TestResultContext";
import { TestResultMatch, TestResultMatchStrategy } from "../processing/TestResultMatchStrategy";
import { TestIdMatchStrategy } from "../processing/TestResultProcessorFactory";
import { TestPoint, TestPlan } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import { TestResultProcessor } from "../processing/TestResultProcessor";
import { Logger, NullLogger } from "../services/Logger";

describe('TestResultProcessor', () => {

  var ctx : sinon.SinonStubbedInstance<TestResultContext>;
  var testresults : TestFrameworkResult[];
  var subject : TestResultProcessor;

  beforeEach(() => {
    // setup subject
    var matchers : TestResultMatchStrategy[] = [];
    matchers.push( new TestIdMatchStrategy("TestCase") );
    ctx = sinon.createStubInstance(TestResultContext);
    subject = new TestResultProcessor(matchers, ctx);
    subject.logger = new NullLogger();

    // setup read-only properties on ctx
    (ctx as any).testPlan = null;
    (ctx as any).projectId = null;

    // setup test framework results with properties for TestIdMatchStrategy
    testresults = [ 
      testUtil.newTestFrameworkResult("First", "PASS", new Map([["TestCase", "1000"]])),
      testUtil.newTestFrameworkResult("Second", "PASS", new Map([["TestCase", "2000"]])),
      testUtil.newTestFrameworkResult("Third", "PASS", new Map([["TestCase", "3000"]]))
    ];

    setupTestPoints([
      testUtil.newTestPoint(1, "Test Case 1000", "0", "1000"),
      testUtil.newTestPoint(2, "Test Case 2000", "0", "2000"),
      testUtil.newTestPoint(3, "Test Case 3000", "0", "3000")
    ]);
  })

  it("Should map test results to test points", async () => {
    // arrange
    // use defaults

    // act
    var result = await subject.process(testresults);

    // assert
    expect(result.matches.size).eq(3);
  });

  it("Should identity test results that were not mapped", async () => {
    // arrange
    testresults.unshift(new TestFrameworkResult("First automated test doesn't match", "PASS"));
    testresults.push(new TestFrameworkResult("Last automated test doesn't match", "FAIL"));

    // act
    var result = await subject.process(testresults);

    // assert
    expect(result.unmatched.length).eq(2);
  });

  it("Should only map a test point once, even if there are duplicates", async () => {
    // arrange
    let test = new TestFrameworkResult("Duplicate, but first in the list", "PASS");
    test.properties.set("TestCase", "1000");
    testresults.unshift(test);

    // act
    var result = await subject.process(testresults);

    // assert
    expect(result.matches.size).eq(3); // shouldn't be more matches than expected
    // map contains test POINT id
    expect(result.matches.get(1)?.name).to.eq("Duplicate, but first in the list");
    expect(result.unmatched[0].name).to.eq("First"); // the original test result we displaced.
  });

  it("Should have details about TestPlan", async () => {
    // arrange
    sinon.stub(ctx, "testPlan").value(<TestPlan>{ id: 1})

    // act
    var result = await subject.process(testresults);

    // assert
    expect(result.testPlan).eq(ctx.testPlan);
  });

  it("Should have details about Project", async () => {
    // arrange
    sinon.stub(ctx, "projectId").value("1");

    // act
    var result = await subject.process(testresults);

    // assert
    expect(result.projectId).eq(ctx.projectId);
  });

  function setupTestPoints(points : TestPoint[]) {
    ctx.getTestPoints.returns(points);
  }

  // Although Test Points are unique, it's possible to import a test suite that contains
  // the same test case multiple times. When this happens, typically this should be viewed
  // as a mistake in the test plan design as this would represent duplication of testing efforts.
  // However, multiple users have requested to have the ability to support this scenario.
  context("Test Plan contains Duplicates", () => {

    beforeEach(() => {
      // setup the test plan to have duplicate test points
      setupTestPoints(
        [
          testUtil.newTestPoint(10000, "Test Case 1234", "0", "1234"),
          testUtil.newTestPoint(10001, "Test Case 1234", "0", "1234"),
          testUtil.newTestPoint(10002, "Test Case 5678", "0", "5678"),
          testUtil.newTestPoint(10003, "Test Case 9012", "0", "9012")
        ]
      );

      testresults = [
         testUtil.newTestFrameworkResult("Test Case 1234", "PASS", new Map([["TestCase", "1234"]])), // should match 10000, 10001
         testUtil.newTestFrameworkResult("Test Case 5678", "PASS", new Map([["TestCase", "5678"]])) // should match 10002
      ]
    })

    it("Should log a warning that the test plan contains duplicates", async () => {
      // arrange
      subject.logger = sinon.createStubInstance(Logger);

      // act
      var result = await subject.process(testresults);
      
      // assert
      sinon.assert.called(subject.logger.warn as sinon.SinonSpy);
      var loggedMessage = (subject.logger.warn as sinon.SinonSpy).getCall(0).args[0] as string;
      expect(loggedMessage).to.contain("Test Plan contains duplicates for test case: 1234");
    });

    it ("Should map test result to multiple test points", async () => {
      // arrange
      // act
      var result = await subject.process(testresults);

      // assert
      expect(result.matches.size).to.eq(3);
      expect(result.matches.get(10000)?.name).to.eq("Test Case 1234");
      expect(result.matches.get(10001)?.name).to.eq("Test Case 1234");
      expect(result.matches.get(10002)?.name).to.eq("Test Case 5678");
    })
  })

  context("Multiple Matches", () => {

    it("Should log an issue when multiple matches are found", async () => {
      // arrange
      subject = new TestResultProcessor( [ new AlwaysMatch() ], ctx);
      subject.logger = sinon.createStubInstance(Logger);

      // act
      var result = await subject.process(testresults);

      // assert
      sinon.assert.called(subject.logger.warn as sinon.SinonSpy);
      var loggedMessage = (subject.logger.warn as sinon.SinonSpy).getCall(0).args[0] as string;
      expect(loggedMessage).to.contain("Multiple matches were found for test case");
      expect(result.matches.size).to.eq(0);
    })
  })

})

class AlwaysMatch implements TestResultMatchStrategy {
  isMatch(result: TestFrameworkResult, point: TestPoint): TestResultMatch {
    return TestResultMatch.Exact;
  }
}
