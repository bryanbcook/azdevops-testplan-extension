import { parse } from 'test-results-parser';
import { TestFrameworkParameters } from "./TestFrameworkParameters";
import { TestFrameworkResult } from "./TestFrameworkResult";
import { getLogger } from "../services/Logger"

export async function readResults(parameters: TestFrameworkParameters): Promise<TestFrameworkResult[]> {

  let logger = getLogger();

  // read test files
  logger.debug("converting test framework results into unified format");
  let testResult = parse({ type: parameters.testFormat.toString(), files: parameters.testFiles });
  logger.debug(JSON.stringify(testResult));

  var results: TestFrameworkResult[] = [];

  testResult.suites.forEach(suite => {
    suite.cases.forEach(test => {
      let result = new TestFrameworkResult(test.name, test.status);
      result.failure = test.failure;
      result.stacktrace = test.stack_trace;
      result.duration = test.duration;
      // 0.1.19 separated tags from metadata
      result.properties = new Map<string,string>(Object.entries(test.metadata));

      results.push(result);
    })
  });

  return results;
}
