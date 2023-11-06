import tl from 'azure-pipelines-task-lib/task';
import { configAlias } from "./context/configAlias";
import { TestResultContextParameters } from "./context/TestResultContextParameters";
import { TestFrameworkParameters } from "./framework/TestFrameworkParameters";
import { TestFrameworkFormat } from './framework/TestFrameworkFormat';

export function getTestContextParameters(): TestResultContextParameters {

    tl.debug("reading TestContextParameters from task inputs.");

    const accessToken   = tl.getInput("accessToken", false) ?? tl.getVariable("SYSTEM_ACCESSTOKEN");
    const collectionUri = tl.getInput("collectionUri", false) ?? tl.getVariable("SYSTEM_COLLECTIONURI");
    const projectName   = tl.getInput("projectName", false) ?? tl.getVariable("SYSTEM_TEAMPROJECT");
    
    var parameters = new TestResultContextParameters(
        (collectionUri as string), 
        (projectName as string), 
        (accessToken as string));

    parameters.testPlan = tl.getInput("testPlan", false);
    parameters.testConfigFilter = tl.getInput("testConfigFilter", false);
    tl.getDelimitedInput("testConfigAliases", ",", false).forEach( (alias: string) => {
        let parts = alias.split("=");
        if (parts.length > 1) {
            parameters.testConfigAliases.push( new configAlias(parts[0], parts[1]) );
        }
    });

    return parameters;
}

export function getFrameworkParameters(): TestFrameworkParameters {
    tl.debug("reading TestFrameworkParameters from task inputs.");

    let testResultFormat = tl.getInput("testResultFormat", false) ?? "xUnit";   
    let testResultFiles  = tl.getDelimitedInput("testResultFiles", ",", true)
        .filter( file => {
        // verify that file exists
        tl.checkPath(file, "testResultFile(s)");
      });
    
    return new TestFrameworkParameters(testResultFiles, testResultFormat);
}
