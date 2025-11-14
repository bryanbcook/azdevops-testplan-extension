import { TestFrameworkFormat } from "./TestFrameworkFormat";

export class TestFrameworkParameters {

  public testFiles: string[];
  public testFormat: TestFrameworkFormat;
  public failOnMissingResultsFile: boolean;

  constructor(files: string[], format: string, failOnMissingResultsFile: boolean) {
    this.testFiles = files;
    this.testFormat = TestFrameworkFormat[format as keyof typeof TestFrameworkFormat];
    this.failOnMissingResultsFile = failOnMissingResultsFile;

    if (this.testFormat === undefined) {
      let keys : string[] = Object.keys(TestFrameworkFormat);

      throw new Error(`testResultformat '${format}' is not supported. Please specify one of the following values: ${ keys.join(', ')}`);
    }
  }
}