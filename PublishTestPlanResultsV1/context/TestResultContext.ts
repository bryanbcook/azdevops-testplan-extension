import { TestConfiguration, TestPlan, TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestResultContextParameters } from "./TestResultContextParameters";
import { TestResultContextBuilder } from "./TestResultContextBuilder";

export class TestResultContext {

    static async create(parameters: TestResultContextParameters): Promise<TestResultContext> {
        var builder = TestResultContextBuilder.setup(parameters);
        return await builder.build();
    }

    // logger
    public readonly projectId : string;
    public readonly projectName : string;
    public readonly testPlan : TestPlan;
    
    private readonly supportedTestConfigs: Map<string,TestConfiguration>;
    private readonly testPoints : Map<number,TestPoint>;

    constructor(projectId : string, projectName : string, testPlan: TestPlan) {
        this.projectId = projectId;
        this.projectName = projectName;
        this.testPlan = testPlan;
        this.supportedTestConfigs = new Map<string,TestConfiguration>();
        this.testPoints = new Map<number,TestPoint>();
    }

    addConfig(config: TestConfiguration) {
        let key = config.id.toString();
        this.supportedTestConfigs.set(key, config);
        this.supportedTestConfigs.set(config.name, config);
    }

    addConfigAlias(alias: string, config: string) {
        if (this.supportedTestConfigs.has(config)) {
            var item = this.supportedTestConfigs.get(config) as TestConfiguration;
            if (! this.supportedTestConfigs.has(alias)) {
                this.supportedTestConfigs.set(alias, item);
            } else {
                // warn about duplicate alias
            }
        } else {
            // throw unrecognized configuration
            throw new Error(`Unrecognized config name '${config}'.`)
        }
    }

    addTestPoint(point: TestPoint) {
        this.testPoints.set(point.id, point);
    }
}
