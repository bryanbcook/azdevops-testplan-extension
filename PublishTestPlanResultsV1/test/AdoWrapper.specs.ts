import { expect } from "chai";
import sinon from "sinon";
import path from "path";
import * as Contracts from 'azure-devops-node-api/interfaces/TestInterfaces'
import * as testUtil from './testUtil';
import { AdoWrapper } from "../services/AdoWrapper";

describe("AdoWrapper", () => {

  var projectName : string;
  var projectId : string;
  var tfsCollectionUri : string;
  var accessToken : string;
  var planId : string;
  var rootSuite : string;

  var subject : AdoWrapper;

  before(async function() {

    // fetch integration test parameters from build pipeline or vscode settings.json "mochaExplorer.env"
    projectName = process.env.TEAMPROJECT as string;
    projectId = process.env.TEAMPROJECTID as string;
    tfsCollectionUri = process.env.SYSTEM_COLLECTIONURI as string;
    accessToken = (process.env.ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN ?? process.env.SYSTEM_ACCESSTOKEN) as string;
    planId = process.env.TESTPLANID as string;
    rootSuite = process.env.TESTROOTSUITE as string;

    console.log(`Project Name: ${projectName}`);
    console.log(`Project Id: ${projectId}`);
    console.log(`Collection Uri: ${tfsCollectionUri}`);
    console.log(`Access Token: ${accessToken}`);
    console.log(`Plan ID: ${planId}`);
    console.log(`Root Suite: ${rootSuite}`);

  })

  beforeEach(async () => {
    // instantiating the ado api makes calls to the server,
    // so the url + authentication values must be valid
    subject = await AdoWrapper.createInstance(tfsCollectionUri, accessToken);
  })

  afterEach(() => {
    sinon.restore();
  })

  context('Integration Tests', () => {

    // integration test
    it("Should be able to resolve the project name", async function () {
      // arrange
      this.timeout(10000);

      // act
      let projectId = await subject.getProjectId(projectName);

      // assert
      expect(projectId).eq(projectId);
    })

    // integration test
    it("Should throw error if project name does not exist", async function () {
      // arrange
      this.timeout(10000);
      // act / assert
      await testUtil.shouldThrowAsync(async () => { return subject.getProjectId("asdasdf")}, "Project 'asdasdf' was not found.");
    });

    // integration test
    it("Should fetch all available test plans", async function () {
      // arrange
      this.timeout(10000);
      var result = await subject.getTestPlans(projectName);

      // assert
      expect(result.length).greaterThan(0);
    });

    // integration test
    it("Should should include dates for test plans", async function () {
      // arrange
      this.timeout(10000);
      var result = await subject.getTestPlans(projectName);

      // assert
      expect(result[0].startDate).not.undefined;
      expect(result[0].endDate).not.undefined;
    });

    // integration test
    it("Should fetch all test configuration objects", async function () {
      // arrange
      this.timeout(10000);
      // act
      var result = await subject.getTestConfigurations(projectName);
      // assert
      expect(result.length).greaterThan(0);
    });

    // integration test
    it("Should fetch all test points in a testplan", async function () {
      // arrange
      this.timeout(10000);
      // act
      var result = await subject.getTestPointsForSuite(projectId, planId, rootSuite, true);
      // assert
      expect(result.length).greaterThan(0);
    });
  })  

  // unit test / stub out rest get
  it("Should paginate to get all test plans if needed", async function () {
    // arrange
    stubGetRequestWithContinuationToken("Test Plan"); // paginate 10 results x2
    // act
    var result = await subject.getTestPlans("dummy");
    // assert
    expect(result.length).eq(20);
  });

  // unit test / stub out rest get
  it("Should paginiate to get all test configurations if needed", async function () {
    // arrange
    stubGetRequestWithContinuationToken("Test Configuration"); // paginate 10 results x2
    // act
    var result = await subject.getTestConfigurations(projectName);
    // assert
    expect(result.length).eq(20);
  });

  // unit test / stub out rest get
  it("Should paginate to fetch all test points", async function () {
    // arrange
    stubGetRequestWithContinuationToken("Test Case"); // paginate 10 results x2
    // act
    var result = await subject.getTestPointsForSuite(projectId, planId, rootSuite, true);
    // assert
    expect(result.length).eq(20);
  });

  // it("Should create a testrun", async function () {
  //   // arrange
  //   // this.timeout(10000);

  //   // var data = new TestResultProcessorResult(projectId, <any>{ id: parseInt(planId)});
  //   // data.matches.set(5, new TestFrameworkResult("", "PASS"));
  //   // data.matches.set(11, new TestFrameworkResult("", "PASS"));

  //   // var result = await subject.createTestRun(projectId, parseInt(planId), Array.from(data.matches.keys()));
  //   // console.log(result);
  //   // console.log(result.id);

  //   var results = await subject.getTestResults(projectId, 466);

  //   // const createTestRunStub = sinon.stub(subject.testApi.rest, "create");
  //   // createTestRunStub.callsFake( (url, testRun, options?) => {

  //   //   let response : any = {
  //   //     result : [],
  //   //     headers : {}
  //   //   }

  //   //   return Promise.resolve(response);
  //   // })

  //   // // act
  //   // // assert
  //   // throw new Error("Not implemented");
  // });

  // unit / stub out testApi
  it("Should batch retrieve testcaseresults from testplan", async () => {
    // arrange
    const getTestResultsStub = sinon.stub(subject.testApi, "getTestResults");
    getTestResultsStub.callsFake( (prj, runId, d, skip, top, o) => {

      var items : Contracts.TestCaseResult[] = [];
      var resultsToReturn = 200;
      if (skip! == 400) {
        resultsToReturn = 20;
      }

      for(let i = 0; i < resultsToReturn; i++) {
        let item = <Contracts.TestCaseResult>{
          id: 100000 + i + skip!
        }
        items.push(item);
      }

      return Promise.resolve(items);
    });

    // act
    const results = await subject.getTestResults(projectId, 400);

    // assert
    expect(results.length).eq(420);
  })

  // it("Should batch update testplan results", async function () {
  //   // arrange

  //   // act
  //   // assert
  //   throw new Error("Not implemented");
  // });

  context("TestRun Attachments", () => {

    const basePath = path.join(__dirname, "data/xunit");
    let files : Array<string> = [];

    beforeEach(() => {
      files = [];
      files.push(path.join(basePath, "xunit-1.xml"));
    })

    // unit test / stub out testApi
    it("Should send base64 encoded file contents when attaching testrun files", async () => {
      // arrange
      const createAttachmentStub = sinon.stub(subject.testApi, "createTestRunAttachment");
      
      // act
      await subject.attachTestRunFiles(projectId, 400, files);
  
      // assert
      // verify that attachment stream is base64 encoded
      let callArgs = createAttachmentStub.getCall(0).args;
      expect(callArgs[0].stream).not.to.be.empty;
    })

    // unit test / stub out testApi
    it("Should allow multiple testRun attachments", async () => {
      // arrange
      files.push(path.join(basePath, "xunit-2.xml"));
      const createAttachmentStub = sinon.stub(subject.testApi, "createTestRunAttachment");

      // act
      await subject.attachTestRunFiles(projectId, 400, files);

      // assert
      expect(createAttachmentStub.getCalls().length).to.be.eq(2);
    })

    // unit test / stub out testApi
    it("Should send file name when attaching testrun files", async () => {
      // arrange
      const createAttachmentStub = sinon.stub(subject.testApi, "createTestRunAttachment");
      
      // act
      await subject.attachTestRunFiles(projectId, 400, files);
  
      // assert
      // verify that attachment stream is base64 encoded
      let callArgs = createAttachmentStub.getCall(0).args;
      expect(callArgs[0].fileName).to.be.eq("xunit-1.xml");
    })

    it("Should log failures if attachment fails", async () => {
      // arrange
      const createAttachmentStub = sinon.stub(subject.testApi, "createTestRunAttachment");
      const loggerWarningStub = sinon.stub(subject.logger, "warn");

      createAttachmentStub.throws(new Error("Attachment failed"));

      // act
      await subject.attachTestRunFiles(projectId, 400, files);

      // assert
      expect(loggerWarningStub.calledOnce).to.be.true;
    })

  })


  function stubGetRequestWithContinuationToken(nameFormat : string) {
    const getRequestStub = sinon.stub(subject.testApi.rest, "get");
    getRequestStub.callsFake( (url) => {

      let response : any = {
        result : [],
        headers : {}
      }

      let startIndex : number = 0;

      if (url.indexOf("&continuationToken=") == -1) {

        // add in the continuation token
        response.headers['x-ms-continuationtoken'] = "value-for-continuation-token";

      } else {
        startIndex = 10;
      }

      for(let i=startIndex; i < startIndex+10; i++) {
        response.result.push(<any>{ id: i, name: `${nameFormat} ${i}`});
      }

      return Promise.resolve(response);
    });
  }

})