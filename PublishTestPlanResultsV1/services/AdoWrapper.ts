
import * as ado from "azure-devops-node-api";
import * as Contracts from 'azure-devops-node-api/interfaces/TestInterfaces'
import { ClientApiBase } from "azure-devops-node-api/ClientApiBases";
import { ICoreApi } from "azure-devops-node-api/CoreApi";
import { ITestApi } from "azure-devops-node-api/TestApi";
import * as fs from "fs";
import path from "path";
import { ILogger, getLogger } from "./Logger";

interface AdoResponseHeaders {
  "x-ms-continuationtoken"? : string;
}

/* 
  azure-devops-node-api 2022.1 does not include the TestPlan interface.
  TestPlanInterfaces.TestPoint includes a testCaseReference property instead of testCase.
  this is a temporary workaround until this issue is corrected in the node api
*/
export interface TestPoint2 extends Contracts.TestPoint {
  testCaseReference : Contracts.WorkItemReference
}

export class AdoWrapper {

  static async createInstance(server : string, accessToken : string) : Promise<AdoWrapper> {
    let handler = ado.getPersonalAccessTokenHandler(accessToken);
    let connection = new ado.WebApi(server, handler);
    let coreApi = await connection.getCoreApi();
    let testApi = await connection.getTestApi();
    let logger = getLogger();
    return new AdoWrapper(coreApi, testApi, logger);
  }

  coreApi : ICoreApi;
  testApi : ITestApi;
  logger : ILogger;
  
  constructor(coreApi : ICoreApi, testApi : ITestApi, logger : ILogger) {
    this.coreApi = coreApi;
    this.testApi = testApi;
    this.logger = logger;
  }

  /**
   * Resolves the project id for an azure devops project
   * 
   * @param projectName name of the azure devops project
   * @returns the unique identifier for the project
   */
  async getProjectId(projectName: string): Promise<string> {
    this.logger.debug(`getProjectId:${projectName}`);

    var project = await this.coreApi.getProject(projectName);
    if (project) {
      return project.id!.toString();
    }
    
    throw new Error(`Project '${projectName}' was not found.`);
  }

  /**
   * Resolves a list of available Test Plans for an azure devops project
   * 
   * @param projectName project name or project identifier
   * @returns returns a list of TestPlan objects
   */
  async getTestPlans(projectName: string): Promise<Contracts.TestPlan[]> {
    this.logger.debug(`getTestPlans projectName:${projectName}`);
    
    const baseUrl = `${this.testApi.vsoClient.baseUrl}/${projectName}/_apis/testplan/plans?includePlanDetails=true`;
    return this.fetchWithPagination<Contracts.TestPlan>(this.testApi, baseUrl, Contracts.TypeInfo.TestPlan);
  }

  /**
   * Resolves a list of available Test Configurations for an azure devops project
   * 
   * @param projectName project name or project identifier
   * @returns returns a list of TestConfiguration objects
   */
  async getTestConfigurations(projectName: string): Promise<Contracts.TestConfiguration[]> {
    this.logger.debug(`getTestConfigurations projectName:${projectName}`);

    const url = `${this.testApi.vsoClient.baseUrl}/${projectName}/_apis/testplan/configurations?api-version=7.1`;
    return this.fetchWithPagination<Contracts.TestConfiguration>(this.testApi, url, Contracts.TypeInfo.TestConfiguration);
  }

  /**
   * Resolves a list of Test Points for a specific TestPlan + TestSuite
   * 
   * You can resolve all TestPoint objects for a TestPlan by obtaining the "root test suite" and specifying the
   * recurse flag
   * 
   * This includes all available points. Filtering for unwanted configurations is performed externally.
   * 
   * @param projectId project name or identifier
   * @param testPlanId test plan id
   * @param testSuiteId test suite id
   * @param recursive returns all points for contained sub-suites
   * @returns returns a list of TestPoint objects
   */
  async getTestPointsForSuite(projectId : string, testPlanId : string, testSuiteId : string, recursive : boolean = false) : Promise<TestPoint2[]> {
    this.logger.debug(`getTestPointsForSuite projectId:${projectId} testPlanId:${testPlanId} testSuiteId:${testSuiteId} recursive:${recursive}`);

    // 2022.1 does not yet include the TestPlan interface
    // testPlan api supports a recursive query
    var url = `${this.testApi.vsoClient.baseUrl}/${projectId}/_apis/testplan/Plans/${testPlanId}/Suites/${testSuiteId}/TestPoint?api-version=7.1&includePointDetails=true&isRecursive=${recursive.toString()}`
    return this.fetchWithPagination<TestPoint2>(this.testApi, url, Contracts.TypeInfo.TestCaseReference2);
  }

