import { TestFrameworkFormat } from "./TestFrameworkFormat";
import { TestFrameworkParameters } from "./TestFrameworkParameters";
import { TestFrameworkResult } from "./TestFrameworkResult";
import { jUnitResultReader } from "./jUnitResultReader";
import { xUnitResultReader } from "./xUnitResultReader";

export async function readResults( parameters : TestFrameworkParameters) : Promise<any> {

    // use a factory to produce the reader
    let reader = getReader(parameters.testFormat);

    // read the files
    var results : TestFrameworkResult[] = [];
    parameters.testFiles
        .forEach( async (file) => {
            let items = await reader.read(file);
            results.push( ...items );
        });

    return results;
}

export interface ITestFrameworkResultReader {
    read( file: string) : Promise<TestFrameworkResult[]>;
}

function getReader(format : TestFrameworkFormat) : ITestFrameworkResultReader {
    switch (format) {
        case TestFrameworkFormat.xUnit:
            return new xUnitResultReader();
        case TestFrameworkFormat.jUnit:
            return new jUnitResultReader();
        default:
            throw new Error("Unrecognized TestFormat");
    }
}
