import { expect } from 'chai';
import sinon from 'sinon';

import { AdoWrapper, TestPoint2 } from '../services/AdoWrapper';
import { TestRunReporter } from '../reporting/TestRunReporter';
import { ILogger, NullLogger } from "../services/Logger";
import { TestResultContext } from '../context/TestResultContext';
import { TestResultProcessorResult } from '../processing/TestResultProcessor';
import { newTestFrameworkResult, newTestPoint } from './testUtil';

describe('TestRunReporter', () => {

    var subject : TestRunReporter;

    // dependencies
    var ado : sinon.SinonStubbedInstance<AdoWrapper>;
    var loggerStub : sinon.SinonStubbedInstance<ILogger>;

    // data
    var ctx : TestResultContext;
    var testResults : TestResultProcessorResult;

    beforeEach(() => {
        ado = sinon.createStubInstance(AdoWrapper);
        loggerStub = sinon.createStubInstance<ILogger>(NullLogger);
        subject = new TestRunReporter(ado as unknown as AdoWrapper, loggerStub as ILogger);

        ctx = new TestResultContext("projectId", "projectName", {} as any, loggerStub as ILogger);
        testResults = new TestResultProcessorResult("projectId", {} as any);
    });

    context('updateTestCaseAutomationStatus is false', () => {

        beforeEach(() => {
            subject.updateTestCaseAutomationStatus = false;
        });

        it('Should not update workitems when updateTestCaseAutomationStatus is false', async () => {
            // arrange

            // act
            await subject.reportTestResults(ctx, testResults);

            // assert
            sinon.assert.notCalled(ado.updateTestCaseAutomationStatus);
        });

        it('Should log that automation status update is being skipped when updateTestCaseAutomationStatus is false', async () => {
            // arrange

            // act
            await subject.reportTestResults(ctx, testResults);

            // assert
            sinon.assert.calledWith(loggerStub.info, sinon.match("Skipping workitem automation status update because 'updateTestCaseAutomationStatus' is false."));
        });
    });

    context('updateTestCaseAutomationStatus is true', () => {

        beforeEach(() => {
            subject.updateTestCaseAutomationStatus = true;
        })

        it('Should not update workitems when no test cases were matched', async () => {
            // arrange

            // act
            await subject.reportTestResults(ctx, testResults);

            // assert
            sinon.assert.notCalled(ado.updateTestCaseAutomationStatus);
        });

        it('Should log that no test cases were matched', async () => {
            // arrange

            // act
            await subject.reportTestResults(ctx, testResults);

            // assert
            sinon.assert.calledWith(loggerStub.info, sinon.match("Skipping workitem automation status update because no test cases were matched."));
        });

        context('test cases were matched', () => {

            var testPoint1 : TestPoint2;
            var testPoint2 : TestPoint2;
            var testCase1 : string;
            var testCase2 : string;

            beforeEach(() => {

                // add non automated test points to the test plan
                testCase1 = "1";
                testCase2 = "2";
                testPoint1 = newTestPoint(10001, "Test 1", "config1", testCase1);
                testPoint1.workItemProperties = [{ "Microsoft.VSTS.TCM.AutomationStatus": "NotAutomated" }];
                testPoint2 = newTestPoint(10002, "Test 2", "config2", testCase2);
                testPoint2.workItemProperties = [
                    { "Microsoft.VSTS.TCM.AutomatedTestName": "namespace.class.methodname" },
                    { "Microsoft.VSTS.TCM.AutomationStatus": "NotAutomated" }
                ];

                ctx.addTestPoint(testPoint1);
                ctx.addTestPoint(testPoint2);

                // add matches in the test results
                testResults.matches.set(testPoint1.id, newTestFrameworkResult("Test 1", "PASS"));
                testResults.matches.set(testPoint2.id, newTestFrameworkResult("Test 2", "PASS"));
                
            });

            it('Should log that it found test cases to update', async () => {
                // arrange (use defaults above)

                // act
                await subject.reportTestResults(ctx, testResults);

                // assert
                sinon.assert.calledWith(loggerStub.debug, sinon.match(`Located 2 workitems to update.`));
            });

            it('Should update workitems that are not automated', async () => {
                // arrange (use defaults above)

                // act
                await subject.reportTestResults(ctx, testResults);

                // assert
                sinon.assert.calledTwice(ado.updateTestCaseAutomationStatus);
                sinon.assert.calledWithExactly(ado.updateTestCaseAutomationStatus, 
                    ctx.projectId, parseInt(testCase1), true
                );
                sinon.assert.calledWithExactly(ado.updateTestCaseAutomationStatus, 
                    ctx.projectId,parseInt(testCase2), true
                );
            });

            it('Should not update workitems that are already automated', async () => {
                // arrange
                testPoint1.workItemProperties = [{ "Microsoft.VSTS.TCM.AutomationStatus": "Automated" }];
                testPoint2.workItemProperties = [{ "Microsoft.VSTS.TCM.AutomationStatus": "Automated" }];

                // act
                await subject.reportTestResults(ctx, testResults);

                // assert
                sinon.assert.notCalled(ado.updateTestCaseAutomationStatus);
            });
        })
    });

    

})