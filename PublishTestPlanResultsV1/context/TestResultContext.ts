import { TestConfiguration, TestPlan, TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestResultContextParameters } from "./TestResultContextParameters";
import { TestResultContextBuilder } from "./TestResultContextBuilder";
import { configAlias } from "./configAlias";
import { TestPoint2 } from "../services/AdoWrapper";

export class TestResultContext {

  static async create(parameters: TestResultContextParameters): Promise<TestResultContext> {
    var builder = await TestResultContextBuilder.setup(parameters);
    return await builder.build();
  }

  // logger
  public readonly projectId: string;
  public readonly projectName: string;
  public readonly testPlan: TestPlan;

  private readonly supportedTestConfigs: Map<string, TestConfiguration>;
  private readonly testPoints: Map<number, TestPoint>;
  private readonly testCases: Set<string>;
  private readonly syncOutcomeAcrossSuites: boolean = false;

  constructor(projectId: string, projectName: string, testPlan: TestPlan) {
    this.projectId = projectId;
    this.projectName = projectName;
    this.testPlan = testPlan;
    this.supportedTestConfigs = new Map<string, TestConfiguration>();
    this.testPoints = new Map<number, TestPoint>();
    this.testCases = new Set<string>();
    this.syncOutcomeAcrossSuites = this.testPlan.testOutcomeSettings?.syncOutcomeAcrossSuites ?? false;
  }

  addConfig(config: TestConfiguration) {
    let key = config.id.toString();
    this.supportedTestConfigs.set(key, config);
    this.supportedTestConfigs.set(config.name, config);
  }

  addConfigAlias(configAliasItem: configAlias) {
    let alias = configAliasItem.alias;
    let config = configAliasItem.config;

    if (this.supportedTestConfigs.has(config)) {
      var item = this.supportedTestConfigs.get(config) as TestConfiguration;
      if (!this.supportedTestConfigs.has(alias)) {
        this.supportedTestConfigs.set(alias, item);
      } else {
        // warn about duplicate alias
      }
    } else {
      // throw unrecognized configuration
      throw new Error(`Unrecognized config name '${config}'. Please verify that you have the correct configuration aliases defined.`)
    }
  }

  addTestPoints(points: TestPoint[]) {
    points.forEach(p => this.addTestPoint(p));
  }

  addTestPoint(point: TestPoint) {
    
    // as performance optimization, we can exclude test points that are duplicate test case references
    // when the test plan has the "sync outcome across suites" option enabled
    if (this.syncOutcomeAcrossSuites) {
      // logic to handle duplicate test points
      const testCaseId = (point as TestPoint2).testCaseReference.id;
      if (testCaseId) {
        if (this.testCases.has(testCaseId.toString())) {
          // skip adding this test point as it's a duplicate reference to the same test case
          return;
        }
        // add the test case ID to the set to track it
        this.testCases.add(testCaseId.toString());
      }
    }

    this.testPoints.set(point.id, point);
  }

  getTestPoints(): TestPoint[] {
    return [...this.testPoints.values()];
  }

  getTestConfig(alias: string) : TestConfiguration {
    if (! this.hasConfig(alias)) {
      throw new Error(`Unrecognized configuration ${alias}.`);
    }
    return this.supportedTestConfigs.get(alias) as TestConfiguration;
  }

  getTestConfigs(alias : string | undefined) : Map<string,TestConfiguration> {
    if (alias) {
      if (! this.hasConfig(alias)) {
        throw new Error(`Unrecognized configuration ${alias}.`);
      }

      let result = new Map<string,TestConfiguration>();
      let config = this.supportedTestConfigs.get(alias) as TestConfiguration;
      this.supportedTestConfigs.forEach( (value : TestConfiguration, key:string) => {
        if (value.id == config.id) {
          result.set(key, config);
        }
      });

      return result;
    } else {
      return this.supportedTestConfigs;
    }
  }

  hasConfig(name: string): boolean {
    return this.supportedTestConfigs.has(name);
  }

  hasSyncTestOutcomeEnabled() : boolean {
    return this.syncOutcomeAcrossSuites;
  }
}
