import path from 'path';
import fs from 'fs';
import { parseV2 } from 'test-results-parser';
import { TestFrameworkParameters } from "./TestFrameworkParameters";
import { TestAttachment, TestFrameworkResult } from "./TestFrameworkResult";
import { ILogger, getLogger } from "../services/Logger"

export class TestFrameworkResultReader {
  public logger : ILogger;

  constructor(logger : ILogger) {
    this.logger = logger;
  }

  public static async readResults(parameters: TestFrameworkParameters): Promise<TestFrameworkResult[]> {
    const reader = new TestFrameworkResultReader(getLogger());
    return await reader.read(parameters.testFormat, parameters.testFiles);
  }
  
  public async read(testFormat : string, testFiles : string[]) : Promise<TestFrameworkResult[]> {

    // read test files
    this.logger.info('Test format: ' + testFormat);
    this.logger.info('Test files:');
    this.logger.info(testFiles.map(f => `- ${f}`).join('\n'));
    this.logger.debug("converting test framework results into unified format");
    let testParserResult = parseV2({ type: testFormat, files: testFiles });
    let testResult = testParserResult.result;

    // log errors from the parser library
    // these errors might not be fatal, or there could be tests available
    if (testParserResult.errors && testParserResult.errors.length > 0) {
      this.logger.debug(JSON.stringify(testParserResult.errors));
      this.logger.warn('Test parser encountered errors while reading test framework results.");')
    }

    // handle scenario where wildcard files did not expand to valid files
    // or when fatal errors resulted in no test results
    if (testResult == null) {
      throw new Error(`No test results found for format '${testFormat}' in files: ${testFiles.join(', ')}. Ensure the files exist and are in the correct format.`);
    }    
    
    this.logger.debug(JSON.stringify(testResult));
    this.logger.info(`Total: ${testResult.total}\tPassed: ${testResult.passed}\tFailed: ${testResult.failed}\tSkipped: ${testResult.skipped}`);

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
          let baseFolders = testFiles.map(f => path.dirname(f));
          test.attachments.forEach(a => {
            // name is required but not all test frameworks provide one
            if (a.name == undefined || a.name == '') {
              a.name = path.basename(a.path);
              this.logger.debug(`attachment name not provided. Defaulting to file name: '${a.name}'.`);
            }
            // some test frameworks represent attachment paths as relative
            let found = false;
            if (!path.isAbsolute(a.path)) {
              this.logger.debug(`attachment ${a.name} has a relative path: '${a.path}'. Attempting to resolve path relative to test files...`);
              found = baseFolders.some(base => {
                let fullPath = path.join(base, a.path);
                this.logger.debug(`checking: ${fullPath}`);
                if (fs.existsSync(fullPath)) {
                  this.logger.debug(`found attachment '${fullPath}'.`);
                  a.path = fullPath;
                  return true; // exit some
                }
                return false;
              }); 
            } else {
              // ensure absolute path exists
              found = fs.existsSync(a.path);
            }
            if (!found) {
              this.logger.info(`##[warn]test attachment not found: '${a.path}'. Excluding attachment from results.`);
              return; // continue to next attachment
            }
            result.attachments.push(new TestAttachment(a.name, a.path));
          });
        }

        results.push(result);
      })
    });

    return results;
  }
}
