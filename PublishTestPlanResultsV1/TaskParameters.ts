import tl = require('azure-pipelines-task-lib/task');
import * as path from "path";
import { configAlias } from "./context/configAlias";
import { TestResultContextParameters } from "./context/TestResultContextParameters";
import { TestFrameworkParameters } from "./framework/TestFrameworkParameters";
import { TestResultProcessorParameters } from './processing/TestResultProcessorParameters';
import { TestRunPublisherParameters } from './publishing/TestRunPublisherParameters';
import { TaskParameterHelper } from './services/TaskParameterHelper';
import { TelemetryPayloadBuilder } from './services/TelemetryPayloadBuilder';
import { StatusFilterParameters } from './services/StatusFilterParameters';
import { TelemetryPublisherParameters } from './telemetry/TelemetryPublisherParameters';
import FeatureFlags, { FeatureFlag } from './services/FeatureFlags';

class TaskParameters {

  tph: TaskParameterHelper
  constructor(tph: TaskParameterHelper) {
    this.tph = tph;
  }

  static getInstance() : TaskParameters {
    const telemetryPayloadBuilder = new TelemetryPayloadBuilder();
    const tph = new TaskParameterHelper(telemetryPayloadBuilder);
    return new TaskParameters(tph);
  }

  /* Fetch the parameters used to obtain the working details for the ADO Test Plan */
  getTestContextParameters(): TestResultContextParameters {
    tl.debug("reading TestContextParameters from task inputs.");

    const accessToken = tl.getInput("accessToken", false) ?? tl.getVariable("SYSTEM_ACCESSTOKEN");
    const collectionUri = tl.getInput("collectionUri", false) ?? tl.getVariable("SYSTEM_COLLECTIONURI");
    const projectName = tl.getInput("projectName", false) ?? tl.getVariable("SYSTEM_TEAMPROJECT");

    var parameters = new TestResultContextParameters(
      (collectionUri as string),
      (projectName as string),
      (accessToken as string));

    parameters.testPlan = tl.getInput("testPlan", false);
    parameters.testConfigFilter = tl.getInput("testConfigFilter", false);
    tl.getDelimitedInput("testConfigAliases", ",", false).forEach((alias: string) => {
      let parts = alias.split("=");
      if (parts.length > 1) {
        parameters.testConfigAliases.push(new configAlias(parts[0], parts[1]));
      }
    });

    return parameters;
  }

  /* Fetch the parameters used to parse through automated test results */
  getFrameworkParameters(): TestFrameworkParameters {
    tl.debug("reading TestFrameworkParameters from task inputs.");

  let testResultFormat = tl.getInput("testResultFormat", true);
  let failTaskOnMissingResultsFile = getBoolInput("failTaskOnMissingResultsFile", /*default*/ true);
  let failTaskOnMissingTests = getBoolInput("failTaskOnMissingTests", /*default*/ false);
  let testResultFiles = getTestFiles(failTaskOnMissingResultsFile);

  return new TestFrameworkParameters(testResultFiles, testResultFormat!.toLowerCase(), failTaskOnMissingResultsFile, failTaskOnMissingTests);
}

  /* Fetch the parameters used to process test results and match them to test cases */
  getProcessorParameters() : TestResultProcessorParameters {
    tl.debug("reading TestResultProcessorParameters from task inputs.");

    let matchingStrategy = tl.getInput("testCaseMatchStrategy", false) ?? "Auto";
    var parameters = new TestResultProcessorParameters(matchingStrategy);
    
    // optional parameters
    parameters.testConfigFilter   = tl.getInput("testConfigFilter", false);
    parameters.testCaseProperty   = tl.getInput("testCaseProperty", false) ?? "TestCase";
    parameters.testCaseRegEx      = tl.getInput("testCaseRegex", false) ?? "(\\d+)";
    parameters.testConfigProperty = tl.getInput("testConfigProperty", false) ?? "Config";

    return parameters;
  }  

