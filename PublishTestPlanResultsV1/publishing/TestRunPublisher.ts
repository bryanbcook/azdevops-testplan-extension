import * as Contracts from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestResultProcessorResult } from "../processing/TestResultProcessor";
import { TestRunPublisherParameters } from "./TestRunPublisherParameters";
import { AdoWrapper } from "../services/AdoWrapper";
import { ILogger, getLogger } from "../services/Logger";
import { TestFrameworkResult } from "../framework/TestFrameworkResult";

export class TestRunPublisher {

  static async create( parameters : TestRunPublisherParameters) : Promise<TestRunPublisher> {
    var ado = await AdoWrapper.createInstance(parameters.collectionUri, parameters.accessToken);
    var logger = getLogger();

    var publisher = new TestRunPublisher(ado, logger);
    publisher.buildId = parameters.buildId;
    publisher.dryRun = parameters.dryRun;
    publisher.testRunTitle = parameters.testRunTitle;

    return publisher;
  }

  private ado : AdoWrapper;
  private logger : ILogger;
  public buildId : string;
  public dryRun : boolean;
  public testRunTitle : string;

  constructor(ado : AdoWrapper, logger : ILogger) {
    this.ado = ado;
    this.logger = logger;
    this.buildId = "";
    this.dryRun = false;
    this.testRunTitle = "PublishTestPlanResults"
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

      this.logger.info(`Creating TestRun for Project: '${projectId}' TestPlan: '${testPlanId}'.`);

      // create a test run for the project + testPlan using testPoint ids
      const points = Array.from(results.matches.keys());
      const testRun = await this.ado.createTestRun(projectId, testPlanId, points, this.buildId);
      
      // obtain the testcaseresult definitions
      var testCaseResults = await this.ado.getTestResults(projectId, testRun.id);

      // update the testcaseresults from our test data
      testCaseResults.forEach( (r)=> {
        let pointId = r.testPoint?.id;
        if (pointId) {
          let frameworkResult = results.matches.get(parseInt(pointId)) as TestFrameworkResult;
          r.outcome = frameworkResult.outcome.toString(); // sends integer value to API which is supported
          r.errorMessage = frameworkResult.failure;
          r.stackTrace = frameworkResult.stacktrace;
          r.state = "Completed";
        } else {
          // should never happen because we created the testrun with test points
          this.logger.warn(`TestCaseResult id  '${r.id}' does not have a valid test point.`);
        }        
      });

      // update the testcaseresults
      var updatedResults = await this.ado.updateTestResults(projectId, testRun.id, testCaseResults);

      // finalize the testrun
      testRun.state = "Completed";
      testRun.name = this.testRunTitle;
      var finalRun = await this.ado.updateTestRun(projectId, testRun);

      return finalRun;
    } else {
      throw new Error("Couldn't create a TestRun for this TestPlan because the test results could not be correlated to any known TestCases.");
    }
  }
}