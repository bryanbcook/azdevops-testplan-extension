export class TestRunReporterParameters {
    public accessToken: string;
    public collectionUri: string;
    public projectName: string;
    public updateTestCaseAutomationStatus : boolean;

    constructor(collectionUri: string, projectName: string, accessToken: string, updateTestCaseAutomationStatus : boolean) {
        this.accessToken = accessToken;
        this.collectionUri = collectionUri;
        this.projectName = projectName;       
        this.updateTestCaseAutomationStatus = updateTestCaseAutomationStatus;
    }
}