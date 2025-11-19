import * as Contracts from 'azure-devops-node-api/interfaces/TestInterfaces';
import { expect } from "chai";
import path from "path";
import sinon from "sinon";
import * as tl from "azure-pipelines-task-lib/task";
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
  var tlStub : sinon.SinonStubbedInstance<typeof tl>;

  beforeEach(() => {
    logger = new NullLogger();
    ado = sinon.createStubInstance(AdoWrapper);

    // mock task library
    tlStub = sinon.stub(tl);

    testData = new TestResultProcessorResult("project1", <Contracts.TestPlan>{ id: 1});

    subject = new TestRunPublisher(ado, logger);
    subject.buildId = "123";
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
      const rUri = "vstfs://ReleaseManagement/Release/1";
      const eUri = "vstfs://ReleaseManagement/Environment/1";
      const testFiles = ["file1", "file2"];
      console.log(serverUrl);
      var parameters = new TestRunPublisherParameters(serverUrl, accessToken, false, "Dummy", buildId, testFiles, true);
      parameters.releaseUri = rUri;
      parameters.releaseEnvironmentUri = eUri;

      // act
      var subject = await TestRunPublisher.create(parameters);

      // assert
      expect(subject).not.to.be.undefined;
      expect(subject.dryRun).eq(false);
      expect(subject.testRunTitle).eq("Dummy");
      expect(subject.buildId).eq("123");
      expect(subject.testFiles.length).eq(2);
      expect(subject.releaseUri).eq(rUri);
      expect(subject.releaseEnvironmentUri).eq(eUri);
      expect(subject.failTaskOnUnmatchedTestCases).eq(true);
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
      expect(ado.createTestRun.calledWith( "project1", 1, [1,2], "123")).eq(true);
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
      var result = await subject.publishTestRun(testData);

      // assert
      expect(ado.updateTestRun.calledWithMatch(
        "project1",
        sinon.match({
          name: "MyTestRun"
        })
      )).eq(true);
    })

    context("With Classic Release Information available", () => {

      it("Should include release information in the test run", async () => {
        // arrange
        let buildId = "123";
        let rUri = "vstfs://ReleaseManagement/Release/1";
        let eUri = "vstfs://ReleaseManagement/Environment/1";
        subject.buildId = buildId;
        subject.releaseUri = rUri;
        subject.releaseEnvironmentUri = eUri;
  
        // act
        var result = await subject.publishTestRun(testData);

        // assert
        expect(ado.createTestRun.calledWith( "project1", 1, [1,2], buildId, rUri, eUri )).eq(true);
      })
    })
  })  

  it("Should attach testrun files to the testRun", async () => {
    // arrange
    let file = path.join(__dirname, "data/xunit/xunit-1.xml");
    subject.testFiles = [ file ];
    
     // setup testdata
     testData.matches.set(/*testpoint*/ 1, testUtil.newTestFrameworkResult());
     testData.matches.set(/*testpoint*/ 2, testUtil.newTestFrameworkResult());

    // expect that a test run will be created and returns objects for our testdata
    setupTestRun( /*runid*/ 400);
    setupTestCaseResults( [1,2] );    

    // act
    var result = await subject.publishTestRun(testData);

    // assert
    expect(ado.attachTestRunFiles.calledOnce);
  })

  it("Should attach test attachments to testcase results", async () => {
    // arrange
    for(var i = 1; i <= 2; i++) {
      let testResult = testUtil.newTestFrameworkResult();
      testResult.attachments.push( { name: "attachment" + i, path: "path" + i });
      testData.matches.set(i, testResult);
    }

    // expect that a test run will be created and returns objects for our testdata
    setupTestRun( /*runid*/ 400);
    setupTestCaseResults( [1,2] );   

    // act
    var result = await subject.publishTestRun(testData);

    // assert
    expect(ado.attachTestResultFiles.calledWith("project1", 400, 100001, "attachment1", "path1")).eq(true);
    expect(ado.attachTestResultFiles.calledWith("project1", 400, 100002, "attachment2", "path2")).eq(true);
  })

  it("Should fail if there were not any matched testcases", async function() {
    // arrange
    // act / assert
    await testUtil.shouldThrowAsync(async () => { return subject.publishTestRun(testData)}, "Couldn't create a TestRun for this TestPlan because the test results could not be correlated to any known TestCases.")
  });

  it("Should allow no matched testcases if failTaskOnUnmatchedTestCases is false", async () => {
    // arrange
    subject.failTaskOnUnmatchedTestCases = false;

    // act
    let result = await subject.publishTestRun(testData);

    // assert
    expect(result).to.be.undefined;
  });

  it("Should set output variables when test run is published", async () => {
    // arrange
    testData.matches.set(/*testpoint*/ 1, testUtil.newTestFrameworkResult());
    setupTestRun( /*runid*/ 400);
    setupTestCaseResults( [1] );

    // act
    var result = await subject.publishTestRun(testData);

    // assert
    expect(tlStub.setVariable.calledWith("TestRunId", "400", false, true)).eq(true);
    expect(tlStub.setVariable.calledWith("TestRunUrl", result?.webAccessUrl, false, true)).eq(true);
  })

  function setupTestRun(runId: number) {
    ado.createTestRun.callsFake( (prjId, plnId, points) => {

      let testRun = <Contracts.TestRun>{
        id: runId
      };

      return Promise.resolve(testRun);
    })

    ado.updateTestRun.callsFake( (prjId, tr: Contracts.TestRun) => {
      tr.webAccessUrl = `https://dev.azure.com/fake/${tr.id}`;
      return Promise.resolve(tr);
    });
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