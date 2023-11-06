import { TestFrameworkResult } from "./TestFrameworkResult";
import { ITestFrameworkResultReader } from "./TestFrameworkResultReader";
import * as parser from 'test-results-parser'

export class xUnitResultReader implements ITestFrameworkResultReader {

    private results : TestFrameworkResult[] = [];

    async read(file: string): Promise<TestFrameworkResult[]> {

        // load content
        var doc = new DOMParser().parseFromString("", "application/xml");
        // process
        this.process(doc);

        

        return this.results;
    }

    private process(doc : Document) {
        doc.getElementsByName("assemblies").forEach( elem => {
            this.processAssembly(elem);
        })
    }

    private processAssembly(assembly : HTMLElement) {
        let assemblyName = assembly.getAttribute("name");
    
    }


}
