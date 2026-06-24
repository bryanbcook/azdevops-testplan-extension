import { TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestResultContext } from "../context/TestResultContext";
import { TestResultProcessorResult } from "../processing/TestResultProcessor";
import { AdoWrapper, TestPoint2 } from "../services/AdoWrapper";
import { ILogger, getLogger } from "../services/Logger";
import { TestRunReporterParameters } from "./TestRunReporterParameters";

/* The TestRunReporter is responsible for reporting final test results 
   and updating the automation status of workitems */
export class TestRunReporter {

    /* create a configured instance of the TestRunReporter */
    public static async create( parameters : TestRunReporterParameters) : Promise<TestRunReporter> {
        var ado = await AdoWrapper.createInstance(parameters.collectionUri, parameters.accessToken);
        var logger = getLogger();
        var reporter = new TestRunReporter(ado, logger);
        reporter.updateTestCaseAutomationStatus = parameters.updateTestCaseAutomationStatus;
        return reporter;
    }

    private ado: AdoWrapper;
    private logger: ILogger;

    public updateTestCaseAutomationStatus: boolean;

    constructor(ado : AdoWrapper, logger : ILogger) {
        this.ado = ado;
        this.logger = logger;
        this.updateTestCaseAutomationStatus = false;
    }

    public async reportTestResults(ctx : TestResultContext, testResults: TestResultProcessorResult) : Promise<void> {

        // if the user has not opted in to update automation status, exit.
        if (!this.updateTestCaseAutomationStatus) {
            this.logger.info("Skipping workitem automation status update because 'updateTestCaseAutomationStatus' is false.");
            return;
        }

        // if there are no matched test results, exit.
        if (testResults.matches.size == 0) {
            this.logger.info("Skipping workitem automation status update because no test cases were matched.");
            return;
        }

        // TODO: For reporting purposes
        // - Calculate total number of test cases in the test plan
        // - Calculate total number of (unique) test cases in the test plan
        // - Calculate total number of automated / non-automated test cases
        
        // Locate all TestCases to update 
        this.logger.debug('Locating workitems to update....');
        var workItemsToUpdate = new Set<number>();
        for (const testPointId of testResults.matches.keys()) {
            var testPoint = ctx.getTestPoint(testPointId)! as TestPoint2;
            let testCaseId = testPoint.testCaseReference?.id;
            if (testCaseId && !this.isAutomatedTestCase(testPoint)) {
                workItemsToUpdate.add(parseInt(testCaseId));
            }
        }
        this.logger.debug(`Located ${workItemsToUpdate.size} workitems to update.`);

        // TODO: Locate all TestCases to reset

        this.logger.info("Updating automation status for TestCases...");
        for (const workItemId of workItemsToUpdate) {
            this.logger.debug(`Updating automation status for TestCase ${workItemId}...`);
            await this.ado.updateTestCaseAutomationStatus(workItemId, true);
        }

        // TODO: Report summary
        // - Total number of test cases in test plan
        // - Total number of test cases in test plan (unique)
        // - Total number of automated test cases in test plan
        // - Total number of non-automated test cases in test plan
        // - Total number of test cases updated to automated + percentage change
        // - Total number of test cases that were already automated (coverage percentage)
    }

    private isAutomatedTestCase(testPoint : TestPoint) : boolean {
        try {
            var automationProperty = testPoint.workItemProperties.find(p => p["Microsoft.VSTS.TCM.AutomationStatus"] !== undefined);
            if (!automationProperty) {
                // shouldn't be possible, but if it is, assume not automated
                this.logger.debug(`No automation status property found for test point ${testPoint.id}. Assuming not automated.`);
                return false;
            }
            return automationProperty["Microsoft.VSTS.TCM.AutomationStatus"] === "Automated";
        } catch (error) {
            this.logger.error(`Error checking automation status for test point ${testPoint.id}: ${error}`);
            return false;
        }
    }
}