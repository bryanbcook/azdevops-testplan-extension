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

  testFiles: string[] = [];

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
    let failTaskOnMissingResultsFile = this.tph.getBoolInput("failTaskOnMissingResultsFile", /*default*/ true, { recordValue: true, recordNonDefault: true});
    let failTaskOnMissingTests = this.tph.getBoolInput("failTaskOnMissingTests", /*default*/ false, { recordValue: true, recordNonDefault: true});
    this.testFiles = this.#getTestFiles(failTaskOnMissingResultsFile);
    
    const parameters = new TestFrameworkParameters(this.testFiles, testResultFormat!.toLowerCase(), failTaskOnMissingResultsFile, failTaskOnMissingTests);
    this.tph.recordStage("readFrameworkResults");
    return parameters;
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
    this.#ensureCredentialsAreSet();
    const buildId = tl.getVariable("BUILD_BUILDID")!; // available in build and release pipelines
    const releaseUri = tl.getVariable("RELEASE_RELEASEURI"); // only in release pipelines
    const releaseEnvironmentUri = tl.getVariable("RELEASE_ENVIRONMENTURI"); // only in release pipelines
    const dryRun = tl.getBoolInput("dryRun", false);
    const testRunTitle = tl.getInput("testRunTitle", false) ?? "PublishTestPlanResult";
    let failTaskOnUnmatchedTestCases = getBoolInput("failTaskOnUnmatchedTestCases", /*default*/ true);
    const testFiles = this.testFiles.filter(file => file.indexOf('**') == -1);  
    let result = new TestRunPublisherParameters(
        this.collectionUri!, 
        this.accessToken!, 
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

  /* Fetch the parameters used to filter test results and finalize task outcome */
  getStatusFilterParameters() : StatusFilterParameters {
    tl.debug("reading StatusFilterParameters from task inputs.");

    var parameters = new StatusFilterParameters();
    parameters.failTaskOnFailedTests = getBoolInput("failTaskOnFailedTests", /*default*/ false);
    parameters.failTaskOnSkippedTests = getBoolInput("failTaskOnSkippedTests", /*default*/ false);

    return parameters;
  }

  /* Fetch the telemetry payload for this task execution */
  getTelemetryParameters(err?: any) : TelemetryPublisherParameters {
    const hasError = err !== undefined && err !== null;
    const withErrorOrWithoutError = hasError ? "(error condition)" : "";
    tl.debug(`reading TelemetryPublisherParameters from task inputs ${withErrorOrWithoutError}.`);

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
}

export default TaskParameters.getInstance();
export { TaskParameters };

function getBoolInput(name: string, defaultValue: boolean) : boolean {
  let input = tl.getInput(name, false);
  return input ? tl.getBoolInput(name, false) : defaultValue;
}