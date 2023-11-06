export class TestFrameworkResult {
    name : string;
    className : string;
    fullyQualifiedTestName : string | undefined;
    assembly : string | undefined;
    output : string[] | undefined;
    errors : string[] | undefined;
    outcome : TestOutcome = TestOutcome.None;

    constructor(name : string, className : string) {
        this.name = name;
        this.className = className;
    }
}

export enum TestOutcome {
    None,
    Passed,
    Failed,
    Errored,
    Skipped
}