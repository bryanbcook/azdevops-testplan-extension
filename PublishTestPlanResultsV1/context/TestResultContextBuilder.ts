import { TestConfiguration, TestPlan, TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces"
import { TestResultContextParameters } from "./TestResultContextParameters";
import { AdoWrapper } from "../services/AdoWrapper";
import { ILogger, getLogger } from "../services/Logger"
import { TestResultContext } from "./TestResultContext";

export class TestResultContextBuilder {

    static setup(parameters: TestResultContextParameters): TestResultContextBuilder {
        // construct builder
        var log = getLogger();
        var adoClientWrapper = new AdoWrapper(parameters.collectionUri, parameters.accessToken);
        var builder = new TestResultContextBuilder(log, adoClientWrapper);

        // configure 
        builder.projectName = parameters.projectName;
        builder.testPlanName = parameters.testPlan;

        return builder;
    }

    private log: ILogger;
    private ado: AdoWrapper;

    public projectName: string | undefined;
    public testPlanName: string | undefined;

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
            configs.forEach((config: any) => {
                ctx.addConfig(config)
            });
        }

        let points = await this.getTestPoints();
        if (points) {
            points.forEach((point: any) => {
                ctx.addTestPoint(point);
            });
        }

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

    private async getTestPoints(): Promise<TestPoint[]> {
        this.log.debug("locating test suites and test points");

        return [] as TestPoint[];
    }
}