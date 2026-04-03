export class TestRunPublisherParameters {
  public accessToken: string;
  public buildId : string | undefined;
  public collectionUri: string;
  public dryRun : boolean;
  public projectName: string;
  public releaseUri?: string;
  public releaseEnvironmentUri?: string;
  public testRunTitle : string;
  public testFiles : string[];
  public failTaskOnUnmatchedTestCases : boolean;

  constructor(collectionUri: string, projectName: string, accessToken: string, dryRun: boolean, testRunTitle : string, buildId : string | undefined, testFiles : string[], failTaskOnUnmatchedTestCases : boolean) {
      this.collectionUri = collectionUri;
      this.projectName = projectName;
      this.accessToken = accessToken;
      this.buildId = buildId;
      this.dryRun = dryRun;
      this.testRunTitle = testRunTitle;
      this.testFiles = testFiles;
      this.failTaskOnUnmatchedTestCases = failTaskOnUnmatchedTestCases
  }
}