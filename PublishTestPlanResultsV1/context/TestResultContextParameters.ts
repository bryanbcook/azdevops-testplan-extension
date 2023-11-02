import { configAlias } from "./configAlias";

export class TestResultContextParameters {
    public accessToken: string;
    public collectionUri: string;
    public projectName: string;

    public testConfigFilter: string | undefined;
    public testConfigAliases: Array<configAlias>;
    public testPlan: string | undefined;
    public testResultFormat: string | undefined;

    constructor(collectionUri: string, projectName: string, accessToken: string) {
        this.collectionUri = collectionUri;
        this.projectName = projectName;
        this.accessToken = accessToken;
        this.testConfigAliases = new Array<configAlias>();
    }
}
