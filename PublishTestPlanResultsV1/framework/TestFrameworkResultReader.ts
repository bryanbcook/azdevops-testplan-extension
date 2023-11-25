import { TestFrameworkFormat } from "./TestFrameworkFormat";
import { TestFrameworkParameters } from "./TestFrameworkParameters";
import { TestFrameworkResult } from "./TestFrameworkResult";
import { parse, ParseOptions } from 'test-results-parser';

export async function readResults(parameters: TestFrameworkParameters): Promise<TestFrameworkResult[]> {

  // read test files
  let testResult = parse({ type: parameters.testFormat.toString(), files: parameters.testFiles });

  var results: TestFrameworkResult[] = [];

  testResult.suites.forEach(suite => {
    suite.cases.forEach(test => {

      let result = new TestFrameworkResult(test.name, test.status);
      result.failure = test.failure;
      result.stacktrace = test.stack_trace;
      result.properties = test.meta_data;

      results.push(result);
    })
  });

  return results;
}
