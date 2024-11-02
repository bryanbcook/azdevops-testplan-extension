export class TestRunPublisherParameters {
  public accessToken: string;
  public buildId : string;
  public collectionUri: string;
  public dryRun : boolean;
  public testRunTitle : string;

  constructor(collectionUri: string, accessToken: string, dryRun: boolean, testRunTitle : string, buildId : string) {
      this.collectionUri = collectionUri;
      this.accessToken = accessToken;
      this.buildId = buildId;
      this.dryRun = dryRun;
      this.testRunTitle = testRunTitle;
  }
}