  async getTestCasesForSuite(projectId : string, testPlanId : string, testSuiteId : string, recursive : boolean = false) : Promise<any[]> {
    this.logger.debug(`getTestCasesForSuite projectId:${projectId} testPlanId:${testPlanId} testSuiteId:${testSuiteId} recursive:${recursive}`);

    var witFields = "Microsoft.VSTS.TCM.AutomationStatus,Microsoft.VSTS.TCM.AutomatedTestName";

    // https://github.com/bryanbcook/azdevops-testplan-extension/issues/83
    // Version azure-devops-node-api 12.1.0 does not have the TestPlan interface
    // Version 12.1.1 supports ITestPlanApi.getTestCaseList(project, planId, suiteId, witFields?, recursive?)
    // current implementation uses the rest api and custom pagination.
    var url = `${this.testApi.vsoClient.baseUrl}/${projectId}/_apis/testplan/Plans/${testPlanId}/Suites/${testSuiteId}/TestCase?api-version=7.1&expand=false&isRecursive=${recursive.toString()}&witFields=${witFields}`;
    return this.fetchWithPagination<any>(this.testApi, url, Contracts.TypeInfo.TestCaseReference2);    
  }

  /**
   * Create a TestRun in a TestPlan for a given set of TestPoints
   * 
   * @param projectId project name or identifier
   * @param testPlanId test plan id
   * @param testPoints array of testpoint ids
   * @param buildId build identifier
   * @param releaseUri url to the release
   * @param releaseEnvironmentUri url to the release environment
   * @returns returns the resulting TestRun from the operation
   */
  async createTestRun(projectId : string, testPlanId : number, testPoints : number[], buildId : string, releaseUri? : string, releaseEnvironmentUri? : string) : Promise<Contracts.TestRun> {
    this.logger.debug(`createTestRun projectId:${projectId} testPlanId:${testPlanId} testPoints: (${testPoints.length} items) - buildId:${buildId}`);

    let testRun : Contracts.RunCreateModel = {
      automated: true,
      name: "PublishTestPlanResults",
      plan: <Contracts.ShallowReference>{
        id: testPlanId.toString()
      },
      build: <Contracts.ShallowReference>{
        id: buildId,
      },
      releaseUri: releaseUri,
      releaseEnvironmentUri: releaseEnvironmentUri,
      pointIds: testPoints,
      /* this property is required because it's not optional in the typescript def */
      configurationIds: []
    };

    return await this.testApi.createTestRun(testRun, projectId);
  }

  /**
   * Attaches files to a TestRun
   * 
   * @param projectId project identifier
   * @param testRunId test plan id
   * @param files array of files to attach to the test run
   */
  async attachTestRunFiles(projectId : string, testRunId : number, files : string[]) : Promise<void> {
    this.logger.debug(`attachTestRunFiles projectId:${projectId} testRunId:${testRunId} files: (${files.length} items)`);

    for (let file of files) {
      this.logger.debug(`attaching file: ${file}`);
      try {
        let attachment = await this.createAttachment(file);
        await this.testApi.createTestRunAttachment(attachment, projectId, testRunId);
      } catch (error) {
        this.logger.warn(`failed to attach testrun attachment: ${file} - ${error}`);
      }      
    }
  }

  /**
   * Attaches files to a TestCaseResult within a TestRun
   * @param projectId 
   * @param testRunId 
   * @param testCaseResultId 
   * @param fileName 
   * @param filePath 
   */
  async attachTestResultFiles(projectId : string, testRunId : number, testCaseResultId : number, fileName : string, filePath : string) : Promise<void> {
    this.logger.debug(`attachTestResultFiles projectId:${projectId} testRunId:${testRunId} testCaseResultId:${testCaseResultId} fileName:${fileName} filePath:${filePath}`);

    try {
      let attachment = await this.createAttachment(filePath, fileName);
      await this.testApi.createTestResultAttachment(attachment, projectId, testRunId, testCaseResultId);
    } catch (error) {
      this.logger.warn(`failed to attach testresult attachment: ${fileName} - ${error}`);
    }
  }

