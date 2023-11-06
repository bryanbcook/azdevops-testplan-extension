import { TestFrameworkFormat } from "./TestFrameworkFormat";

export class TestFrameworkParameters {

    public testFiles : string[];
    public testFormat : TestFrameworkFormat;

    constructor (files : string[], format : string, ) {
        this.testFiles = files;
        this.testFormat = TestFrameworkFormat[format as keyof typeof TestFrameworkFormat];
    }
}