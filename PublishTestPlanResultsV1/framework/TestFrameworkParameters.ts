import { TestFrameworkFormat } from "./TestFrameworkFormat";

export class TestFrameworkParameters {

  public testFiles: string[];
  public testFormat: TestFrameworkFormat;

  constructor(files: string[], format: string) {
    this.testFiles = files;
    this.testFormat = TestFrameworkFormat[format as keyof typeof TestFrameworkFormat];

    if (this.testFormat === undefined) {
      let keys : string[] = Object.keys(TestFrameworkFormat);

      throw new Error(`testResultformat '${format}' is not supported. Please specify one of the following values: ${ keys.join(', ')}`);
    }
  }
}