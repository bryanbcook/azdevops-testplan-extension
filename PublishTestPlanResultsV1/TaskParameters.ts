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

  // dependencies
  tph: TaskParameterHelper

  // cached parameters
  accessToken?: string;
  collectionUri?: string;
  projectName?: string;

  buildId?: string;
  releaseUri?: string;
  releaseEnvironmentUri?: string;

  dryRun?: boolean;

  testFiles: string[] = [];

  constructor(tph: TaskParameterHelper) {
    this.tph = tph;
    const {buildId, releaseUri, releaseEnvironmentUri } = this.#getPipelineEnvironment();
    this.buildId = buildId;
    this.releaseUri = releaseUri;
    this.releaseEnvironmentUri = releaseEnvironmentUri;    
  }

  static getInstance() : TaskParameters {
    const telemetryPayloadBuilder = new TelemetryPayloadBuilder();
    const tph = new TaskParameterHelper(telemetryPayloadBuilder);
    return new TaskParameters(tph);
  }

  /* Fetch the parameters used to obtain the working details for the ADO Test Plan */
  getTestContextParameters(): TestResultContextParameters {
    tl.debug("reading TestContextParameters from task inputs.");
    this.tph.recordStage("getTestContextParameters");

    this.#ensureCredentialsAreSet();
    var parameters = new TestResultContextParameters(this.collectionUri!, this.projectName!, this.accessToken!);

    parameters.testPlan = this.tph.getInput("testPlan", false, { recordNonDefault: true })!;
    parameters.testConfigFilter = this.tph.getInput("testConfigFilter", false, { recordNonDefault: true });
    this.tph.getDelimitedInput("testConfigAliases", { recordNonDefault: true }).forEach((alias: string) => {
      let parts = alias.split("=");
      if (parts.length > 1) {
        parameters.testConfigAliases.push(new configAlias(parts[0], parts[1]));
      }
    });

    this.tph.recordStage("createContext");
    return parameters;
  }

  /* Fetch the parameters used to parse through automated test results */
  getFrameworkParameters(): TestFrameworkParameters {
    tl.debug("reading TestFrameworkParameters from task inputs.");
    this.tph.recordStage("getFrameworkParameters");  

    let testResultFormat = this.tph.getInput("testResultFormat", true, { recordValue: true});
    let failTaskOnMissingResultsFile = this.tph.getBoolInput("failTaskOnMissingResultsFile", /*default*/ true, { recordValue: true, dontRecordDefault: true});
    let failTaskOnMissingTests = this.tph.getBoolInput("failTaskOnMissingTests", /*default*/ false, { recordValue: true, dontRecordDefault: true});
    this.testFiles = this.#getTestFiles(failTaskOnMissingResultsFile);
    
    const parameters = new TestFrameworkParameters(this.testFiles, testResultFormat!.toLowerCase(), failTaskOnMissingResultsFile, failTaskOnMissingTests);
    this.tph.recordStage("readFrameworkResults");
    return parameters;
  }

  /* Fetch the parameters used to process test results and match them to test cases */
  getProcessorParameters() : TestResultProcessorParameters {
    tl.debug("reading TestResultProcessorParameters from task inputs.");
    this.tph.recordStage("getProcessorParameters");

    let matchingStrategy = this.tph.getInputOrFallback("testCaseMatchStrategy", () => "Auto", { recordValue: true, dontRecordDefault: true })!;
    var parameters = new TestResultProcessorParameters(matchingStrategy);
    
    // optional parameters
    parameters.testConfigFilter   = this.tph.getInput("testConfigFilter", false, { recordNonDefault: true });
    parameters.testCaseProperty   = this.tph.getInputOrFallback("testCaseProperty", () => "TestCase", { recordValue: true, dontRecordDefault: true });
    parameters.testCaseRegEx      = this.tph.getInputOrFallback("testCaseRegex", () => "(\\d+)", { recordValue: true, dontRecordDefault: true });
    parameters.testConfigProperty = this.tph.getInputOrFallback("testConfigProperty", () => "Config", { recordValue: true, dontRecordDefault: true });

    this.tph.recordStage("processFrameworkResults");
    return parameters;
  }  

  /* Fetch the parameters used to publish test results to ADO Test Plan */
  getPublisherParameters() : TestRunPublisherParameters {
    tl.debug("reading TestRunPublisherParameters from task inputs.");
    this.tph.recordStage("getPublisherParameters");

    this.#ensureCredentialsAreSet();
    const dryRun = this.#getDryRun();
    const testRunTitle = this.tph.getInputOrFallback("testRunTitle", () =>  "PublishTestPlanResult", { recordNonDefault: true, dontRecordDefault: true });
    let failTaskOnUnmatchedTestCases = this.tph.getBoolInput("failTaskOnUnmatchedTestCases", /*default*/ true, { recordValue: true, dontRecordDefault: true });
    const testFiles = this.testFiles.filter(file => file.indexOf('**') == -1);  
    let result = new TestRunPublisherParameters(
        this.collectionUri!, 
        this.accessToken!, 
        dryRun, 
        testRunTitle, 
        this.buildId!,
        testFiles,
        failTaskOnUnmatchedTestCases
        );
    result.releaseUri = this.releaseUri;
    result.releaseEnvironmentUri = this.releaseEnvironmentUri;

    this.tph.recordStage("publishTestRunResults");
    return result;
  }

  /* Fetch the parameters used to filter test results and finalize task outcome */
  getStatusFilterParameters() : StatusFilterParameters {
    tl.debug("reading StatusFilterParameters from task inputs.");
    this.tph.recordStage("getStatusFilterParameters");

    var parameters = new StatusFilterParameters();
    parameters.failTaskOnFailedTests =  this.tph.getBoolInput("failTaskOnFailedTests", /*default*/ false, { recordValue: true, dontRecordDefault: true });
    parameters.failTaskOnSkippedTests = this.tph.getBoolInput("failTaskOnSkippedTests", /*default*/ false, { recordValue: true, dontRecordDefault: true });

    this.tph.recordStage("finalizeResults");
    return parameters;
  }

  /* Fetch the telemetry payload for this task execution */
  getTelemetryParameters(err?: any) : TelemetryPublisherParameters {
    const hasError = err !== undefined && err !== null;
    const withErrorOrWithoutError = hasError ? "(error condition)" : "";
    tl.debug(`reading TelemetryPublisherParameters from task inputs ${withErrorOrWithoutError}.`);
    // don't record stage so that we can publish which stage we last completed

    const result = new TelemetryPublisherParameters();
    result.displayTelemetryPayload = FeatureFlags.isFeatureEnabled(FeatureFlag.DisplayTelemetry);
    result.displayTelemetryErrors = FeatureFlags.isFeatureEnabled(FeatureFlag.DisplayTelemetryErrors);
    result.publishTelemetry = FeatureFlags.isFeatureEnabled(FeatureFlag.PublishTelemetry);

    result.payload = this.tph.getPayload(err); // todo: specify privacy level
    result.payload["flags"] = FeatureFlags.getFlags();
    return result;
  }

  #ensureCredentialsAreSet() {
    if (!this.accessToken) {
      this.accessToken = this.tph.getInputOrFallback("accessToken", () => tl.getVariable("SYSTEM_ACCESSTOKEN"), { recordNonDefault: true });
      this.projectName = this.tph.getInputOrFallback("projectName", () => tl.getVariable("SYSTEM_TEAMPROJECT"), { recordNonDefault: true, anonymize: true });
      this.collectionUri = this.tph.getInputOrFallback("collectionUri", () => tl.getVariable("SYSTEM_COLLECTIONURI"), { recordNonDefault: true, anonymize: true });

      let serverType = (this.collectionUri && (this.collectionUri.startsWith("https://dev.azure.com/") || this.collectionUri.includes(".visualstudio.com"))) ?
        "Hosted" : "OnPremises";
      this.tph.payloadBuilder.add("serverType", serverType);
    }
  }

  #getTestFiles(verifyFiles: boolean) : string[] {
    var wildCardUsed : boolean | undefined = undefined;

    // Resolve the user specified testResultDirectory.
    // If not specified, default to SYSTEM_DEFAULTWORKINGDIRECTORY.
    // - For Build Pipelines: "C:\agent\work\1\s" equivalent to "$(Build.SourcesDirectory)"
    // - For Release Pipelines: "C:\agent\work\r1\a" equivalent to "$(System.ArtifactsDirectory)"
    let testResultFolder = this.tph.getInputOrFallback("testResultDirectory", () => tl.getVariable("SYSTEM_DEFAULTWORKINGDIRECTORY")!, { recordNonDefault: true });

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
        else {
          wildCardUsed = true;
        }
        return true;
      });

    // update telemetry
    if (wildCardUsed) {
      this.tph.payloadBuilder.add("testResultFilesWildcard", true);
    }
    if (testResultFiles.length > 0) {
      this.tph.payloadBuilder.add("numTestFiles", testResultFiles.length);
    }

    return testResultFiles;
  }

  #getPipelineEnvironment() : { buildId: string, releaseUri?: string, releaseEnvironmentUri?: string } {

    // determine whether we're running in a build or release pipeline
    const buildId = tl.getVariable("BUILD_BUILDID")!; // available in build and release pipelines
    const releaseUri = tl.getVariable("RELEASE_RELEASEURI"); // only in release pipelines
    const releaseEnvironmentUri = tl.getVariable("RELEASE_ENVIRONMENTURI"); // only in release pipelines

    // detect running in a build or a release
    let hostType = (releaseUri && releaseEnvironmentUri) ? "release" : "build";
    this.tph.payloadBuilder.add("hostType", hostType);

    // detect if we're using a hosted or self-hosted agent
    let agentType = tl.getVariable("Agent.CloudId") ? "Hosted" : "OnPremises";
    this.tph.payloadBuilder.add("agentType", agentType);

    // collect the agent version
    let agentVersion = tl.getVariable("Agent.Version") || '';
    this.tph.payloadBuilder.add("agentVersion", agentVersion);    

    return { buildId, releaseUri, releaseEnvironmentUri };
  }

  #getDryRun() : boolean {
    if (this.dryRun === undefined) {
      this.dryRun = this.tph.getBoolInput("dryRun", false, { recordValue: true, dontRecordDefault: true });
    }
    return this.dryRun;
  }
}

export default TaskParameters.getInstance();
export { TaskParameters };