import { TestCaseMatchingStrategy } from "./TestResultMatchStrategy";

export class TestResultProcessorParameters {
  
  testCaseMatchStrategy : TestCaseMatchingStrategy;
  testConfigFilter : string | undefined;
  testCaseRegEx : string | undefined;
  testCaseProperty : string | undefined;
  testConfigProperty : string | undefined;

  constructor(strategy: string) {
    this.testCaseMatchStrategy = TestCaseMatchingStrategy.none;

    strategy.split(',').forEach( i => {
      this.testCaseMatchStrategy |= TestCaseMatchingStrategy[i.toLowerCase() as keyof typeof TestCaseMatchingStrategy];
    });
  }
}