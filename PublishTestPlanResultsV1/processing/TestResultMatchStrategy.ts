import { TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestFrameworkResult } from "../framework/TestFrameworkResult";

export enum TestCaseMatchingStrategy {
  none = 0,
  name = 2,
  regex = 4,
  property = 8,
  //vsproperty = 16,

  auto = 2 + 4 + 8
}

export enum TestResultMatch {

  // Match expression does not apply
  None,

  // Match expression has a 100% match and should halt further processing
  Exact,

  // Match expression should halt further processing
  Fail
}

export interface TestResultMatchStrategy {

  // compare the test framework result to the test point
  isMatch( result : TestFrameworkResult, point : TestPoint) : TestResultMatch;
}

