import * as assert from 'assert';
import * as sinon from 'sinon';
import { TestConfiguration, TestPlan } from "azure-devops-node-api/interfaces/TestInterfaces";
import { TestResultContext } from '../context/TestResultContext';

describe('TestResultContext', function() {

    var subject : TestResultContext;
    
    this.beforeEach( function() {
        let testPlan = { id: 1, name: "myTestPlan" } as TestPlan;
        subject = new TestResultContext("projectId", "projectName", testPlan);
    });

    this.afterEach(function() {
        sinon.restore();
    })

    it('Should recognize when config alias refers to invalid config name', async () => {
        // arrange
        subject.addConfig( newConfig(1, "Default Configuration") );

        // act
        assert.throws(() => {
            subject.addConfigAlias("default", "Not a valid Config");
        });
    });

    it('Should allow config aliases to be set', async () => {
        // arrange
        subject.addConfig( newConfig(1, "Default Configuration") );

        // act
        subject.addConfigAlias("default", "Default Configuration");
    });

    function newConfig(id : number, name : string) : TestConfiguration {
        return { id: id, name: name } as TestConfiguration;
    }
})