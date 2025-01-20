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

    // setup test data
    var testResult1 = new TestFrameworkResult("First","PASS");
    testResult1.properties.set("TestCase","1000");

    var testResult2 = new TestFrameworkResult("Second","PASS");
    testResult2.properties.set("TestCase","2000");

    var testResult3 = new TestFrameworkResult("Third","PASS");
    testResult3.properties.set("TestCase","3000");

    testresults = [ testResult1, testResult2, testResult3];

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

  context("Multiple Matches", () => {

    it("Should log an issue when multiple matches are found", async () => {
      // arrange
      subject = new TestResultProcessor( [ new AlwaysMatch() ], ctx);
      subject.logger = sinon.createStubInstance(Logger);

      // act
      var result = await subject.process(testresults);

      // assert
      sinon.assert.called(subject.logger.warn as sinon.SinonSpy);
      expect(result.matches.size).to.eq(0);
    })

  })

})

class AlwaysMatch implements TestResultMatchStrategy {
  isMatch(result: TestFrameworkResult, point: TestPoint): TestResultMatch {
    return TestResultMatch.Exact;
  }
}
