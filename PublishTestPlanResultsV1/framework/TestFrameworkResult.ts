import { TestOutcome, TestPoint } from 'azure-devops-node-api/interfaces/TestInterfaces';

const TestParserMapping = {
  PASS: TestOutcome.Passed,
  FAIL: TestOutcome.Failed,
  ERROR: TestOutcome.Error,
  SKIP: TestOutcome.NotExecuted
}

export class TestFrameworkResult {
  name: string;
  duration: number | undefined;
  stacktrace: string | undefined;
  failure: string | undefined;
  outcome: TestOutcome = TestOutcome.None;
  properties: Map<string,string>;

  constructor(name: string, outcome: string) {
    this.name = name;
    this.outcome = TestParserMapping[outcome as keyof typeof TestParserMapping];
    this.properties = new Map<string,string>();
  }
}