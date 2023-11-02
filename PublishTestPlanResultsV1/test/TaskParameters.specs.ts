import * as path from 'path';
import * as assert from 'assert';
import * as util from './testUtil';
import * as TaskParameters from '../TaskParameters';

describe('TaskParameters', () => {

    var tp : any;

    before(() => {
        //
        tp = path.join(__dirname, '..', 'TaskParameters.js');
        util.clearData();

        util.setSystemVariable("System.CollectionUri", "https://server");
        util.setSystemVariable("System.AccessToken", "asdf");
        util.setSystemVariable("System.TeamProject", "dummy");

    });

    after(() => {
        util.clearData();
    });

    context('TestResultContextParameters', function() {

        it('Should use user-supplied values if provided', function () {
            // arrange
            util.setInput("collectionUri", "https://my");
            util.setInput("projectName", "myProject");
            util.setInput("accessToken", "myToken")
            util.loadData();
    
            // act
            require(tp);
            
            var parameters = TaskParameters.getTestContextParameters();
    
            // assert
            assert.equal(parameters.collectionUri, "https://my");
            assert.equal(parameters.accessToken, "myToken");
            assert.equal(parameters.projectName, "myProject");
        });
    
        it('Should resolve default taskParameters', function () {
            // arrange
            util.loadData();
    
            // act
            require(tp);
            
            var parameters = TaskParameters.getTestContextParameters();
    
            // assert
            assert.equal(parameters.collectionUri, "https://server");
            assert.equal(parameters.accessToken, "asdf");
            assert.equal(parameters.projectName, "dummy");
        });
    
        it('Should resolve config aliases', function () {
            // arrange
            util.setInput("testConfigAliases",'ie="Internet Explorer", chrome="Chrome"' + ", lnx='Ubuntu 22.04'");
            util.loadData();
    
            // act
            require(tp);
            var parameters = TaskParameters.getTestContextParameters();
    
            // assert
            assert.equal(parameters.testConfigAliases.length, 3);
            assert.equal(parameters.testConfigAliases[0].alias, "ie");
            assert.equal(parameters.testConfigAliases[0].config, "Internet Explorer");
            assert.equal(parameters.testConfigAliases[1].alias, "chrome")
            assert.equal(parameters.testConfigAliases[1].config, "Chrome")
            assert.equal(parameters.testConfigAliases[2].alias, "lnx")
            assert.equal(parameters.testConfigAliases[2].config, "Ubuntu 22.04")
        });
    });

    
});
