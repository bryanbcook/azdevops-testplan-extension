import { TestFrameworkResult } from "./TestFrameworkResult";
import { ITestFrameworkResultReader } from "./TestFrameworkResultReader";


export class jUnitResultReader implements ITestFrameworkResultReader {
    async read(file: string): Promise<TestFrameworkResult[]> {
        return [] as TestFrameworkResult[];
    }
}
