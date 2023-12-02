export class TestRunPublisherParameters {
  public accessToken: string;
  public collectionUri: string;
  public dryRun : boolean;
  public testRunTitle : string;

  constructor(collectionUri: string, accessToken: string, dryRun: boolean, testRunTitle : string) {
      this.collectionUri = collectionUri;
      this.accessToken = accessToken;
      this.dryRun = dryRun;
      this.testRunTitle = testRunTitle;
  }
}