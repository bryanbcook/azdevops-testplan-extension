import { TestPoint, TestPlan } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestResultContext } from "../context/TestResultContext";
import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import { TestResultMatch, TestResultMatchStrategy } from "./TestResultMatchStrategy";
import { JSONStringify } from "../services/JsonUtil";
import { ILogger, getLogger } from "../services/Logger"

export class TestResultProcessorResult {
  matches = new Map<number,TestFrameworkResult>();
  unmatched : TestFrameworkResult[] = [];
  projectId : string;
  testPlan : TestPlan;  

  constructor(projectId : string, testPlan : TestPlan) {
    this.projectId = projectId;
    this.testPlan = testPlan;
  }
}

export class TestResultProcessor {

  public matchers : TestResultMatchStrategy[];
  public context : TestResultContext;
  public logger: ILogger;

  constructor( matchers : TestResultMatchStrategy[], context : TestResultContext) {
    this.matchers = matchers;
    this.context = context;
    this.logger = getLogger();
  }

  async process( frameworkResults : TestFrameworkResult[]) : Promise<TestResultProcessorResult> {

    this.logger.debug("Processing test results...");
    const result = new TestResultProcessorResult(this.context.projectId, this.context.testPlan);

    var testPoints = this.context.getTestPoints();

    for (const frameworkResult of frameworkResults) {

      if (testPoints.length == 0) {
        this.logger.debug(`Skipping '${frameworkResult.name}' because no test points are available to match against.`);
        result.unmatched.push(frameworkResult);
        break;
      }

      this.logger.debug(`evaluating '${frameworkResult.name}' (${JSONStringify(frameworkResult)})`);

      let matchingPoints = testPoints.filter(point => this.compare(frameworkResult, point));

      // process matches
      if (matchingPoints && matchingPoints.length > 0) {
        if (matchingPoints.length == 1) {
          result.matches.set( matchingPoints[0].id, frameworkResult );

          // strip matched points from subsequent evaluations
          var matchingPointIds = matchingPoints.map(p => p.id);
          testPoints = testPoints.filter(i => matchingPointIds.indexOf(i.id) === -1);
        } else {
            const testCaseNames = matchingPoints.map(item => JSON.stringify(item)).join("\n");
            this.logger.warn(`Multiple matches were found for test case: ${frameworkResult.name}. Matches:\n${testCaseNames}`);
            this.logger.info("To prevent this warning, adjust the duplicates or the testCaseMatchStrategy to be more specific.");
        }
        
      } else {
        result.unmatched.push(frameworkResult);
      }
    }

    // log the mapping of test cases to test points
    if (result.matches.size > 0) {
      this.logger.info(`\nMapped ${result.matches.size} automated tests to test points:`);
      this.logger.info(`| Test Point | Automated Test | TestOutcome |`);
      this.logger.info('|------------|----------------|-------------|');
      result.matches.forEach( (value, key) => {
        this.logger.info(`| ${key} | ${value.name} | ${value.outcome} |`);
      });
    }
    if (result.unmatched.length > 0) {
      this.logger.info(`\nUnmatched test cases:`);

      result.unmatched.forEach( result => {
        this.logger.info(`No matching test point found for '${result.name}'`);
      });
    }

    return result;
  }

  private compare( testResult : TestFrameworkResult, testPoint : TestPoint) : boolean {

    let match = false;

    this.matchers.some( matcher => {
      
      let matchResult = matcher.isMatch( testResult, testPoint );
      this.logger.debug(`Strategy: ${matcher.constructor.name} | TestPoint: ${testPoint.id} | MatchResult: ${matchResult.toString()} `);

      if (matchResult == TestResultMatch.Fail) {
        match = false;

        return true; // exit some
      }
      if (matchResult == TestResultMatch.Exact) {

        match = true;

        return true; // exit some
      }
    });

    return match;
  }

}

