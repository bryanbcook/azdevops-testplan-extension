import { TestPoint, TestPlan } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestResultContext } from "../context/TestResultContext";
import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import { TestResultMatch, TestResultMatchStrategy } from "./TestResultMatchStrategy";

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
  context : TestResultContext;

  constructor( matchers : TestResultMatchStrategy[], context : TestResultContext) {
    this.matchers = matchers;
    this.context = context;
  }

  async process( frameworkResults : TestFrameworkResult[]) : Promise<TestResultProcessorResult> {
    
    const result = new TestResultProcessorResult(this.context.projectId, this.context.testPlan);

    var testPoints = this.context.getTestPoints();

    for (const frameworkResult of frameworkResults) {

      if (testPoints.length == 0) {
        result.unmatched.push(frameworkResult);
        break;
      }

      let matchingPoints = testPoints.filter(point => this.compare(frameworkResult, point));

      // process matches
      if (matchingPoints && matchingPoints.length > 0) {
        if (matchingPoints.length == 1) {
          result.matches.set( matchingPoints[0].id, frameworkResult );

          // strip matched points from subsequent evaluations
          var matchingPointIds = matchingPoints.map(p => p.id);
          testPoints = testPoints.filter(i => matchingPointIds.indexOf(i.id) === -1);
        } else {
          // TODO: log warning that there were too many matches
        }
        
      } else {
        result.unmatched.push(frameworkResult);
      }
    }

    return result;
  }

  private compare( testResult : TestFrameworkResult, testPoint : TestPoint) : boolean {

    let match = false;

    this.matchers.some( matcher => {
      let matchResult = matcher.isMatch( testResult, testPoint);
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

