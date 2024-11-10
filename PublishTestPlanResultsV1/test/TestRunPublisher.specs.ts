import * as Contracts from 'azure-devops-node-api/interfaces/TestInterfaces';
import { expect } from "chai";
import path from "path";
import sinon from "sinon";
import { TestResultProcessorResult } from "../processing/TestResultProcessor";
import { TestRunPublisher } from "../publishing/TestRunPublisher";
import { TestRunPublisherParameters } from "../publishing/TestRunPublisherParameters";
import { ILogger, NullLogger, getLogger } from "../services/Logger";
import { AdoWrapper } from "../services/AdoWrapper";
import * as testUtil from './testUtil';

context("TestRunPublisher", () => {

  var logger : ILogger
  var ado : sinon.SinonStubbedInstance<AdoWrapper>;
  var testData : TestResultProcessorResult;
  var subject : TestRunPublisher;

  beforeEach(() => {
    logger = new NullLogger();
    ado = sinon.createStubInstance(AdoWrapper);

    testData = new TestResultProcessorResult("project1", <Contracts.TestPlan>{ id: 1});

    subject = new TestRunPublisher(ado, logger);
  })

  afterEach(() => {
    sinon.restore();
  })

  // it("should be able to create, populate and complete a testrun", async () => {
  //   // arrange
  //   const projectName = process.env.SYSTEM_TEAMPROJECT as string;
  //   const projectId = process.env.SYSTEM_TEAMPROJECTID as string;
  //   const tfsCollectionUri = process.env.SYSTEM_COLLECTIONURI as string;
  //   const accessToken = process.env.SYSTEM_ACCESSTOKEN as string;
  //   const planId = process.env.TESTPLANID as string;

  //   var data = new TestResultProcessorResult(projectId, <any>{ id: parseInt(planId)});
  //   data.matches.set(5, new TestFrameworkResult("", "PASS"));
  //   data.matches.set(11, new TestFrameworkResult("", "PASS"));

  //   // act
  //   var ado = await AdoWrapper.createInstance(tfsCollectionUri, accessToken);
  //   subject = new TestRunPublisher(ado, getLogger());
  //   var result = await subject.publishTestRun(data);

  //   console.log(result);
  // });

  context("static factory", () => {

    // integration test
    it("Should initialize publisher from parameters", async function () {
      // arrange
      // this resolves endpoint information from the server, so values must be present
      this.timeout(10000);
      const serverUrl = process.env.SYSTEM_COLLECTIONURI as string;
      const accessToken = (process.env.SYSTEM_ACCESSTOKEN ?? process.env.ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN) as string;
      const buildId = "123";
      const testFiles = ["file1", "file2"];
      console.log(serverUrl);
      var parameters = new TestRunPublisherParameters(serverUrl, accessToken, false, "Dummy", buildId, testFiles);

      // act
      var subject = await TestRunPublisher.create(parameters);

      // assert
      expect(subject).not.to.be.undefined;
      expect(subject.dryRun).eq(false);
      expect(subject.testRunTitle).eq("Dummy");
      expect(subject.buildId).eq("123");
      expect(subject.testFiles.length).eq(2);
    })

  })

  context("Publishing disabled", () => {
    
    it("Should not publish results if dryrun is enabled", async () => {
      // arrange
      subject.dryRun = true;

      // act
      var results = await subject.publishTestRun(testData);

      // act
      expect(results).to.be.undefined;
    });
  })

  context("With Matching Test Results", () => {
    beforeEach(() => {
      // arrange
      // setup testdata
      testData.matches.set(/*testpoint*/ 1, testUtil.newTestFrameworkResult());
      testData.matches.set(/*testpoint*/ 2, testUtil.newTestFrameworkResult());  

      // expect that a test run will be created and returns objects for out testdata
      setupTestRun( /*runid*/ 400);
      setupTestCaseResults( [1,2] );
    })

    it("Should create TestRun for all matching test points", async function() {
      // arrange
      // act
      var result = await subject.publishTestRun(testData);
      
      // assert
      expect(ado.createTestRun.calledWith( "project1", 1, [1,2])).eq(true);
      expect(ado.updateTestResults.calledOnce).eq(true);
    })

    it("Should set test outcomes for test points", async function() {
      // arrange
      // act
      var result = await subject.publishTestRun(testData);

      // assert
      expect(ado.updateTestResults.calledWith(
        "project1",
        400,
        [
          <Contracts.TestCaseResult>{
            id: 100001,
            testPoint: <any>{
              id: "1"
            },
            outcome: "2" /* VERIFY */,
            state: "Completed",
            stackTrace: undefined,
            errorMessage: undefined,
            durationInMs: 1000,
          },
          <Contracts.TestCaseResult>{
            id: 100002,
            testPoint: <any>{
              id: "2"
            },
            outcome: "2" /* VERIFY */,
            state: "Completed",
            stackTrace: undefined,
            errorMessage: undefined,
            durationInMs: 1000,
          },
        ]
      )).eq(true);
    });
  
    it("Should mark the TestRun as completed", async function() {
      // arrange
      // act
      var result = await subject.publishTestRun(testData);

      // assert
      expect(ado.updateTestRun.calledWithMatch(
        "project1", 
        sinon.match({
          state: "Completed"
        })
      )).eq(true)
    })

    it("Should name the test run using the user-supplied value", async () => {
      // arrange
      subject.testRunTitle = "MyTestRun";

      // act
      var assert = await subject.publishTestRun(testData);

      // assert
      expect(ado.updateTestRun.calledWithMatch(
        "project1",
        sinon.match({
          name: "MyTestRun"
        })
      )).eq(true);
    })
  })

  it("Should fail if there were not any matched testcases", async function() {
    // arrange
    // act / assert
    await testUtil.shouldThrowAsync(async () => { return subject.publishTestRun(testData)}, "Couldn't create a TestRun for this TestPlan because the test results could not be correlated to any known TestCases.")
  });

  function setupTestRun(runId: number) {
    ado.createTestRun.callsFake( (prjId, plnId, points) => {

      let testRun = <Contracts.TestRun>{
        id: 400
      };

      return Promise.resolve(testRun);
    })
  }
  function setupTestCaseResults(points: number[]) {
    ado.getTestResults.callsFake( (prjId, runId) => {

      var results : Contracts.TestCaseResult[] = [];

      for(var point of points) {
        let result = <Contracts.TestCaseResult>{
          id: 100000 + point,
          testPoint: <Contracts.ShallowReference>{
            id: point.toString()
          }
        }
        results.push(result);
      }

      return Promise.resolve(results);
    })
  }

})