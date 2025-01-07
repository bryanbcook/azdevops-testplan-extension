import tl = require('azure-pipelines-task-lib/task');
import * as path from "path";
import { configAlias } from "./context/configAlias";
import { TestResultContextParameters } from "./context/TestResultContextParameters";
import { TestFrameworkParameters } from "./framework/TestFrameworkParameters";
import { TestResultProcessorParameters } from './processing/TestResultProcessorParameters';
import { TestRunPublisherParameters } from './publishing/TestRunPublisherParameters';

export function getTestContextParameters(): TestResultContextParameters {

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

export function getFrameworkParameters(): TestFrameworkParameters {
  tl.debug("reading TestFrameworkParameters from task inputs.");

  let testResultFormat = tl.getInput("testResultFormat", true);
  let testResultFiles = getTestFiles();

  return new TestFrameworkParameters(testResultFiles, testResultFormat!.toLowerCase()); 
}

export function getProcessorParameters() : TestResultProcessorParameters {
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

export function getPublisherParameters() : TestRunPublisherParameters {
  const accessToken = tl.getInput("accessToken", false) ?? tl.getVariable("SYSTEM_ACCESSTOKEN");
  const buildId = tl.getVariable("BUILD_BUILDID")!; // available in build and release pipelines
  const releaseUri = tl.getVariable("RELEASE_RELEASEURI"); // only in release pipelines
  const releaseEnvironmentUri = tl.getVariable("RELEASE_ENVIRONMENTURI"); // only in release pipelines
  const collectionUri = tl.getInput("collectionUri", false) ?? tl.getVariable("SYSTEM_COLLECTIONURI")!;
  const dryRun = tl.getBoolInput("dryRun", false);
  const testRunTitle = tl.getInput("testRunTitle", false) ?? "PublishTestPlanResult";
  const testFiles = getTestFiles().filter(file => file.indexOf('**') == -1);
  let result = new TestRunPublisherParameters(
      collectionUri, 
      accessToken as string, 
      dryRun, 
      testRunTitle, 
      buildId,
      testFiles
      );
  result.releaseUri = releaseUri;
  result.releaseEnvironmentUri = releaseEnvironmentUri;
  return result;
}

function getTestFiles() : string[] {
  
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
      // verify that file exists
      if (file.indexOf('**') == -1) {
        tl.checkPath(file, "testResultFile(s)");
      }
      return true;
    });

  return testResultFiles;
}