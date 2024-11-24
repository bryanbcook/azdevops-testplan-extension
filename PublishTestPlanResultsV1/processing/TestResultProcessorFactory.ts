import { TestResultProcessor } from "./TestResultProcessor";
import { TestResultProcessorParameters } from "./TestResultProcessorParameters";
import { TestResultMatchStrategy, TestResultMatch, TestCaseMatchingStrategy } from "./TestResultMatchStrategy";
import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import { TestConfiguration, TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestPoint2 } from '../services/AdoWrapper';
import { TestResultContext } from "../context/TestResultContext";

export function create( parameters : TestResultProcessorParameters, context : TestResultContext ) : TestResultProcessor {

  let matchers : TestResultMatchStrategy[] = [];

  /*  Add the matchers in the order of most permissive to least permissive  */

  // exclude results if the testpoint config does not match
  var allowedConfigs = context.getTestConfigs(parameters.testConfigFilter);
  matchers.push(new TestConfigMatchStrategy(allowedConfigs, parameters.testConfigProperty!));

  // match if the test/point name match, allow pass thru
  if (parameters.testCaseMatchStrategy & TestCaseMatchingStrategy.name) {
    matchers.push(new TestNameMatchStrategy());
  }

  // match if the test automation property is present, allow pass thru
  // if (parameters.testCaseMatchStrategy & TestCaseMatchingStrategy.vsproperty) {
  //   matchers.push(new TestAutomationPropertyMatchStrategy());
  // }

  // match if the test id appears in a regex, allow pass thru
  if (parameters.testCaseMatchStrategy & TestCaseMatchingStrategy.regex) {
    matchers.push(new TestRegexMatchStrategy(parameters.testCaseRegEx));
  }

  // match if the test id is present, no pass thru
  if (parameters.testCaseMatchStrategy & TestCaseMatchingStrategy.property) {
    matchers.push(new TestIdMatchStrategy(parameters.testCaseProperty!));
  }

  return new TestResultProcessor( matchers, context );
}

export class TestConfigMatchStrategy implements TestResultMatchStrategy {

  allowedConfigs : Map<string,TestConfiguration>;
  public testResultConfigProperty : string;

  constructor(allowedConfigs : Map<string,TestConfiguration>, testResultConfigProperty : string) {
    this.allowedConfigs = allowedConfigs;
    this.testResultConfigProperty = testResultConfigProperty;
  }

  isMatch(result: TestFrameworkResult, point: TestPoint): TestResultMatch {

    // comparing the test point should not be necessary if a 
    // defaultConfigFilter has been set, but we should safe-guard this value
    if (!this.allowedConfigs.has(point.configuration.id?.toString() as string)) {
      return TestResultMatch.Fail;
    }
      
    // inspect if the test framework result has a configuration property
    // and then compare that value to the test point
    if (result.properties.has(this.testResultConfigProperty)) {
      let testResultConfig = result.properties.get(this.testResultConfigProperty) as string;
      
      // do not allow if the test-framework result isn't one 
      // of the configs that we support
      if (!this.allowedConfigs.has(testResultConfig)) {
        return TestResultMatch.Fail;
      }

      // resolve possible alias to config
      let configIdToCompare = this.allowedConfigs.get(testResultConfig)?.id?.toString();

      // compare against the test point
      if (configIdToCompare !== point.configuration.id) {
        return TestResultMatch.Fail;
      }
    }

    // treat the IsMatch comparison as a neutral response to 
    // indicate that this isn't an exact match or a fail
    return TestResultMatch.None;
  }
}

export class TestNameMatchStrategy implements TestResultMatchStrategy {

  isMatch( result : TestFrameworkResult, point : TestPoint) : TestResultMatch {
    
    if (this.simplify(result.name).endsWith(this.simplify((point as TestPoint2).testCaseReference.name!))) {
      return TestResultMatch.Exact;
    }

    return TestResultMatch.None;
  }

  private simplify(name: string) : string {
    return name.toLowerCase().replace(/[_ -]/gm,'_');
  }
}

export class TestRegexMatchStrategy implements TestResultMatchStrategy {
  regex: RegExp | undefined;

  constructor(regex : string | undefined) {
    if (regex) {
      this.regex = new RegExp(regex);
    }
  }
  
  isMatch(result: TestFrameworkResult, point: TestPoint): TestResultMatch {

    if (this.regex) {
      let match : RegExpExecArray | null;
      if ((match = this.regex.exec(result.name)) !== null) {
        let testCaseId = match[1]; // use first capture group result
        return testCaseId == (point as TestPoint2).testCaseReference.id ?
          TestResultMatch.Exact : TestResultMatch.Fail;
      }
    }

    return TestResultMatch.None;
  }
}

export const TestCaseAutomationProperty : string = "Microsoft.VSTS.TCM.AutomatedTestName";

// export class TestAutomationPropertyMatchStrategy implements TestResultMatchStrategy {

//   isMatch(result: TestFrameworkResult, point: TestPoint): TestResultMatch {
//     // get test automation property from testpoint
//     point.workItemProperties
//     // if automation property is present
//       // do fuzzy match on framework result
//       // if no match, fail
//     // if not present
//     // allow pass-thru
//     throw new Error("Method not implemented");
//   }

// }

export class TestIdMatchStrategy implements TestResultMatchStrategy {

  testCaseIdProperty : string;

  constructor(testCaseIdProperty : string) {
    this.testCaseIdProperty = testCaseIdProperty;
  }

  isMatch(result: TestFrameworkResult, point: TestPoint): TestResultMatch {

    if (result.properties.has(this.testCaseIdProperty)) {
      let testCaseId = result.properties.get(this.testCaseIdProperty);

      return (testCaseId && testCaseId == (point as TestPoint2).testCaseReference.id) ?
        TestResultMatch.Exact : TestResultMatch.Fail;
    }

    // this should be the end of the line if we haven't matched already
    return TestResultMatch.Fail;
  }
}



