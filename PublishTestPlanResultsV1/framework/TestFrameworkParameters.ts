import { TestFrameworkFormat } from "./TestFrameworkFormat";

export class TestFrameworkParameters {

  public testFiles: string[];
  public testFormat: TestFrameworkFormat;
  public failOnMissingResultsFile: boolean;
  public failOnMissingTests: boolean;

  constructor(files: string[], format: string, failOnMissingResultsFile: boolean, failOnMissingTests: boolean) {
    this.testFiles = files;
    this.testFormat = TestFrameworkFormat[format as keyof typeof TestFrameworkFormat];
    this.failOnMissingResultsFile = failOnMissingResultsFile;
    this.failOnMissingTests = failOnMissingTests;
    
    if (this.testFormat === undefined) {
      let keys : string[] = Object.keys(TestFrameworkFormat);

      throw new Error(`testResultformat '${format}' is not supported. Please specify one of the following values: ${ keys.join(', ')}`);
    }
  }
}