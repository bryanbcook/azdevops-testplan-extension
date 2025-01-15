import path from 'path';
import fs from 'fs';
import { parse } from 'test-results-parser';
import { TestFrameworkParameters } from "./TestFrameworkParameters";
import { TestAttachment, TestFrameworkResult } from "./TestFrameworkResult";
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

      if (test.attachments && test.attachments.length > 0) {
        let baseFolders = parameters.testFiles.map(f => path.dirname(f));
        test.attachments.forEach(a => {
          // name is required but not all test frameworks provide one
          if (a.name == undefined || a.name == '') {
            a.name = path.basename(a.path);
            logger.debug(`attachment name not provided. Defaulting to file name: '${a.name}'.`);
          }
          // some test frameworks represent attachment paths as relative
          if (!path.isAbsolute(a.path)) {
            logger.debug(`attachment ${a.name} has a relative path: '${a.path}'. Attempting to resolve path relative to test files...`);
            let found = baseFolders.some(base => {
              let fullPath = path.join(base, a.path);
              logger.debug(`checking: ${fullPath}`);
              if (fs.existsSync(fullPath)) {
                logger.debug(`found attachment '${fullPath}'.`);
                a.path = fullPath;
                return true; // exit some
              }
              return false;
            });
            if (!found) {
              logger.info(`##[warn]test attachment not found: '${a.path}'. Excluding attachment from results.`);
              return; // continue to next attachment
            }
          }
          result.attachments.push(new TestAttachment(a.name, a.path));
        });
      }

      results.push(result);
    })
  });

  return results;
}