  /**
   * Resolve the TestResults for a given TestRun
   * 
   * node api can retrieve 1000 items at a time when no options specified, 200 otherwise.
   * 
   * @param projectId project name or identifier
   * @param testRunId test plan id
   * @returns returns a list of TestCaseResult objects
   */
  async getTestResults(projectId : string, testRunId : number) : Promise<Contracts.TestCaseResult[]> {
    this.logger.debug(`getTestResults projectId:${projectId} testRunId:${testRunId}`);

    const batchSize = 200;
    var index = 0;
    var done = false;
    const results : Contracts.TestCaseResult[] = [];

    do {
      let skip = batchSize * index;
      this.logger.debug(`${index}: getTestResults projectId:${projectId} testRunId:${testRunId} skip:${skip}`);
      
      var items = await this.testApi.getTestResults(projectId, testRunId, undefined, skip, batchSize, undefined);

      if (items.length > 0) {
        results.push(...items);
      }

      index++;

      done = (items.length == 0 || items.length < batchSize);

    } while(!done)
    
    return results;
  }

  /**
   * Updates the outcomes for TestCaseResult for a given TestRun
   * 
   * The TestCaseResult identifiers must match the existing items in the TestRun
   * 
   * @param projectId project name or identifier
   * @param testRunId test plan id
   * @param testCaseResults list of objects to update in the testplan
   * @returns the updated TestCaseResult objects
   */
  async updateTestResults(projectId : string, testRunId : number, testCaseResults : Contracts.TestCaseResult[]) : Promise<Contracts.TestCaseResult[]> {
    this.logger.debug(`updateTestResults projectId:${projectId} testRunId:${testRunId} testCaseResults: (${testCaseResults.length} items)`);

    // what's the upper limit on the number of testcases that can be added?
    return await this.testApi.updateTestResults(testCaseResults, projectId, testRunId);
  }

  /**
   * Updates the TestRun details
   * 
   * Note that not all properties in the TestRun are updated.
   * 
   * @param projectId project id or identifier
   * @param testRun testRun details
   * @returns the updated TestRun object
   */
  async updateTestRun(projectId : string, testRun : Contracts.TestRun) : Promise<Contracts.TestRun> {
    this.logger.debug(`updating TestRun (state=${testRun.state})`);
    let updateModel = <Contracts.RunUpdateModel>{ 
      build: testRun.build,
      comment: testRun.comment,
      name: testRun.name,
      state: testRun.state 
    };
    return await this.testApi.updateTestRun(updateModel, projectId, testRun.id);
  }

  private async fetchWithPagination<T>(api : ClientApiBase, baseUrl : string, responseType : any) : Promise<T[]> {
    const results : T[] = [];
    var continuationToken;
    let index = 0;

    do {
      let url : string = continuationToken ? `${baseUrl}&continuationToken=${continuationToken}` : baseUrl;
      this.logger.debug(`${index++}: fetchWithPagination ${url}`)
      var res = await this.testApi.rest.get(url);
      let items = this.testApi.formatResponse(res.result, responseType, true);

      if (items) {
        results.push(...items);
      }

      continuationToken = (res.headers as AdoResponseHeaders)["x-ms-continuationtoken"];
    } while(continuationToken !== undefined)

    return results;
  }

  private async createAttachment(filePath : string, fileName? : string) : Promise<Contracts.TestAttachmentRequestModel> {
    // ensure testfile or testattachment has filename
    if (fileName == undefined || fileName.length == 0){
      fileName = path.basename(filePath);
    }    
    const data = await fs.promises.readFile(filePath);
    let fileContent = Buffer.from(data).toString("base64");
    return {
      fileName: fileName,
      stream: fileContent,
      attachmentType: Contracts.AttachmentType.GeneralAttachment.toString()
    } as Contracts.TestAttachmentRequestModel;
  }
}