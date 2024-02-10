import { TestConfiguration, TestPlan, TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces"
import { TestResultContextParameters } from "./TestResultContextParameters";
import { AdoWrapper } from "../services/AdoWrapper";
import { ILogger, getLogger } from "../services/Logger"
import { TestResultContext } from "./TestResultContext";
import { configAlias } from "./configAlias";

export class TestResultContextBuilder {

  static async setup(parameters: TestResultContextParameters): Promise<TestResultContextBuilder> {
    // construct builder
    var log = getLogger();
    var adoClientWrapper = await AdoWrapper.createInstance(parameters.collectionUri, parameters.accessToken);
    var builder = new TestResultContextBuilder(log, adoClientWrapper);

    // configure 
    builder.projectName = parameters.projectName;
    builder.testPlanName = parameters.testPlan;
    builder.testConfig = parameters.testConfigFilter;
    builder.testConfigAlises = parameters.testConfigAliases;

    return builder;
  }

  private log: ILogger;
  private ado: AdoWrapper;

  public projectName: string | undefined;
  public testPlanName: string | undefined;
  public testConfig: string | undefined;
  public testConfigAlises: configAlias[] | undefined;

  constructor(log: ILogger, adoClientWrapper: AdoWrapper) {
    this.log = log;
    this.ado = adoClientWrapper;
  }

  async build(): Promise<TestResultContext> {
    let projectId = await this.getAndValidateProjectName();
    let testPlan = await this.getAndValidateTestPlan();

    this.log.info(`Using Test Plan: ${testPlan.name}`)

    let ctx = new TestResultContext(projectId, (this.projectName as string), testPlan);
    let configs = await this.getTestConfigurations();
    if (configs) {
      this.log.debug(`${configs.length} test configurations available.`);
      configs.forEach((config: any) => {
        this.log.debug(`config : ${config.name}`);
        ctx.addConfig(config)
      });
    }

    this.testConfigAlises?.forEach(alias => {
      this.log.debug(`config alias: ${alias.alias}=${alias.config}`);
      ctx.addConfigAlias(alias);
    });

    let testConfigFilterId = this.getAndValidateTestConfigFilter(ctx);    

    let points = await this.getTestPoints(projectId, testPlan, testConfigFilterId);
    ctx.addTestPoints(points);
    this.log.info(`Available Test Points: ${points.length}`);

    return ctx;
  }

  private async getAndValidateProjectName(): Promise<string> {
    this.log.debug("validating ado connection");
    try {
      return await this.ado.getProjectId(this.projectName as string);
    }
    catch (err) {
      var errorMessage = "";
      if (err instanceof Error) {
        errorMessage = ` Error: ${err.message}`;
      }
      throw new Error(`Could not resolve project name '${this.projectName}'.${errorMessage}`);
    }
  }

  private async getAndValidateTestPlan(): Promise<TestPlan> {
    this.log.debug("locating test plans");

    let projectName = this.projectName as string;
    let testPlans: TestPlan[] = await this.ado.getTestPlans(projectName);

    if (testPlans.length == 0) {
      throw new Error("No TestPlans found.");
    }

    if (this.testPlanName) {
      this.log.debug(`attempting to locate test plan: ${this.testPlanName}`)
      testPlans = testPlans.filter(i => i.name == this.testPlanName);

      if (testPlans.length != 1) {
        throw new Error(`TestPlan '${this.testPlanName}' was not found.`);
      }

      return testPlans[0];
    } else {
      this.log.debug("Test plan name was not specified.");

      if (testPlans.length == 1) {
        this.log.debug("Only one test plan available.");
        return testPlans[0];
      }

      let activeTestPlans = testPlans
        .filter(i => i.endDate != null && i.endDate > new Date(Date.now()))
        .sort((a, b) => (b.endDate as Date).getTime() - (a.endDate as Date).getTime());

      if (activeTestPlans.length > 0) {
        this.log.debug("using latest active test plan.");
        return activeTestPlans[0];
      }

      throw new Error("Unable to infer active test plan.");
    }
  }

  private async getTestConfigurations(): Promise<TestConfiguration[]> {
    this.log.debug("locating test plan configurations");

    return await this.ado.getTestConfigurations((this.projectName as string));
  }

  private getAndValidateTestConfigFilter(ctx : TestResultContext) : string | undefined {
    // validate that the testConfigFilter refers to a valid config
    if (this.testConfig) {
      this.log.debug("validating testConfigFilter");
      if (!ctx.hasConfig(this.testConfig)) {
        throw new Error(`Test config filter refers to an unrecognized configuration '${this.testConfig}'.`);
      }
      
      let configId = ctx.getTestConfig(this.testConfig).id.toString();
      this.log.info(`Using Test Config: ${this.testConfig} (${configId})`);
      return configId;
    }

    return undefined;
  }

  private async getTestPoints(projectId : string, testPlan : TestPlan, testConfigFilterId : string | undefined): Promise<TestPoint[]> {
    this.log.debug("locating test suites and test points");
    
    let points = await this.ado.getTestPointsForSuite(projectId, testPlan.id.toString(), testPlan.rootSuite.id as string, true);

    if (testConfigFilterId) {
      return points.filter(i => i.configuration.id == testConfigFilterId);
    }

    return points;
  }
}