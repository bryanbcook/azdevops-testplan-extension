import * as Contracts from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestAttachment, TestFrameworkResult } from "../framework/TestFrameworkResult";
import { TestRunPublisherParameters } from "./TestRunPublisherParameters";
import { TestResultProcessorResult } from "../processing/TestResultProcessor";
import { AdoWrapper } from "../services/AdoWrapper";
import { ILogger, getLogger } from "../services/Logger";

export class TestRunPublisher {

  static async create( parameters : TestRunPublisherParameters) : Promise<TestRunPublisher> {
    var ado = await AdoWrapper.createInstance(parameters.collectionUri, parameters.accessToken);
    var logger = getLogger();

    var publisher = new TestRunPublisher(ado, logger);
    publisher.buildId = parameters.buildId;
    publisher.dryRun = parameters.dryRun;
    publisher.releaseUri = parameters.releaseUri;
    publisher.releaseEnvironmentUri = parameters.releaseEnvironmentUri;
    publisher.testRunTitle = parameters.testRunTitle;
    publisher.testFiles = parameters.testFiles;

    return publisher;
  }

  private ado : AdoWrapper;
  private logger : ILogger;
  public buildId : string;
  public dryRun : boolean;
  public releaseUri? : string;
  public releaseEnvironmentUri? : string;
  public testRunTitle : string;
  public testFiles : string[];

  constructor(ado : AdoWrapper, logger : ILogger) {
    this.ado = ado;
    this.logger = logger;
    this.buildId = "";
    this.dryRun = false;
    this.testRunTitle = "PublishTestPlanResults"
    this.testFiles = [];
  }

  async publishTestRun( results : TestResultProcessorResult) : Promise<Contracts.TestRun | undefined> {

    if (this.dryRun) {
      this.logger.info("Property 'dryRun' enabled. Skipping publishing results.");
      return Promise.resolve(undefined);
    }

    this.logger.debug("Publishing test results...");

    if (results.matches.size > 0) {

      const testPlanId = results.testPlan.id;
      const projectId = results.projectId;

      this.logger.debug(`Creating TestRun for Project: '${projectId}' TestPlan: '${testPlanId}'.`);

      // create a test run for the project + testPlan using testPoint ids
      const points = Array.from(results.matches.keys());
      const testRun = await this.ado.createTestRun(projectId, testPlanId, points, this.buildId, this.releaseUri, this.releaseEnvironmentUri);
      
      // obtain the testcaseresult definitions
      var testCaseResults = await this.ado.getTestResults(projectId, testRun.id);

      const testAttachments = new Map<number, TestAttachment[]>();

      // update the testcaseresults from our test data
      testCaseResults.forEach( (r)=> {
        let pointId = r.testPoint?.id;
        if (pointId) {
          let frameworkResult = results.matches.get(parseInt(pointId)) as TestFrameworkResult;
          r.outcome = frameworkResult.outcome.toString(); // sends integer value to API which is supported
          r.durationInMs = frameworkResult.duration;
          r.errorMessage = frameworkResult.failure;
          r.stackTrace = frameworkResult.stacktrace;
          r.state = "Completed";

          if (frameworkResult.hasAttachments()) {
            testAttachments.set(r.id!, frameworkResult.attachments);
          }
        } else {
          // should never happen because we created the testrun with test points
          this.logger.warn(`TestCaseResult id  '${r.id}' does not have a valid test point.`);
        }        
      });

      // update the testcaseresults
      this.logger.info(`Publishing test results to test run '${testRun.id}'`);
      var updatedResults = await this.ado.updateTestResults(projectId, testRun.id, testCaseResults);

      // add testRun attachments
      await this.ado.attachTestRunFiles(projectId, testRun.id, this.testFiles)
      await this.uploadAttachments(projectId, testRun.id, testAttachments);

      // finalize the testrun
      testRun.state = "Completed";
      testRun.name = this.testRunTitle;
      var finalRun = await this.ado.updateTestRun(projectId, testRun);

      this.logger.info(`Published Test Run: ${testRun.webAccessUrl}`)

      return finalRun;
    } else {
      throw new Error("Couldn't create a TestRun for this TestPlan because the test results could not be correlated to any known TestCases.");
    }
  }

  private async uploadAttachments(projectId: string, testRunId: number, attachments: Map<number, TestAttachment[]>): Promise<void> {
    // capture start time for performance measurement
    var startTime = Date.now();
    var attachmentsCount = 0;

    if (attachments.size > 0) {
      this.logger.info(`Identified ${attachments.size} test results with attachments.`);

      // async upload of attachments
      // TODO: Future enable via feature flag
      // bug: does not await on main thread
      // attachments.forEach( async (attachments, testCaseResultId) => {
      //   attachments.forEach( async (attachment) => {
      //     await this.ado.attachTestResultFiles(projectId, testRunId, testCaseResultId, attachment.name, attachment.path);
      //   })
      // });

      // sequential upload attachments
      for (const [testCaseResultId, testAttachments] of attachments.entries()) {
        for (const attachment of testAttachments) {
          attachmentsCount++;
          await this.ado.attachTestResultFiles(projectId, testRunId, testCaseResultId, attachment.name, attachment.path);
        }
      }

      var elapsed = Date.now() - startTime;
      this.logger.info(`Uploaded ${attachmentsCount} attachments in ${elapsed} ms.`);
    }
  }
}