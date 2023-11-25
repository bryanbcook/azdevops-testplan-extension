import tl = require("azure-pipelines-task-lib/task");
import * as TaskParameters from "./TaskParameters";
import { TestResultContext } from "./context/TestResultContext";
import * as TestFrameworkResultReader from "./framework/TestFrameworkResultReader";
import * as TestResultProcessorFactory from "./processing/TestResultProcessorFactory";

async function run() {

    // construct the context by locating the test plan,
    // populating the test points and supported configurations
    const contextParameters = TaskParameters.getTestContextParameters();
    const context = await TestResultContext.create(contextParameters);

    // read test framework result files
    const frameworkParameters = TaskParameters.getFrameworkParameters();
    const frameworkResults = await TestFrameworkResultReader.readResults(frameworkParameters);

    // process framework results,
    // mapping test points in the test plan to the result
    const processorParameters = TaskParameters.getProcessorParameters();
    const resultProcessor = TestResultProcessorFactory.create(processorParameters, context);
    const testRunData = resultProcessor.process(frameworkResults);

    // publish a new test run with the mapped outputs

}

run();