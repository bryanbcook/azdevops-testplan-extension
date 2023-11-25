import { TestConfiguration, TestPlan, TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestResultContextParameters } from "./TestResultContextParameters";
import { TestResultContextBuilder } from "./TestResultContextBuilder";
import { configAlias } from "./configAlias";
import { config } from "process";

export class TestResultContext {

  static async create(parameters: TestResultContextParameters): Promise<TestResultContext> {
    var builder = TestResultContextBuilder.setup(parameters);
    return await builder.build();
  }

  // logger
  public readonly projectId: string;
  public readonly projectName: string;
  public readonly testPlan: TestPlan;

  private readonly supportedTestConfigs: Map<string, TestConfiguration>;
  private readonly testPoints: Map<number, TestPoint>;

  constructor(projectId: string, projectName: string, testPlan: TestPlan) {
    this.projectId = projectId;
    this.projectName = projectName;
    this.testPlan = testPlan;
    this.supportedTestConfigs = new Map<string, TestConfiguration>();
    this.testPoints = new Map<number, TestPoint>();
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
}
