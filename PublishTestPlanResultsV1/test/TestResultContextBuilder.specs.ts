import * as assert from 'assert';
import * as sinon from 'sinon';
import { TestConfiguration, TestPlan } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestResultContextBuilder } from '../context/TestResultContextBuilder';
import { NullLogger, Logger, LogLevel } from '../services/Logger';
import { AdoWrapper } from '../services/AdoWrapper';
import { shouldThrowAsync } from './testUtil';

describe('TestResultContextBuilder', function() {

    var adoWrapper : sinon.SinonStubbedInstance<AdoWrapper>;
    var subject : TestResultContextBuilder;

    this.beforeEach(function() {
        let logger = new NullLogger();
        adoWrapper = sinon.createStubInstance(AdoWrapper);
        subject = new TestResultContextBuilder(logger, adoWrapper);

        // setup stub with happy path
        adoWrapper.getProjectId.callsFake( async () => { return "1"; });
        adoWrapper.getTestPlans.callsFake( getTestPlans );
    })

    this.afterEach(function() {
        sinon.restore();
    });

    it('Should throw an error if projectName is invalid', async function() {
        // arrange
        subject.projectName = "dummy";
        adoWrapper.getProjectId.throws(new Error("Not found"));
        
        // act
        await shouldThrowAsync(async () => {
            await subject.build();
        }, /Could not resolve project name 'dummy'/);
    });

    it('Should validate projectName', async () => {
        // arrange
        subject.projectName = "dummy";

        // act
        var result = await subject.build();

        // assert
        assert.equal(result.projectName, "dummy");
        assert.equal(result.projectId, "1");
    })

    it('Should find testplan by name if specified', async () =>{
        // arrange
        subject.testPlanName = "myPlan";

        // act
        var result = await subject.build();

        // assert
        assert.notEqual(result.testPlan, null);
    });

    it('Should throw error if testplan is not a valid name', async () =>{
        // arrange
        subject.testPlanName = "invalidPlan";

        // act
        await shouldThrowAsync(async () => {
            await subject.build();
        }, /TestPlan 'invalidPlan' was not found./);
    });

    it('Should populate test configurations if available', async () => {
        // arrange
        adoWrapper.getTestConfigurations.callsFake( getTestConfigurations );

        // act
        await subject.build();

        // assert
        assert.equal(adoWrapper.getTestConfigurations.calledOnce, true);
    });

    context('Test Plan name was not specified', function() {
        it('Should return the active testplan if there is only one available', async () => {
            // arrange
            // don't set a testPlan name
    
            // act
            var result = await subject.build();
    
            // assert
            assert.equal(result.testPlan.name, "activePlan");
        });

        it('Should use test plan with distant expiration date if there are multiple active testplans', async () => {
            // arrange
            adoWrapper.getTestPlans.callsFake( getMultipleTestPlans );
    
            // act
            var result = await subject.build();
    
            // assert
            assert.equal(result.testPlan.name, "activePlan 2");
        });

        async function getMultipleTestPlans() {
            return [
                { name: "activePlan 1", id: 1, endDate: new Date(Date.now() + 10000) } as TestPlan,
                { name: "activePlan 2", id: 2, endDate: new Date(Date.now() + 20000)} as TestPlan
            ];
        }
    });   

    async function getTestPlans() {
        return [
            { name: "myPlan", id: 1 } as TestPlan,
            { name: "activePlan", id: 2, endDate: new Date(Date.now() + 10000)} as TestPlan
        ];
    }

    async function getTestConfigurations() : Promise<TestConfiguration[]> {
        return [
            { id: 1, name: "Default Configuration" } as TestConfiguration,
            { id: 2, name: "Internet Explorer" } as TestConfiguration
        ]
    }    
});