import { configAlias } from "./context/configAlias";
import { TestResultContextParameters } from "./context/TestResultContextParameters";

export function getTestContextParameters(): TestResultContextParameters {
    var tl = require('azure-pipelines-task-lib/task');

    tl.debug("entering getTestContextParameters");

    const collectionUri = tl.getInput("collectionUri", false) ?? tl.getVariable("SYSTEM_COLLECTIONURI");
    const accessToken   = tl.getInput("accessToken", false) ?? tl.getVariable("SYSTEM_ACCESSTOKEN");
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
