import { TestOutcome } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import tl = require('azure-pipelines-task-lib/task');
import { StatusFilterParameters } from "./StatusFilterParameters";

export function analyzeTestResults(testResults: TestFrameworkResult[], parameters: StatusFilterParameters): void {
  const failTaskOnFailedTests = parameters.failTaskOnFailedTests;
  const failTaskOnSkippedTests = parameters.failTaskOnSkippedTests;

  if (failTaskOnFailedTests) {
    const failingTests = testResults.filter(r => r.outcome == TestOutcome.Failed);
    if (failingTests.length > 0) {
      throw new Error("Test framework results contain failing tests.");
    }
  }

  if (failTaskOnSkippedTests) {
    const skippedTests = testResults.filter(r => r.outcome == TestOutcome.NotExecuted);
    if (skippedTests.length > 0) {
      throw new Error("Test framework results contain skipped tests.");
    }
  }

  tl.debug("Status filter found no issues.");
}

