import tl = require("azure-pipelines-task-lib/task");
import * as TaskParameters from "./TaskParameters";
import { TestResultContext } from "./context/TestResultContext";
import { TestFrameworkResultReader } from "./framework/TestFrameworkResultReader";
import * as TestResultProcessorFactory from "./processing/TestResultProcessorFactory";
import { TestRunPublisher } from "./publishing/TestRunPublisher";
import { getLogger } from './services/Logger';
import * as statusFilter from './services/StatusFilter';

async function run() {

  try {

    if (process.execArgv.includes("--inspect")) {
      console.log(`Waiting for debugger. Process ${process.pid}`);
      await new Promise( resolve => setTimeout(resolve, 30000));
    }

    const logger = getLogger();

    // construct the context by locating the test plan,
    // populating the test points and supported configurations
    logger.info("##[section]Locating Test Plan details...");
    const contextParameters = TaskParameters.getTestContextParameters();
    const context = await TestResultContext.create(contextParameters);

    // read test framework result files by converting
    // one or more test result files into a common format
    logger.info('##[section]Reading test framework results...');
    const frameworkParameters = TaskParameters.getFrameworkParameters();
    const frameworkResults = await TestFrameworkResultReader.readResults(frameworkParameters);

    // process framework results by mapping them to test points
    // in the test plan. also identify which test results could not be resolved
    logger.info("##[section]Mapping test framework results to Test Points...");
    const processorParameters = TaskParameters.getProcessorParameters();
    const resultProcessor = TestResultProcessorFactory.create(processorParameters, context);
    const testRunData = await resultProcessor.process(frameworkResults);

    // publish a new test run with the mapped outputs
    logger.info('##[section]Publishing TestResults ...')
    const publisherParameters = TaskParameters.getPublisherParameters();
    const publisher = await TestRunPublisher.create(publisherParameters);
    await publisher.publishTestRun(testRunData);

    // finalize task outcome
    statusFilter.analyzeTestResults(frameworkResults);

    // publish anonymous usage data
    tl.setResult(tl.TaskResult.Succeeded,'');    

  } catch (err) {
    if (err instanceof Error) {
      tl.setResult(tl.TaskResult.Failed, err.message);
    } else {
      tl.setResult(tl.TaskResult.Failed, 'An unhandled error occurred.');
    }
  }
}

run();