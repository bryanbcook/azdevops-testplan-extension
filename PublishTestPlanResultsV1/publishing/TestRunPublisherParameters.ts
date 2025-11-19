export class TestRunPublisherParameters {
  public accessToken: string;
  public buildId : string;
  public collectionUri: string;
  public dryRun : boolean;
  public releaseUri?: string;
  public releaseEnvironmentUri?: string;
  public testRunTitle : string;
  public testFiles : string[];
  public failTaskOnUnmatchedTestCases : boolean;

  constructor(collectionUri: string, accessToken: string, dryRun: boolean, testRunTitle : string, buildId : string, testFiles : string[], failTaskOnUnmatchedTestCases : boolean) {
      this.collectionUri = collectionUri;
      this.accessToken = accessToken;
      this.buildId = buildId;
      this.dryRun = dryRun;
      this.testRunTitle = testRunTitle;
      this.testFiles = testFiles;
      this.failTaskOnUnmatchedTestCases = failTaskOnUnmatchedTestCases
  }
}