  /* Fetch the parameters used to publish test results to ADO Test Plan */
  getPublisherParameters() : TestRunPublisherParameters {
    tl.debug("reading TestRunPublisherParameters from task inputs.");
    
    const accessToken = tl.getInput("accessToken", false) ?? tl.getVariable("SYSTEM_ACCESSTOKEN");
    const buildId = tl.getVariable("BUILD_BUILDID")!; // available in build and release pipelines
    const releaseUri = tl.getVariable("RELEASE_RELEASEURI"); // only in release pipelines
    const releaseEnvironmentUri = tl.getVariable("RELEASE_ENVIRONMENTURI"); // only in release pipelines
    const collectionUri = tl.getInput("collectionUri", false) ?? tl.getVariable("SYSTEM_COLLECTIONURI")!;
    const dryRun = tl.getBoolInput("dryRun", false);
    const testRunTitle = tl.getInput("testRunTitle", false) ?? "PublishTestPlanResult";
    let verifyFiles = getBoolInput("failTaskOnMissingResultsFile", /*default*/ true);
    let failTaskOnUnmatchedTestCases = getBoolInput("failTaskOnUnmatchedTestCases", /*default*/ true);
    const testFiles = getTestFiles(verifyFiles).filter(file => file.indexOf('**') == -1);  
    let result = new TestRunPublisherParameters(
        collectionUri, 
        accessToken as string, 
        dryRun, 
        testRunTitle, 
        buildId,
        testFiles,
        failTaskOnUnmatchedTestCases
        );
    result.releaseUri = releaseUri;
    result.releaseEnvironmentUri = releaseEnvironmentUri;
    return result;
  }

  getStatusFilterParameters() : StatusFilterParameters {
    tl.debug("reading StatusFilterParameters from task inputs.");

    var parameters = new StatusFilterParameters();
    parameters.failTaskOnFailedTests = getBoolInput("failTaskOnFailedTests", /*default*/ false);
    parameters.failTaskOnSkippedTests = getBoolInput("failTaskOnSkippedTests", /*default*/ false);

    return parameters;
  }

  /* Fetch the telemetry payload for this task execution */
  getTelemetryParameters(err?: any) : TelemetryPublisherParameters {
    let withErrorOrWithoutError = err !== undefined && err !== null ? "with error" : "without error";
    tl.debug(`reading TelemetryPublisherParameters from task inputs ${withErrorOrWithoutError}.`);

    const result = new TelemetryPublisherParameters();
    result.displayTelemetryPayload = FeatureFlags.isFeatureEnabled(FeatureFlag.DisplayTelemetry);
    result.displayTelemetryErrors = FeatureFlags.isFeatureEnabled(FeatureFlag.DisplayTelemetryErrors);
    result.payload = this.tph.getPayload(err); // todo: specify privacy level
    return result;
  }
}

export default TaskParameters.getInstance();
export { TaskParameters };

function getTestFiles(verifyFiles: boolean) : string[] {
  
  let testResultFolder = tl.getInput("testResultDirectory", false);
  if (testResultFolder == undefined) {    
    // System.DefaultWorkingDirectory:
    // - build pipelines: "C:\agent\work\1\s" equivalent to "$(Build.SourcesDirectory)"
    // - release pipelines: "C:\agent\work\r1\a" equivalent to "$(System.ArtifactsDirectory)"
    testResultFolder = tl.getVariable("SYSTEM_DEFAULTWORKINGDIRECTORY") as string;

    tl.debug(`testResultDirectory was not specified. Using default working directory: ${testResultFolder}`);
  }

  let testResultFiles = tl.getDelimitedInput("testResultFiles", ",", true)
    .map(file => {
      // merge relative paths with the testresult folder
      if (!path.isAbsolute(file)) {
        tl.debug(`joining relative path '${file}' with testResultDirectory '${testResultFolder}'`);
        return path.join(testResultFolder, file);
      }
      return file;
    })
    .filter(file => {
      // if it's not a wildcard, verify that the file exists
      if (file.indexOf('**') == -1) {
        // either filter out missing files, or fail the task based on user-preference
        if (verifyFiles) { 
          // fail if the file does not exist
          tl.checkPath(file, "testResultFile(s)");
        } else {
          // task supports missing files, so filter out missing files
          return tl.exist(file);
        }
      }
      return true;
    });

  return testResultFiles;
}

function getBoolInput(name: string, defaultValue: boolean) : boolean {
  let input = tl.getInput(name, false);
  return input ? tl.getBoolInput(name, false) : defaultValue;
}